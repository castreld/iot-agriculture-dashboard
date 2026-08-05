"use client";

import { useState } from "react";
import { useApp } from "../../context/AppContext";
import Header from "../../components/Header";
import {
  Terminal as TerminalIcon,
  Cpu,
  Code,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

export default function TutorialPage() {
  const { lang } = useApp();
  const [activeStep, setActiveStep] = useState(0);
  const [activeOs, setActiveOs] = useState("windows");
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

  const pythonCode = `import time
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
`;

  const steps = [
    { id: 0, label: lang === "en" ? "Prerequisites" : "Prasyarat", icon: TerminalIcon },
    { id: 1, label: lang === "en" ? "Arduino Setup" : "Pengaturan Arduino", icon: Cpu },
    { id: 2, label: lang === "en" ? "Python Integration" : "Integrasi Python", icon: Code },
    { id: 3, label: lang === "en" ? "Troubleshooting" : "Pencarian Masalah", icon: HelpCircle },
  ];

  const content: any = {
    en: {
      title: "Hardware Onboarding Guide",
      subtitle: "Connect your hardware nodes to the cloud telemetry engine",
      prevBtn: "Back",
      nextBtn: "Next",
      osTabs: {
        windows: "Windows",
        macos: "macOS",
        linux: "Linux",
      },
      prereq: {
        intro: "Configure your environment variables and toolsets to enable physical sensor communication.",
        step1Title: "1. Install Python Development Kit",
        step1Win: "Go to python.org, download the installer, and CRITICALLY tick the checkbox that says 'Add Python to PATH' before completing the installation process.",
        step1Mac: "Ensure Xcode is updated. Run Terminal and execute: brew install python. Verify the installation by running python3 --version.",
        step1Linux: "Update apt lists and fetch Python packages: sudo apt update && sudo apt install python3 python3-pip python3-serial.",
        step2Title: "2. Install PIP Package Manager",
        step2Desc: "If pip is missing, download the bootstrap helper script and run it using python. Execute the following terminal commands:",
        step2Curl: "curl -O https://bootstrap.pypa.io/get-pip.py",
        step2Run: "python get-pip.py",
        step3Title: "3. Bind Libraries & Dependencies",
        step3Desc: "Use pip to bind the serial communication and network fetch packages:",
        step3Cmd: "pip install pyserial requests"
      },
      arduino: {
        intro: "Arduino devices must output telemetry in a key:value structure to enable the bridging script to dynamically group values.",
        badTitle: "❌ INCOMPATIBLE CODE STRUCTURE",
        badCode: `Serial.println(humidity);
delay(1000);
Serial.println(temperature);`,
        badDesc: "Sends integers directly with lines. The parsing script cannot identify which reading corresponds to which sensor.",
        goodTitle: "✅ COMPATIBLE MULTIPLEXED FORMAT",
        goodCode: `Serial.print("kelembaban:");
Serial.println(humidity);
Serial.print("suhu:");
Serial.println(temperature);`,
        goodDesc: "Labels each sensor output with a prefix and a colon. Allows the python pipeline to aggregate multiple variables.",
      },
      python: {
        warning: "CRITICAL: Close the Serial Monitor inside the Arduino IDE before executing the python bridge! COM serial lines can only bind to one application at a time.",
        explainerTitle: "Script Functional Breakdown",
        explainers: [
          {
            title: "1. Variable Configuration",
            desc: "Sets the cloud endpoint, authorization key for secure intake, targeted serial port, and communication baud rate."
          },
          {
            title: "2. Serial Initialization",
            desc: "Binds to the targeted port with pyserial. Includes safety try-except blocks that alert the user if the port is busy or disconnected."
          },
          {
            title: "3. Colon-Delimited Parsing",
            desc: "Reads raw line feeds, checks for key-value colons, sanitizes spaces, downcases key names, and records values in a buffer."
          },
          {
            title: "4. Periodic Transmission",
            desc: "Triggers every 2 seconds, copying buffered values into a multiplexed JSON package, and makes a POST call to the backend."
          }
        ]
      },
      trouble: {
        intro: "Check these diagnostics if the terminal outputs errors or dashboard status cards display disconnected.",
        items: [
          {
            title: "Port Identification",
            desc: "Verify that the SERIAL_PORT string matches the port mapped in your OS. On Windows it looks like COM3, on macOS/Linux it looks like /dev/tty.usbmodem101."
          },
          {
            title: "Port Access Denied",
            desc: "If python reports a busy port error, close the serial monitor tab inside your Arduino IDE compiler."
          },
          {
            title: "Module Not Found",
            desc: "If Python outputs ModuleNotFoundError, verify that pip dependencies were installed to the correct local environment."
          },
          {
            title: "Status Code 403 / 401",
            desc: "Ensure that API_KEY matches 'smart-farming-secret-key-2026' exactly inside your python script configuration header."
          }
        ]
      }
    },
    id: {
      title: "Panduan Integrasi Perangkat Keras",
      subtitle: "Hubungkan modul perangkat keras fisik Anda ke platform telemetri awan",
      prevBtn: "Kembali",
      nextBtn: "Lanjut",
      osTabs: {
        windows: "Windows",
        macos: "macOS",
        linux: "Linux",
      },
      prereq: {
        intro: "Persiapkan lingkungan pengembangan Anda untuk menjembatani perangkat Arduino dengan platform cerdas.",
        step1Title: "1. Instal Python Development Kit",
        step1Win: "Unduh file instalasi Python dari situs python.org resmi. Klik dua kali file penginstal dan pastikan Anda MENCENTANG kotak 'Add Python to PATH' sebelum menginstal.",
        step1Mac: "Pastikan Xcode terupdate. Jalankan terminal dan ketikkan: brew install python. Verifikasi dengan perintah python3 --version.",
        step1Linux: "Update daftar apt dan instal Python serta pip: sudo apt update && sudo apt install python3 python3-pip python3-serial.",
        step2Title: "2. Instal PIP Package Manager",
        step2Desc: "Jika pip tidak tersedia, unduh skrip pembantu bootstrap lalu jalankan menggunakan perintah Python berikut:",
        step2Curl: "curl -O https://bootstrap.pypa.io/get-pip.py",
        step2Run: "python get-pip.py",
        step3Title: "3. Instal Library dan Dependensi",
        step3Desc: "Gunakan pip untuk menginstal dependensi komunikasi serial dan permintaan HTTP yang diperlukan:",
        step3Cmd: "pip install pyserial requests"
      },
      arduino: {
        intro: "Perangkat Arduino harus memancarkan data sensor menggunakan format label key:value agar dapat dikelompokkan secara dinamis oleh skrip jembatan.",
        badTitle: "❌ FORMAT KODE INKOMPATIBEL",
        badCode: `Serial.println(humidity);
delay(1000);
Serial.println(temperature);`,
        badDesc: "Mengirimkan nilai secara mentah baris demi baris. Skrip jembatan tidak dapat membedakan nilai dari masing-masing sensor.",
        goodTitle: "✅ FORMAT MULTIPLEXED KOMPATIBEL",
        goodCode: `Serial.print("kelembaban:");
Serial.println(humidity);
Serial.print("suhu:");
Serial.println(temperature);`,
        goodDesc: "Menandai keluaran sensor dengan awalan dan titik dua. Memungkinkan pipeline python untuk mengelompokkan berbagai metrik data.",
      },
      python: {
        warning: "PERINGATAN KRITIS: Tutup tab Serial Monitor di dalam Arduino IDE sebelum menjalankan skrip Python! Port COM hanya dapat terhubung ke satu aplikasi saja.",
        explainerTitle: "Rincian Fungsi Skrip",
        explainers: [
          {
            title: "1. Konfigurasi Variabel",
            desc: "Mengatur alamat endpoint web api, kunci autentikasi aman, identifikasi port COM serial, dan kecepatan data BAUD rate."
          },
          {
            title: "2. Inisialisasi Koneksi Serial",
            desc: "Melakukan pengikatan ke port serial. Dilengkapi blok try-except untuk mendeteksi apakah port sedang digunakan atau kabel terputus."
          },
          {
            title: "3. Parsing Pemisah Titik Dua",
            desc: "Membaca baris mentah, mendeteksi pemisah titik dua, menormalkan format teks kunci sensor, dan menyimpannya di memori sementara."
          },
          {
            title: "4. Pengiriman Data Berkala",
            desc: "Berjalan setiap 2 detik sekali untuk mengirimkan akumulasi data sensor dalam format payload JSON multiplexed ke backend API."
          }
        ]
      },
      trouble: {
        intro: "Periksa langkah diagnosa berikut jika terminal menampilkan pesan error atau status dasbor terputus.",
        items: [
          {
            title: "Identifikasi Port COM",
            desc: "Pastikan parameter SERIAL_PORT cocok dengan port Arduino di OS Anda (Windows: COM3, macOS/Linux: /dev/tty.usbmodem101)."
          },
          {
            title: "Akses Port Ditolak",
            desc: "Jika python memunculkan error port sibuk, matikan jendela monitor serial yang terbuka di program Arduino IDE Anda."
          },
          {
            title: "Module Not Found",
            desc: "Apabila program menampilkan ModuleNotFoundError, pastikan instalasi dependensi pip telah dijalankan pada environment Python yang aktif."
          },
          {
            title: "Error Status Code 403 / 401",
            desc: "Pastikan API_KEY pada script Python terkonfigurasi tepat menggunakan nilai 'smart-farming-secret-key-2026'."
          }
        ]
      }
    }
  };

  const activeContent = content[lang];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-600/10 rounded-xl text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 animate-pulse">
            <Cpu className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100">
              {activeContent.title}
            </h2>
            <p className="text-sm text-zinc-550 dark:text-zinc-400">
              {activeContent.subtitle}
            </p>
          </div>
        </div>

        <div className="flex overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 pb-2 gap-2 scrollbar-none">
          {steps.map((step) => {
            const StepIcon = step.icon;
            const isActive = activeStep === step.id;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setActiveStep(step.id);
                  setExpandedSection(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-md dark:shadow-emerald-950/20"
                    : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300"
                }`}
              >
                <StepIcon className="h-4 w-4" />
                {step.label}
              </button>
            );
          })}
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-md dark:shadow-xl backdrop-blur-sm transition-all duration-300 min-h-[400px] flex flex-col justify-between">
          <div className="space-y-6">
            {activeStep === 0 && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {activeContent.prereq.intro}
                </p>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-450">
                    {activeContent.prereq.step1Title}
                  </h3>

                  <div className="flex gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-1">
                    {Object.keys(activeContent.osTabs).map((osKey) => (
                      <button
                        key={osKey}
                        onClick={() => setActiveOs(osKey)}
                        className={`px-4 py-2 text-xs font-bold rounded-t-lg border-b-2 transition-all duration-200 ${
                          activeOs === osKey
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-450"
                            : "border-transparent text-zinc-500 hover:text-zinc-700"
                        }`}
                      >
                        {activeContent.osTabs[osKey]}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 text-xs leading-relaxed text-slate-800 dark:text-slate-200 font-sans">
                    {activeOs === "windows" && <p className="font-semibold">{activeContent.prereq.step1Win}</p>}
                    {activeOs === "macos" && <p>{activeContent.prereq.step1Mac}</p>}
                    {activeOs === "linux" && <p>{activeContent.prereq.step1Linux}</p>}
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-450">
                    {activeContent.prereq.step2Title}
                  </h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400">
                    {activeContent.prereq.step2Desc}
                  </p>
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 font-mono text-xs text-slate-800 dark:text-emerald-400 overflow-x-auto space-y-1.5">
                    <div>{activeContent.prereq.step2Curl}</div>
                    <div>{activeContent.prereq.step2Run}</div>
                  </pre>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-450">
                    {activeContent.prereq.step3Title}
                  </h3>
                  <p className="text-xs text-zinc-550 dark:text-zinc-400">
                    {activeContent.prereq.step3Desc}
                  </p>
                  <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 font-mono text-xs text-slate-800 dark:text-emerald-400 overflow-x-auto">
                    <code>{activeContent.prereq.step3Cmd}</code>
                  </pre>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {activeContent.arduino.intro}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="border border-red-500/20 dark:border-red-500/10 rounded-xl p-5 bg-red-50/10 dark:bg-red-950/5 space-y-3">
                    <h4 className="text-xs font-black text-red-500 tracking-wider uppercase flex items-center gap-1.5">
                      <XCircle className="h-4 w-4" />
                      {activeContent.arduino.badTitle}
                    </h4>
                    <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-650 dark:text-zinc-400 border border-slate-200 dark:border-slate-850 overflow-x-auto">
                      <code>{activeContent.arduino.badCode}</code>
                    </pre>
                    <p className="text-xs text-zinc-550 dark:text-zinc-500 leading-relaxed">
                      {activeContent.arduino.badDesc}
                    </p>
                  </div>

                  <div className="border border-emerald-500/20 dark:border-emerald-500/10 rounded-xl p-5 bg-emerald-50/10 dark:bg-emerald-950/5 space-y-3">
                    <h4 className="text-xs font-black text-emerald-500 tracking-wider uppercase flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" />
                      {activeContent.arduino.goodTitle}
                    </h4>
                    <pre className="bg-slate-100 dark:bg-slate-950 p-4 rounded-lg text-xs font-mono text-slate-800 dark:text-emerald-400 border border-slate-200 dark:border-slate-850 overflow-x-auto">
                      <code>{activeContent.arduino.goodCode}</code>
                    </pre>
                    <p className="text-xs text-zinc-550 dark:text-zinc-550 leading-relaxed">
                      {activeContent.arduino.goodDesc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 p-4 rounded-xl flex gap-3 text-xs leading-relaxed">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-red-500 animate-bounce" />
                  <span className="font-semibold">{activeContent.python.warning}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="relative rounded-xl overflow-hidden border border-slate-250 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-950">
                    <div className="bg-slate-200/50 dark:bg-zinc-900 px-4 py-2 border-b border-slate-300 dark:border-zinc-850 flex items-center justify-between text-slate-650 dark:text-zinc-400 font-mono text-[10px]">
                      <span className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-500">
                        <TerminalIcon className="h-3 w-3" />
                        main.py
                      </span>
                      <span>PYTHON 3</span>
                    </div>
                    <pre className="p-5 overflow-y-auto max-h-[380px] text-[10px] font-mono text-slate-800 dark:text-emerald-400/90 leading-relaxed scrollbar-thin scrollbar-thumb-zinc-800 bg-slate-50 dark:bg-slate-950 border-none">
                      <code>{pythonCode}</code>
                    </pre>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-350">
                      {activeContent.python.explainerTitle}
                    </h4>
                    <div className="space-y-2">
                      {activeContent.python.explainers.map((exp: any, idx: number) => {
                        const isExpanded = expandedSection === idx;
                        return (
                          <div
                            key={idx}
                            className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50/50 dark:bg-zinc-950/20 transition-all duration-300"
                          >
                            <button
                              onClick={() => setExpandedSection(isExpanded ? null : idx)}
                              className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/20"
                            >
                              <span>{exp.title}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-zinc-400" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-3 text-xs leading-relaxed text-zinc-550 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-900 pt-2 bg-white dark:bg-zinc-900/40">
                                {exp.desc}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                <p className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                  {activeContent.trouble.intro}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeContent.trouble.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 bg-zinc-50/30 dark:bg-zinc-950/10 space-y-2 hover:border-emerald-500/40 dark:hover:border-emerald-500/20 transition-colors duration-300 shadow-sm"
                    >
                      <h4 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-550 dark:text-zinc-450 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-6 border-t border-zinc-250 dark:border-zinc-850 mt-6">
            <button
              onClick={() => {
                setActiveStep((prev) => Math.max(0, prev - 1));
                setExpandedSection(null);
              }}
              disabled={activeStep === 0}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-300 ${
                activeStep === 0
                  ? "border-zinc-200 dark:border-zinc-850 text-zinc-400 cursor-not-allowed opacity-50"
                  : "border-zinc-250 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {activeContent.prevBtn}
            </button>

            <button
              onClick={() => {
                setActiveStep((prev) => Math.min(steps.length - 1, prev + 1));
                setExpandedSection(null);
              }}
              disabled={activeStep === steps.length - 1}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold border transition-all duration-300 ${
                activeStep === steps.length - 1
                  ? "border-zinc-200 dark:border-zinc-850 text-zinc-400 cursor-not-allowed opacity-50"
                  : "border-zinc-250 dark:border-zinc-750 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {activeContent.nextBtn}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
