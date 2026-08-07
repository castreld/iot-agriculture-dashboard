import time
import sys
import requests
import serial

API_URL = "https://pelatihan-api.firaasdev.my.id/api/sensors"
API_KEY = "smart-farming-secret-key-2026"
SERIAL_PORT = "COM7"
BAUD_RATE = 9600

print("=" * 50)
if len(sys.argv) > 1:
    device_id = sys.argv[1].strip()
else:
    try:
        user_input = input("Masukkan nama device/kamu (tekan Enter untuk default 'sensor-node-01'): ").strip()
        device_id = user_input if user_input else "sensor-node-01"
    except EOFError:
        device_id = "sensor-node-01"
        
print(f"MENGGUNAKAN DEVICE ID: {device_id}")
print("=" * 50)

try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=2)
    print(f"Berhasil terhubung ke Arduino di {SERIAL_PORT}...")
except Exception as e:
    print(f"GAGAL membuka {SERIAL_PORT}. Pastikan Serial Monitor di Arduino IDE ditutup!")
    print(f"Error detail: {e}")
    sys.exit(1)

data_buffer = {}
last_post_time = time.time()

while True:
    try:
        if ser.in_waiting > 0:
            line = ser.readline().decode("utf-8", errors="ignore").strip()

            if ":" in line:
                parts = line.split(":", 1)
                key = parts[0].strip().lower()
                try:
                    val = float(parts[1].strip())
                    data_buffer[key] = val
                except ValueError:
                    pass

        current_time = time.time()
        
        if current_time - last_post_time >= 2:
            if data_buffer:
                payload = {
                    "deviceId": device_id,
                    "timestamp": int(current_time * 1000),
                    "payload": data_buffer.copy()
                }
                headers = {
                    "Content-Type": "application/json",
                    "x-api-key": API_KEY
                }
                try:
                    response = requests.post(API_URL, json=payload, headers=headers)
                    print(f"[{time.strftime('%H:%M:%S')}] Terkirim: {data_buffer} | Status: {response.status_code}")
                    
                except Exception as e:
                    print(f"[{time.strftime('%H:%M:%S')}] GAGAL MENGIRIM KE WEB! Error: {e}")
                    
            last_post_time = current_time
            
        time.sleep(0.05)
        
    except KeyboardInterrupt:
        print("\\nProgram dihentikan.")
        ser.close()
        break
    except Exception as e:
        print(f"Error pada loop utama: {e}")
        time.sleep(1)