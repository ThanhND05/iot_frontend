import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, AreaChart, Area } from 'recharts';
import { Thermometer, Droplets, Lightbulb, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { sensorApi } from '../api/sensorApi';
import type { LatestDataSensorResponse } from '../api/types';
import { deviceApi } from '../api/deviceApi';
import { webSocketService } from '../services/websocketService';

interface ChartPoint {
  time: string;
  temp: number;
  humid: number;
  light: number;
  normTemp: number;
  normHumid: number;
  normLight: number;
}

const normalizeSensorValues = (temp: number, humid: number, light: number) => {
  // DHT11 temperature range: 0 - 50°C
  const normTemp = Math.min(100, Math.max(0, Number(((temp / 50) * 100).toFixed(1))));
  // Humidity: 0 - 100%
  const normHumid = Math.min(100, Math.max(0, Number(humid.toFixed(1))));
  // Light: ESP8266 ADC A0 (0 - 1023)
  const normLight = Math.min(100, Math.max(0, Number(((light / 1023) * 100).toFixed(1))));

  return { normTemp, normHumid, normLight };
};

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  payload: ChartPoint;
}

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 p-3.5 rounded-xl shadow-lg text-xs space-y-2 min-w-[200px]">
        <div className="font-bold text-gray-700 pb-1 border-b border-gray-100 flex items-center justify-between">
          <span>Thời gian đo</span>
          <span className="font-mono text-gray-500">{data.time}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-red-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>Nhiệt độ:</span>
          </div>
          <div className="text-right">
            <span className="font-bold">{data.temp} °C</span>{' '}
            <span className="text-[10px] text-gray-400 font-normal">({data.normTemp}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-blue-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>Độ ẩm:</span>
          </div>
          <div className="text-right">
            <span className="font-bold">{data.humid} %</span>{' '}
            <span className="text-[10px] text-gray-400 font-normal">({data.normHumid}%)</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 text-amber-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Ánh sáng:</span>
          </div>
          <div className="text-right">
            <span className="font-bold">{data.light} Lux</span>{' '}
            <span className="text-[10px] text-gray-400 font-normal">({data.normLight}%)</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const StatCard = ({
  title,
  value,
  unit,
  icon: Icon,
  colorClass,
  iconBgClass,
  iconColorClass,
  gradientId,
  waveData,
}: {
  title: string;
  value: number | string | null;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconBgClass: string;
  iconColorClass: string;
  gradientId: string;
  waveData: { name: string; value: number }[];
}) => {
  const hasValue = value !== null && value !== undefined && value !== '';

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between h-40 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <div className="text-3xl font-bold mt-1 text-gray-900">
            {hasValue ? (
              <>
                {value} <span className="text-xl font-normal text-gray-500">{unit}</span>
              </>
            ) : (
              <span className="text-sm font-normal text-gray-400">Chưa có dữ liệu</span>
            )}
          </div>
        </div>
        <div className={`p-2.5 rounded-xl ${iconBgClass}`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 opacity-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={waveData}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colorClass} stopOpacity={0.4} />
                <stop offset="95%" stopColor={colorClass} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="value" stroke={colorClass} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [sensors, setSensors] = useState<LatestDataSensorResponse>({
    temperature: null,
    humidity: null,
    light: null,
    timestamp: null,
  });

  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  
  // Khởi tạo trạng thái đèn từ localStorage để tránh bị reset về 'Đang tắt' khi F5
  const [leds, setLeds] = useState<{ [deviceId: number]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('iot_led_states');
      return saved ? JSON.parse(saved) : { 1: false, 2: false, 3: false };
    } catch {
      return { 1: false, 2: false, 3: false };
    }
  });
  
  const [loadingLeds, setLoadingLeds] = useState<{ [deviceId: number]: boolean }>({});

  const formatTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return isNaN(date.getTime())
      ? isoString
      : date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  // 1. Fetch initial data from REST API (Sensors, Chart, and Device States)
  useEffect(() => {
    // Fetch latest sensor values
    sensorApi
      .getLatest()
      .then((res) => {
        if (res.success && res.data) {
          setSensors(res.data);
        }
      })
      .catch((err) => console.log('Notice: Chưa có dữ liệu sensor ban đầu:', err.message));

    // Fetch chart points & normalize to 100% scale
    sensorApi
      .getChartData()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const points: ChartPoint[] = res.data.map((item) => {
            const temp = item.temperature ?? 0;
            const humid = item.humidity ?? 0;
            const light = item.light ?? 0;
            const { normTemp, normHumid, normLight } = normalizeSensorValues(temp, humid, light);

            return {
              time: formatTime(item.timestamp),
              temp,
              humid,
              light,
              normTemp,
              normHumid,
              normLight,
            };
          });
          setChartData(points);
        }
      })
      .catch((err) => console.log('Notice: Chưa có dữ liệu chart ban đầu:', err.message));

    // Đồng bộ trạng thái thiết bị từ backend database khi tải trang
    deviceApi
      .getAllDevices()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const serverStates: { [deviceId: number]: boolean } = {};
          res.data.forEach((d) => {
            serverStates[d.id] = d.lastAction === 'ON';
          });
          setLeds((prev) => {
            const merged = { ...prev, ...serverStates };
            localStorage.setItem('iot_led_states', JSON.stringify(merged));
            return merged;
          });
        }
      })
      .catch((err) => console.log('Notice: Không thể lấy trạng thái thiết bị:', err.message));
  }, []);

  // 2. Subscribe to WebSocket STOMP for real-time sensor updates
  useEffect(() => {
    const unsubscribe = webSocketService.onSensorData((newData) => {
      setSensors(newData);

      // Append to chart with normalized scale (keep last 12 points)
      setChartData((prev) => {
        const temp = newData.temperature ?? 0;
        const humid = newData.humidity ?? 0;
        const light = newData.light ?? 0;
        const { normTemp, normHumid, normLight } = normalizeSensorValues(temp, humid, light);

        const newPoint: ChartPoint = {
          time: formatTime(newData.timestamp) || new Date().toLocaleTimeString('vi-VN'),
          temp,
          humid,
          light,
          normTemp,
          normHumid,
          normLight,
        };
        const updated = [...prev, newPoint];
        return updated.slice(-12);
      });
    });

    return () => unsubscribe();
  }, []);

  // 3. Listen to device status updates from WebSocket
  useEffect(() => {
    const unsubscribes = [1, 2, 3].map((deviceId) =>
      webSocketService.onDeviceStatus(deviceId, (statusData) => {
        if (statusData.status === 'SUCCESS') {
          const isTurnedOn = statusData.action === 'ON';
          setLeds((prev) => {
            const updated = { ...prev, [deviceId]: isTurnedOn };
            localStorage.setItem('iot_led_states', JSON.stringify(updated));
            return updated;
          });
        } else if (statusData.status === 'FAILED') {
          // Rollback if hardware reported failure
          setLeds((prev) => {
            const reverted = { ...prev, [deviceId]: false };
            localStorage.setItem('iot_led_states', JSON.stringify(reverted));
            return reverted;
          });
        }
        setLoadingLeds((prev) => ({ ...prev, [deviceId]: false }));
      })
    );

    return () => unsubscribes.forEach((unsub) => unsub());
  }, []);

  // 4. Handle toggle LED with instant feedback (<0.1s)
  const handleToggleDevice = async (deviceId: number) => {
    const currentState = leds[deviceId] || false;
    const nextAction = currentState ? 'OFF' : 'ON';
    const nextState = nextAction === 'ON';

    // 1. Phản hồi tức thì trên UI ngay lập tức
    setLeds((prev) => {
      const updated = { ...prev, [deviceId]: nextState };
      localStorage.setItem('iot_led_states', JSON.stringify(updated));
      return updated;
    });

    setLoadingLeds((prev) => ({ ...prev, [deviceId]: true }));

    try {
      // 2. Gửi lệnh tới backend
      const res = await deviceApi.performAction(deviceId, nextAction, 1);
      
      // Ngay khi REST API nhận lệnh thành công (đã bắn MQTT sang ESP), tắt loading ngay
      if (res.success) {
        setLoadingLeds((prev) => ({ ...prev, [deviceId]: false }));
      } else {
        // Rollback nếu API thất bại
        setLeds((prev) => {
          const reverted = { ...prev, [deviceId]: currentState };
          localStorage.setItem('iot_led_states', JSON.stringify(reverted));
          return reverted;
        });
        setLoadingLeds((prev) => ({ ...prev, [deviceId]: false }));
      }
    } catch (error) {
      console.error('Lỗi khi gửi lệnh bật/tắt thiết bị:', error);
      // Rollback nếu lỗi kết nối mạng
      setLeds((prev) => {
        const reverted = { ...prev, [deviceId]: currentState };
        localStorage.setItem('iot_led_states', JSON.stringify(reverted));
        return reverted;
      });
      setLoadingLeds((prev) => ({ ...prev, [deviceId]: false }));
    }
  };

  // Generate smooth mini wave for cards based on recent chart points
  const tempWave = chartData.map((d, i) => ({ name: String(i), value: d.temp }));
  const humidWave = chartData.map((d, i) => ({ name: String(i), value: d.humid }));
  const lightWave = chartData.map((d, i) => ({ name: String(i), value: d.light }));

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Nhiệt độ"
          value={sensors.temperature}
          unit="°C"
          icon={Thermometer}
          colorClass="#EF4444"
          iconBgClass="bg-red-100"
          iconColorClass="text-red-500"
          gradientId="colorTemp"
          waveData={tempWave}
        />
        <StatCard
          title="Độ ẩm"
          value={sensors.humidity}
          unit="%"
          icon={Droplets}
          colorClass="#3B82F6"
          iconBgClass="bg-blue-100"
          iconColorClass="text-blue-500"
          gradientId="colorHumid"
          waveData={humidWave}
        />
        <StatCard
          title="Ánh sáng"
          value={sensors.light}
          unit="Lux"
          icon={Lightbulb}
          colorClass="#F97316"
          iconBgClass="bg-orange-100"
          iconColorClass="text-orange-500"
          gradientId="colorLight"
          waveData={lightWave}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
              Biểu đồ theo thời gian thực
            </h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-full font-medium">
                Thang đo: 0 - 100%
              </span>
              {sensors.timestamp && (
                <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live: {formatTime(sensors.timestamp)}
                </span>
              )}
            </div>
          </div>

          <div className="h-80 flex-1 flex items-center justify-center">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} />
                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    iconType="circle"
                    wrapperStyle={{ paddingTop: '20px' }}
                    formatter={(value) => <span className="text-xs text-gray-600 font-medium">{value}</span>}
                  />
                  <Line
                    type="monotone"
                    dataKey="normTemp"
                    name="Nhiệt độ (0-50°C ➔ 0-100%)"
                    stroke="#EF4444"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normHumid"
                    name="Độ ẩm (0-100%)"
                    stroke="#3B82F6"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="normLight"
                    name="Ánh sáng (0-1023 ➔ 0-100%)"
                    stroke="#F59E0B"
                    strokeWidth={3}
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-gray-400 py-12">
                <p className="text-sm font-medium">Chưa có dữ liệu biểu đồ thời gian thực</p>
                <p className="text-xs text-gray-400 mt-1">Dữ liệu sẽ tự động xuất hiện khi ESP gửi thông số qua MQTT</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-8 mt-2">Công tắc đèn</h3>

          <div className="flex-1 flex flex-col justify-center gap-8 px-4">
            {[1, 2, 3].map((num) => {
              const isOn = leds[num];
              const isLoading = loadingLeds[num];

              return (
                <div key={num} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb
                      className={`w-8 h-8 transition-colors duration-300 ${
                        isOn
                          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'text-gray-300'
                      }`}
                    />
                    <div>
                      <span className="text-lg font-medium text-gray-700">LED {num}</span>
                      <div className="text-xs text-gray-400">
                        {isLoading ? 'Đang gửi lệnh...' : isOn ? 'Đang bật' : 'Đang tắt'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleDevice(num)}
                    disabled={isLoading}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2a1b4d] cursor-pointer ${
                      isOn ? 'bg-[#2a1b4d]' : 'bg-gray-200'
                    } ${isLoading ? 'opacity-75 cursor-wait' : ''}`}
                    title={isOn ? `Tắt LED ${num}` : `Bật LED ${num}`}
                  >
                    <span
                      className={`inline-flex items-center justify-center h-6 w-6 transform rounded-full bg-white transition duration-300 shadow-sm ${
                        isOn ? 'translate-x-7' : 'translate-x-1'
                      }`}
                    >
                      {isLoading && <Loader2 className="w-3.5 h-3.5 text-[#2a1b4d] animate-spin" />}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
