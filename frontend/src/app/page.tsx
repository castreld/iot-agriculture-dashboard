"use client";

import { useEffect, useState, useRef } from "react";
import { socket } from "../socket";
import { useApp } from "../context/AppContext";
import { translations } from "../translations";
import Header from "../components/Header";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Activity,
  Cpu,
  Droplet,
  Clock,
  AlertTriangle,
  Terminal as TerminalIcon,
  Thermometer,
  Trash2,
  Plus,
} from "lucide-react";

interface SensorData {
  deviceId: string;
  timestamp: number;
  payload: Record<string, number>;
}

interface NotificationItem {
  id: string;
  timestamp: number;
  deviceId: string;
  metric: string;
  value: number;
}

export default function Dashboard() {
  const { lang, theme } = useApp();
  const t = translations[lang];

  const [isConnected, setIsConnected] = useState(false);
  const [deviceData, setDeviceData] = useState<Record<string, SensorData[]>>({});
  const [allReadings, setAllReadings] = useState<SensorData[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("all");
  const [selectedSensorType, setSelectedSensorType] = useState<string>("all");
  const [isMounted, setIsMounted] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [newDeviceId, setNewDeviceId] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const titleClicks = useRef<number[]>([]);
  const simInterval = useRef<NodeJS.Timeout | null>(null);
  const simValues = useRef<Record<string, { suhu: number; kelembaban: number }>>({});

  const sensorTypes = [
    "all",
    ...Array.from(
      new Set([
        "kelembaban",
        "suhu",
        ...allReadings.flatMap((item) => Object.keys(item.payload || {})),
      ])
    )
  ];

  useEffect(() => {
    setIsMounted(true);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onSensorData = (data: SensorData) => {
      setAllReadings((prev) => [...prev.slice(-49), data]);
      setDeviceData((prev) => {
        const list = prev[data.deviceId] || [];
        return {
          ...prev,
          [data.deviceId]: [...list.slice(-29), data],
        };
      });

      if (data.payload) {
        const moistureVal = data.payload["moisture"] ?? data.payload["kelembaban"];
        const tempVal = data.payload["temperature"] ?? data.payload["suhu"];
        const newNotifs: NotificationItem[] = [];

        if (moistureVal !== undefined && moistureVal < 30) {
          newNotifs.push({
            id: `${data.deviceId}-moist-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            deviceId: data.deviceId,
            metric: "moisture",
            value: moistureVal,
          });
        }
        if (tempVal !== undefined && tempVal > 35) {
          newNotifs.push({
            id: `${data.deviceId}-temp-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            deviceId: data.deviceId,
            metric: "temperature",
            value: tempVal,
          });
        }

        if (newNotifs.length > 0) {
          setNotifications((prev) => [...newNotifs, ...prev].slice(0, 5));
        }
      }
    };

    socket.connect();
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("sensor-data", onSensorData);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("sensor-data", onSensorData);
      socket.disconnect();
      if (simInterval.current) {
        clearInterval(simInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (sensorTypes.length > 0 && !selectedSensorType) {
      setSelectedSensorType(sensorTypes[0]);
    }
  }, [sensorTypes, selectedSensorType]);

  const handleTitleClick = () => {
    const now = Date.now();
    const validClicks = titleClicks.current.filter((t) => now - t <= 2000);
    const updatedClicks = [...validClicks, now];
    titleClicks.current = updatedClicks;
    if (updatedClicks.length >= 5) {
      setIsAdminMode((prev) => !prev);
      titleClicks.current = [];
    }
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = newDeviceId.trim();
    if (!cleanId) return;
    setDeviceData((prev) => {
      if (prev[cleanId]) return prev;
      return {
        ...prev,
        [cleanId]: [],
      };
    });
    setNewDeviceId("");
  };

  const handleRemoveDevice = (deviceId: string) => {
    setDeviceData((prev) => {
      const updated = { ...prev };
      delete updated[deviceId];
      return updated;
    });
    setAllReadings((prev) => prev.filter((r) => r.deviceId !== deviceId));
    if (selectedDevice === deviceId) {
      setSelectedDevice("all");
    }
  };

  const triggerSimulation = () => {
    if (simulating) {
      if (simInterval.current) {
        clearInterval(simInterval.current);
        simInterval.current = null;
      }
      setSimulating(false);
    } else {
      setSimulating(true);
      const devices = ["sensor-node-01", "sensor-node-02", "sensor-node-03"];
      
      const intervalId = setInterval(async () => {
        const now = Date.now();
        await Promise.all(
          devices.map(async (deviceId) => {
            if (!simValues.current[deviceId]) {
              simValues.current[deviceId] = {
                suhu: 20 + Math.random() * 10,
                kelembaban: 30 + Math.random() * 30
              };
            }
            const diffSuhu = Math.random() * 2 - 1;
            const diffKelembaban = Math.random() * 6 - 3;
            
            simValues.current[deviceId].suhu = Number(
              Math.min(40, Math.max(15, simValues.current[deviceId].suhu + diffSuhu)).toFixed(1)
            );
            simValues.current[deviceId].kelembaban = Number(
              Math.min(95, Math.max(10, simValues.current[deviceId].kelembaban + diffKelembaban)).toFixed(1)
            );

            const payload = {
              deviceId,
              timestamp: now,
              payload: {
                suhu: simValues.current[deviceId].suhu,
                kelembaban: simValues.current[deviceId].kelembaban,
              },
            };

            try {
              await fetch("https://pelatihan-api.firaasdev.my.id/api/sensors", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-api-key": "smart-farming-secret-key-2026",
                },
                body: JSON.stringify(payload),
              });
            } catch (err) {
              console.error(err);
            }
          })
        );
      }, 2000);
      simInterval.current = intervalId;
    }
  };

  const formatTime = (ts: number | string) => {
    if (typeof ts === "number") {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
    return ts;
  };

  const formatPayload = (payload: Record<string, number>) => {
    return Object.entries(payload)
      .map(([key, val]) => `${key}: ${val}`)
      .join(" | ");
  };

  const activeDevices = Object.keys(deviceData);
  const currentReading = allReadings[allReadings.length - 1];

  const filteredData =
    selectedDevice === "all"
      ? allReadings
      : deviceData[selectedDevice] || [];

  const displayReading =
    selectedDevice === "all"
      ? currentReading
      : (deviceData[selectedDevice] || [])[
          (deviceData[selectedDevice] || []).length - 1
        ];

  const latestMoistures = Object.keys(deviceData).map((devId) => {
    const logs = deviceData[devId] || [];
    if (logs.length === 0) return null;
    const latest = logs[logs.length - 1];
    return latest.payload["moisture"] ?? latest.payload["kelembaban"] ?? null;
  }).filter((v) => v !== null) as number[];
  const avgMoisture = latestMoistures.length > 0 
    ? Number((latestMoistures.reduce((a, b) => a + b, 0) / latestMoistures.length).toFixed(1)) 
    : null;

  const latestTemps = Object.keys(deviceData).map((devId) => {
    const logs = deviceData[devId] || [];
    if (logs.length === 0) return null;
    const latest = logs[logs.length - 1];
    return latest.payload["temperature"] ?? latest.payload["suhu"] ?? null;
  }).filter((v) => v !== null) as number[];
  const avgTemp = latestTemps.length > 0 
    ? Number((latestTemps.reduce((a, b) => a + b, 0) / latestTemps.length).toFixed(1)) 
    : null;

  const latestMoisture = selectedDevice === "all"
    ? avgMoisture
    : (deviceData[selectedDevice] && deviceData[selectedDevice].length > 0
        ? ((deviceData[selectedDevice][deviceData[selectedDevice].length - 1].payload["moisture"] ??
            deviceData[selectedDevice][deviceData[selectedDevice].length - 1].payload["kelembaban"] ?? null))
        : null);

  const latestTemperature = selectedDevice === "all"
    ? avgTemp
    : (deviceData[selectedDevice] && deviceData[selectedDevice].length > 0
        ? ((deviceData[selectedDevice][deviceData[selectedDevice].length - 1].payload["temperature"] ??
            deviceData[selectedDevice][deviceData[selectedDevice].length - 1].payload["suhu"] ?? null))
        : null);

  const activeSensorValue =
    displayReading && selectedSensorType
      ? displayReading.payload[selectedSensorType] ?? 0
      : 0;

  const linesToPlot: { key: string; name: string; color: string }[] = [];
  const colors = ["#10b981", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f43f5e", "#6366f1"];
  let colorIdx = 0;

  if (selectedDevice === "all") {
    activeDevices.forEach((devId) => {
      if (selectedSensorType === "all") {
        sensorTypes.forEach((sType) => {
          if (sType !== "all") {
            linesToPlot.push({
              key: `${devId}_${sType}`,
              name: `${devId.toUpperCase()} - ${sType.toUpperCase()}`,
              color: colors[colorIdx % colors.length]
            });
            colorIdx++;
          }
        });
      } else {
        linesToPlot.push({
          key: `${devId}_${selectedSensorType}`,
          name: `${devId.toUpperCase()} - ${selectedSensorType.toUpperCase()}`,
          color: colors[colorIdx % colors.length]
        });
        colorIdx++;
      }
    });
  } else {
    if (selectedSensorType === "all") {
      sensorTypes.forEach((sType) => {
        if (sType !== "all") {
          linesToPlot.push({
            key: sType,
            name: sType.toUpperCase(),
            color: colors[colorIdx % colors.length]
          });
          colorIdx++;
        }
      });
    } else {
      linesToPlot.push({
        key: "value",
        name: selectedSensorType.toUpperCase(),
        color: selectedSensorType === "temperature" || selectedSensorType === "suhu" ? "#f59e0b" : "#10b981"
      });
    }
  }

  let chartData: any[] = [];
  if (selectedDevice === "all" && filteredData.length > 0) {
    const buckets: Record<number, any> = {};
    filteredData.forEach((item) => {
      const bucketTime = Math.round(item.timestamp / 2000) * 2000;
      if (!buckets[bucketTime]) {
        buckets[bucketTime] = {
          timestamp: bucketTime,
          timeString: formatTime(bucketTime),
        };
      }
      if (item.payload) {
        Object.keys(item.payload).forEach((k) => {
          buckets[bucketTime][`${item.deviceId}_${k}`] = item.payload[k];
        });
      }
    });
    chartData = Object.values(buckets).sort((a: any, b: any) => a.timestamp - b.timestamp);
  } else {
    chartData = filteredData.map((item) => {
      const dataPoint: any = {
        ...item,
        value: item.payload[selectedSensorType] ?? 0,
        timeString: formatTime(item.timestamp),
      };
      if (item.payload) {
        Object.keys(item.payload).forEach((k) => {
          dataPoint[k] = item.payload[k];
        });
      }
      return dataPoint;
    });
  }

  const getChartTitle = () => {
    if (selectedSensorType === "all") {
      return lang === "en" ? "All Sensors Telemetry Stream" : "Aliran Telemetri Semua Sensor";
    }
    const sensorLabel = selectedSensorType
      ? selectedSensorType.charAt(0).toUpperCase() + selectedSensorType.slice(1)
      : "";
    if (lang === "en") {
      return `${sensorLabel || "Moisture"} Telemetry Stream`;
    } else {
      return `Aliran Telemetri ${sensorLabel || "Kelembaban"}`;
    }
  };

  const getAlertMessage = () => {
    if (!displayReading) return "";
    const isMoistureAlert = (displayReading.payload["moisture"] ?? displayReading.payload["kelembaban"] ?? 100) < 30;
    const isTempAlert = (displayReading.payload["temperature"] ?? displayReading.payload["suhu"] ?? 0) > 35;
    const currentMoisture = displayReading.payload["moisture"] ?? displayReading.payload["kelembaban"] ?? 0;
    const currentTemp = displayReading.payload["temperature"] ?? displayReading.payload["suhu"] ?? 0;

    if (selectedSensorType === "all") {
      if (isMoistureAlert && isTempAlert) {
        return lang === "en"
          ? `CRITICAL ALERT: Moisture is ${currentMoisture}% (under 30%) and Temp is ${currentTemp}°C (above 35°C) on Device [${displayReading.deviceId}]!`
          : `PERINGATAN KRITIS: Kelembaban ${currentMoisture}% (di bawah 30%) dan Suhu ${currentTemp}°C (di atas 35°C) pada Perangkat [${displayReading.deviceId}]!`;
      }
      if (isMoistureAlert) {
        return t.criticalAlert
          .replace("{moisture}", currentMoisture.toString())
          .replace("{deviceId}", displayReading.deviceId);
      }
      if (isTempAlert) {
        return lang === "en"
          ? `CRITICAL TEMPERATURE ALERT: Temperature level is at ${currentTemp}°C (above 35°C) on Device [${displayReading.deviceId}]!`
          : `PERINGATAN SUHU KRITIS: Tingkat suhu berada di ${currentTemp}°C (di atas 35°C) pada Perangkat [${displayReading.deviceId}]!`;
      }
      return "";
    }

    const isTemp = selectedSensorType === "temperature" || selectedSensorType === "suhu";
    if (isTemp) {
      return lang === "en"
        ? `CRITICAL TEMPERATURE ALERT: Temperature level is at ${activeSensorValue}°C (above 35°C) on Device [${displayReading.deviceId}]!`
        : `PERINGATAN SUHU KRITIS: Tingkat suhu berada di ${activeSensorValue}°C (di atas 35°C) pada Perangkat [${displayReading.deviceId}]!`;
    }
    return t.criticalAlert
      .replace("{moisture}", activeSensorValue.toString())
      .replace("{deviceId}", displayReading.deviceId);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 transition-all duration-300">
      <Header
        isConnected={isConnected}
        onSimulate={triggerSimulation}
        simulating={simulating}
        isAdminMode={isAdminMode}
        onTitleClick={handleTitleClick}
      />

      <main className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
          <div className="lg:col-span-1 h-full">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 h-full flex flex-col">
              <h3 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 border-b border-zinc-150 dark:border-zinc-800 pb-2 uppercase tracking-wider">
                {t.activeNodes}
              </h3>
              
              <div className="flex flex-col gap-2 flex-1">
                <button
                  onClick={() => setSelectedDevice("all")}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                    selectedDevice === "all"
                      ? "bg-emerald-600 text-white border-emerald-650 shadow-md shadow-emerald-950/15"
                      : "bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-850"
                  }`}
                >
                  <span>{t.allDevices}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    selectedDevice === "all" ? "bg-white/20 text-white" : "bg-emerald-600/10 text-emerald-600 dark:text-emerald-450"
                  }`}>
                    {activeDevices.length}
                  </span>
                </button>
                
                {activeDevices.map((devId) => {
                  const logs = deviceData[devId] || [];
                  const latest = logs[logs.length - 1];
                  const isDeviceActive = latest ? (Date.now() - latest.timestamp < 10000) : false;
                  const isSelected = selectedDevice === devId;
                  
                  return (
                    <button
                      key={devId}
                      onClick={() => setSelectedDevice(devId)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${
                        isSelected
                          ? "bg-emerald-600 text-white border-emerald-650 shadow-md shadow-emerald-950/15"
                          : "bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-850"
                      }`}
                    >
                      <span className="truncate">{devId}</span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            isDeviceActive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                          }`}
                        ></span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium uppercase tracking-wider">
                    {t.status}
                  </span>
                  <p className="text-sm font-bold">
                    {isConnected ? t.liveStream : t.reconnecting}
                  </p>
                  {displayReading && (
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-450 font-medium">
                      {t.lastTime}: {formatTime(displayReading.timestamp)}
                    </p>
                  )}
                </div>
                <div
                  className={`p-2.5 rounded-lg ${
                    isConnected
                      ? "bg-emerald-600/10 text-emerald-600 dark:text-emerald-500"
                      : "bg-red-600/10 text-red-500"
                  }`}
                >
                  <Activity className="h-4.5 w-4.5" />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex items-center justify-between shadow-sm">
                <div className="space-y-1">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium uppercase tracking-wider">
                    {t.activeDevice}
                  </span>
                  <p className="text-sm font-bold">
                    {displayReading?.deviceId || t.noData}
                  </p>
                </div>
                <div className="p-2.5 bg-indigo-600/10 text-indigo-650 dark:text-indigo-400 rounded-lg">
                  <Cpu className="h-4.5 w-4.5" />
                </div>
              </div>

              <div
                className={`bg-white dark:bg-zinc-900/50 border rounded-xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm ${
                  latestMoisture !== null && latestMoisture < 30
                    ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium uppercase tracking-wider">
                    {t.soilMoisture}
                  </span>
                  <p
                    className={`text-lg font-black ${
                      latestMoisture !== null && latestMoisture < 30 ? "text-red-500" : "text-emerald-655 dark:text-emerald-450"
                    }`}
                  >
                    {latestMoisture !== null ? `${latestMoisture}%` : t.noData}
                  </p>
                </div>
                <div
                  className={`p-2.5 rounded-lg ${
                    latestMoisture !== null && latestMoisture < 30
                      ? "bg-red-600/10 text-red-500 animate-pulse"
                      : "bg-emerald-600/10 text-emerald-500"
                  }`}
                >
                  <Droplet className="h-4.5 w-4.5" />
                </div>
              </div>

              <div
                className={`bg-white dark:bg-zinc-900/50 border rounded-xl p-5 flex items-center justify-between transition-all duration-300 shadow-sm ${
                  latestTemperature !== null && latestTemperature > 35
                    ? "border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="space-y-1">
                  <span className="text-xs text-zinc-550 dark:text-zinc-400 font-medium uppercase tracking-wider">
                    {t.temperature}
                  </span>
                  <p
                    className={`text-lg font-black ${
                      latestTemperature !== null && latestTemperature > 35 ? "text-red-500" : "text-amber-655 dark:text-amber-450"
                    }`}
                  >
                    {latestTemperature !== null ? `${latestTemperature}°C` : t.noData}
                  </p>
                </div>
                <div
                  className={`p-2.5 rounded-lg ${
                    latestTemperature !== null && latestTemperature > 35
                      ? "bg-red-600/10 text-red-500 animate-pulse"
                      : "bg-amber-600/10 text-amber-500"
                  }`}
                >
                  <Thermometer className="h-4.5 w-4.5" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-6 shadow-md dark:shadow-xl backdrop-blur-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-sm font-bold text-zinc-800 dark:text-zinc-100 font-sans">
                    {getChartTitle()}
                  </h2>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400">
                    {t.chartSubtitle}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {sensorTypes.length > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-450">
                        {t.sensorType}:
                      </span>
                      <select
                        value={selectedSensorType}
                        onChange={(e) => setSelectedSensorType(e.target.value)}
                        className="px-2 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-700 dark:text-zinc-300"
                      >
                        {sensorTypes.map((type) => (
                          <option key={type} value={type}>
                            {type === "all" ? t.allSensors : type.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-550 dark:text-zinc-450">
                      {t.filterDevice}:
                    </span>
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-zinc-700 dark:text-zinc-300"
                    >
                      <option value="all">{t.allCombined}</option>
                      {activeDevices.map((devId) => (
                        <option key={devId} value={devId}>
                          {devId}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="h-[420px] w-full">
                {isMounted && filteredData.length > 0 && selectedSensorType ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="moistureGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={selectedSensorType === "temperature" || selectedSensorType === "suhu" ? "#f59e0b" : "#10b981"} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={selectedSensorType === "temperature" || selectedSensorType === "suhu" ? "#f59e0b" : "#10b981"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke={theme === "dark" ? "#27272a" : "#e4e4e7"}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="timeString"
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, "auto"]}
                        stroke="#71717a"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: theme === "dark" ? "#18181b" : "#ffffff",
                          borderColor: theme === "dark" ? "#27272a" : "#e4e4e7",
                          color: theme === "dark" ? "#f4f4f5" : "#18181b",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                      {linesToPlot.map((lineInfo) => (
                        <Area
                          key={lineInfo.key}
                          type="monotone"
                          dataKey={lineInfo.key}
                          stroke={lineInfo.color}
                          strokeWidth={2}
                          fillOpacity={selectedDevice === "all" || selectedSensorType === "all" ? 0.03 : 1}
                          fill={selectedDevice === "all" || selectedSensorType === "all" ? lineInfo.color : "url(#moistureGrad)"}
                          name={lineInfo.name}
                          connectNulls={true}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-zinc-100/50 dark:bg-zinc-900/20 text-zinc-550 dark:text-zinc-500">
                    <Droplet className="h-8 w-8 mb-2 animate-bounce text-emerald-500" />
                    <p className="text-sm font-medium">{t.awaitingData}</p>
                    <p className="text-xs text-zinc-550 dark:text-zinc-650 mt-1 text-center">
                      {t.simulatePrompt}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TerminalIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
                  <h3 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 uppercase tracking-wider">
                    {t.serialMonitors}
                  </h3>
                </div>
                {isAdminMode && (
                  <form onSubmit={handleAddDevice} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newDeviceId}
                      onChange={(e) => setNewDeviceId(e.target.value)}
                      placeholder={t.devicePlaceholder}
                      className="px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44"
                    />
                    <button
                      type="submit"
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-650 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      {t.addMonitor}
                    </button>
                  </form>
                )}
              </div>

              {activeDevices.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeDevices.map((devId) => {
                    const logs = deviceData[devId] || [];
                    const latestLog = logs[logs.length - 1];
                    const isDevAlert =
                      latestLog &&
                      (latestLog.payload["moisture"] < 30 ||
                        latestLog.payload["kelembaban"] < 30);

                    return (
                      <div
                        key={devId}
                        className={`bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 border rounded-xl overflow-hidden font-mono text-[10px] shadow-inner flex flex-col h-60 transition-all duration-300 ${
                          isDevAlert
                            ? "border-red-500/80 shadow-[0_0_12px_rgba(239,68,68,0.2)]"
                            : "border-zinc-300 dark:border-zinc-800"
                        }`}
                      >
                        <div className="bg-zinc-100 dark:bg-zinc-900 px-4 py-2 border-b border-zinc-300 dark:border-zinc-850 flex items-center justify-between text-zinc-650 dark:text-zinc-400">
                          <span className="font-bold text-emerald-600 dark:text-emerald-500 flex items-center gap-1.5 truncate">
                            <span
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                isDevAlert ? "bg-red-500 animate-ping" : "bg-emerald-500"
                              }`}
                            ></span>
                            {devId}
                          </span>
                          <div className="flex items-center gap-2">
                            {isAdminMode ? (
                              <button
                                onClick={() => handleRemoveDevice(devId)}
                                title={t.removeMonitor}
                                className="p-1 text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/20 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <span className="text-[9px] uppercase font-semibold text-zinc-550 dark:text-zinc-500">
                                {t.comPortActive}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto space-y-1 bg-zinc-50/50 dark:bg-black/90 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-800">
                          {[...logs].reverse().map((item, idx) => {
                            const isWarning =
                              item.payload["moisture"] < 30 ||
                              item.payload["kelembaban"] < 30;
                            return (
                              <div
                                key={idx}
                                className={`flex items-start justify-between gap-2 py-0.5 border-b border-zinc-200/50 dark:border-zinc-900/40 ${
                                  isWarning
                                    ? "text-red-655 dark:text-red-400 font-semibold"
                                    : "text-emerald-700 dark:text-emerald-400/90"
                                }`}
                              >
                                <span>
                                  &gt; [{formatTime(item.timestamp)}]{" "}
                                  {formatPayload(item.payload)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/20 p-8 text-center text-zinc-500 dark:text-zinc-600 font-sans text-xs">
                  {t.noPorts}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 h-full">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm space-y-4 h-full flex flex-col">
              <h3 className="text-xs font-bold text-zinc-850 dark:text-zinc-100 border-b border-zinc-150 dark:border-zinc-800 pb-2 uppercase tracking-wider flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping"></span>
                {t.notificationsTitle}
              </h3>
              
              <div className="space-y-3 flex-1 overflow-y-auto pr-1 scrollbar-thin min-h-[300px]">
                {notifications.length > 0 ? (
                  notifications.map((notif) => {
                    const isMoist = notif.metric === "moisture" || notif.metric === "kelembaban";
                    const msg = isMoist
                      ? t.alertMoisture.replace("{value}", notif.value.toString())
                      : t.alertTemp.replace("{value}", notif.value.toString());
                    
                    return (
                      <div
                        key={notif.id}
                        className="border border-red-200/80 dark:border-red-950/60 bg-red-50/20 dark:bg-red-950/10 rounded-lg p-3.5 space-y-1.5 transition-all duration-300"
                      >
                        <div className="flex items-center justify-between text-[9px] text-zinc-400 dark:text-zinc-500 font-mono">
                          <span className="font-bold text-red-500 dark:text-red-400 uppercase">{notif.deviceId}</span>
                          <span>{formatTime(notif.timestamp)}</span>
                        </div>
                        <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200 leading-tight">
                          {msg}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-zinc-450 dark:text-zinc-650 text-xs font-medium font-sans">
                    {t.noNotifications}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
