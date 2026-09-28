import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Thermometer, Droplets, Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';

import { sensorApi } from '../api/sensorApi';
import type { LatestDataSensorResponse } from '../api/types';
import { deviceApi } from '../api/deviceApi';
import { webSocketService } from '../services/websocketService';

interface ChartPoint {
  time: string;
  fullTime: string;
  temp: number;
  humid: number;
  light: number;
  normTemp: number;
  normHumid: number;
  normLight: number;
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  payload: ChartPoint;
}

// Chuẩn hoá dữ liệu về cùng thang 0 - 100% để hiển thị trên biểu đồ.
// DHT11: 0 - 50°C
// Độ ẩm: 0 - 100%
// ESP8266 ADC A0: 0 - 1023
const normalizeSensorValues = (temp: number, humid: number, light: number) => {
  const normTemp = Math.min(
    100,
    Math.max(0, Number(((temp / 50) * 100).toFixed(1))),
  );

  const normHumid = Math.min(
    100,
    Math.max(0, Number(humid.toFixed(1))),
  );

  const normLight = Math.min(
    100,
    Math.max(0, Number(((light / 1023) * 100).toFixed(1))),
  );

  return { normTemp, normHumid, normLight };
};

const formatTime = (isoString?: string | null) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  return Number.isNaN(date.getTime())
    ? isoString
    : date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
};

const formatFullTime = (isoString?: string | null) => {
  if (!isoString) return '';

  const date = new Date(isoString);

  return Number.isNaN(date.getTime())
    ? isoString
    : date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
};

// Tooltip giữ kiểu hiển thị của giao diện mới,
// nhưng dữ liệu lấy từ API/WebSocket thật.
const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;

    return (
      <div className="bg-white/95 backdrop-blur-xs border border-gray-200 p-3 rounded-xl shadow-lg text-xs space-y-2 min-w-[220px]">
        <div className="font-bold text-gray-700 pb-1 border-b border-gray-100 flex items-center justify-between gap-3">
          <span>Thời gian:</span>
          <span className="font-mono text-gray-600 font-semibold">
            {data.fullTime || data.time}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3 text-red-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
            <span>Nhiệt độ:</span>
          </div>
          <span className="font-bold">{data.temp} °C</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-blue-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#3B82F6]" />
            <span>Độ ẩm:</span>
          </div>
          <span className="font-bold">{data.humid} %</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-amber-600 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B]" />
            <span>Ánh sáng:</span>
          </div>
          <span className="font-bold">{data.light} Lux</span>
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
    <div className="bg-white rounded-2xl shadow-sm p-4 px-5 relative overflow-hidden flex flex-col justify-between h-28 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-0.5">
      <div className="flex justify-between items-start z-10">
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>

          <div className="text-2xl font-bold mt-0.5 text-gray-900">
            {hasValue ? (
              <>
                {value}{' '}
                <span className="text-base font-normal text-gray-500">
                  {unit}
                </span>
              </>
            ) : (
              <span className="text-sm font-normal text-gray-400">
                Chưa có dữ liệu
              </span>
            )}
          </div>
        </div>

        <div className={`p-2 rounded-lg ${iconBgClass}`}>
          <Icon className={`w-5 h-5 ${iconColorClass}`} />
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-50 pointer-events-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={waveData}>
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={colorClass}
                  stopOpacity={0.4}
                />
                <stop
                  offset="95%"
                  stopColor={colorClass}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <Area
              type="monotone"
              dataKey="value"
              stroke={colorClass}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
            />
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

  // Dùng cùng cấu trúc deviceId của backend: 1, 2, 3.
  // localStorage chỉ đóng vai trò giữ trạng thái tạm thời khi reload;
  // sau đó trạng thái sẽ được đồng bộ lại từ backend.
  const [leds, setLeds] = useState<{ [deviceId: number]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('iot_led_states');

      return saved
        ? JSON.parse(saved)
        : { 1: false, 2: false, 3: false };
    } catch {
      return { 1: false, 2: false, 3: false };
    }
  });

  const [loadingLeds, setLoadingLeds] = useState<{
    [deviceId: number]: boolean;
  }>({});

  // 1. Lấy dữ liệu ban đầu từ REST API.
  useEffect(() => {
    sensorApi
      .getLatest()
      .then((res) => {
        if (res.success && res.data) {
          setSensors(res.data);
        }
      })
      .catch((err) =>
        console.log(
          'Notice: Chưa có dữ liệu sensor ban đầu:',
          err.message,
        ),
      );

    sensorApi
      .getChartData()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const points: ChartPoint[] = res.data.map((item) => {
            const temp = item.temperature ?? 0;
            const humid = item.humidity ?? 0;
            const light = item.light ?? 0;

            const { normTemp, normHumid, normLight } =
              normalizeSensorValues(temp, humid, light);

            return {
              time: formatTime(item.timestamp),
              fullTime: formatFullTime(item.timestamp),
              temp,
              humid,
              light,
              normTemp,
              normHumid,
              normLight,
            };
          });

          setChartData(points.slice(-12));
        }
      })
      .catch((err) =>
        console.log(
          'Notice: Chưa có dữ liệu chart ban đầu:',
          err.message,
        ),
      );

    deviceApi
      .getAllDevices()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          const serverStates: { [deviceId: number]: boolean } = {};

          res.data.forEach((device) => {
            serverStates[device.id] = device.lastAction === 'ON';
          });

          setLeds((prev) => {
            const merged = { ...prev, ...serverStates };

            localStorage.setItem(
              'iot_led_states',
              JSON.stringify(merged),
            );

            return merged;
          });
        }
      })
      .catch((err) =>
        console.log(
          'Notice: Không thể lấy trạng thái thiết bị:',
          err.message,
        ),
      );
  }, []);

  // 2. Nhận dữ liệu sensor realtime qua WebSocket.
  useEffect(() => {
    const unsubscribe = webSocketService.onSensorData((newData) => {
      setSensors(newData);

      setChartData((prev) => {
        const temp = newData.temperature ?? 0;
        const humid = newData.humidity ?? 0;
        const light = newData.light ?? 0;

        const { normTemp, normHumid, normLight } =
          normalizeSensorValues(temp, humid, light);

        const newPoint: ChartPoint = {
          time:
            formatTime(newData.timestamp) ||
            new Date().toLocaleTimeString('vi-VN'),
          fullTime:
            formatFullTime(newData.timestamp) ||
            new Date().toLocaleString('vi-VN'),
          temp,
          humid,
          light,
          normTemp,
          normHumid,
          normLight,
        };

        return [...prev, newPoint].slice(-12);
      });
    });

    return () => unsubscribe();
  }, []);

  // 3. Nhận trạng thái phản hồi của từng thiết bị qua WebSocket.
  useEffect(() => {
    const unsubscribes = [1, 2, 3].map((deviceId) =>
      webSocketService.onDeviceStatus(deviceId, (statusData) => {
        if (statusData.status === 'SUCCESS') {
          const isTurnedOn = statusData.action === 'ON';

          setLeds((prev) => {
            const updated = {
              ...prev,
              [deviceId]: isTurnedOn,
            };

            localStorage.setItem(
              'iot_led_states',
              JSON.stringify(updated),
            );

            return updated;
          });
        } else if (statusData.status === 'FAILED') {
          setLeds((prev) => {
            const reverted = {
              ...prev,
              [deviceId]: false,
            };

            localStorage.setItem(
              'iot_led_states',
              JSON.stringify(reverted),
            );

            return reverted;
          });
        }

        setLoadingLeds((prev) => ({
          ...prev,
          [deviceId]: false,
        }));
      }),
    );

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  // 4. Gửi lệnh ON/OFF qua backend.
  // UI đổi ngay để phản hồi nhanh, sau đó rollback nếu API lỗi.
  const handleToggleDevice = async (deviceId: number) => {
    const currentState = leds[deviceId] || false;
    const nextAction = currentState ? 'OFF' : 'ON';
    const nextState = nextAction === 'ON';

    setLeds((prev) => {
      const updated = {
        ...prev,
        [deviceId]: nextState,
      };

      localStorage.setItem(
        'iot_led_states',
        JSON.stringify(updated),
      );

      return updated;
    });

    setLoadingLeds((prev) => ({
      ...prev,
      [deviceId]: true,
    }));

    try {
      const res = await deviceApi.performAction(
        deviceId,
        nextAction,
        1,
      );

      if (res.success) {
        setLoadingLeds((prev) => ({
          ...prev,
          [deviceId]: false,
        }));
      } else {
        setLeds((prev) => {
          const reverted = {
            ...prev,
            [deviceId]: currentState,
          };

          localStorage.setItem(
            'iot_led_states',
            JSON.stringify(reverted),
          );

          return reverted;
        });

        setLoadingLeds((prev) => ({
          ...prev,
          [deviceId]: false,
        }));
      }
    } catch (error) {
      console.error(
        'Lỗi khi gửi lệnh bật/tắt thiết bị:',
        error,
      );

      setLeds((prev) => {
        const reverted = {
          ...prev,
          [deviceId]: currentState,
        };

        localStorage.setItem(
          'iot_led_states',
          JSON.stringify(reverted),
        );

        return reverted;
      });

      setLoadingLeds((prev) => ({
        ...prev,
        [deviceId]: false,
      }));
    }
  };

  // Sóng nhỏ trên ba card lấy trực tiếp từ dữ liệu thật gần nhất.
  const tempWave = chartData.map((item, index) => ({
    name: String(index),
    value: item.temp,
  }));

  const humidWave = chartData.map((item, index) => ({
    name: String(index),
    value: item.humid,
  }));

  const lightWave = chartData.map((item, index) => ({
    name: String(index),
    value: item.light,
  }));

  return (
    <div className="flex flex-col gap-3.5 h-full overflow-hidden animate-in fade-in duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 shrink-0">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 flex-1 min-h-0">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-3.5 px-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden">
          <h3 className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wider shrink-0">
            Biểu đồ theo thời gian thực
          </h3>

          <div className="flex-1 min-h-0 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 8,
                    right: 15,
                    left: -20,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#E5E7EB"
                  />

                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#9CA3AF',
                    }}
                  />

                  <YAxis
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={(val) => `${val}%`}
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fontSize: 11,
                      fill: '#9CA3AF',
                    }}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Legend
                    iconType="circle"
                    iconSize={7}
                    wrapperStyle={{
                      paddingTop: '2px',
                      fontSize: '11px',
                      bottom: 0,
                    }}
                    formatter={(value) => (
                      <span className="text-gray-500 font-medium text-xs ml-0.5 mr-2">
                        {value}
                      </span>
                    )}
                  />

                  <Line
                    type="monotone"
                    dataKey="normTemp"
                    name="Nhiệt độ"
                    stroke="#EF4444"
                    strokeWidth={2.5}
                    dot={{
                      r: 3.5,
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 5.5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="normLight"
                    name="Ánh sáng"
                    stroke="#F59E0B"
                    strokeWidth={2.5}
                    dot={{
                      r: 3.5,
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 5.5 }}
                  />

                  <Line
                    type="monotone"
                    dataKey="normHumid"
                    name="Độ ẩm"
                    stroke="#3B82F6"
                    strokeWidth={2.5}
                    dot={{
                      r: 3.5,
                      strokeWidth: 1.5,
                    }}
                    activeDot={{ r: 5.5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-center text-gray-400">
                <div>
                  <p className="text-sm font-medium">
                    Chưa có dữ liệu biểu đồ thời gian thực
                  </p>
                  <p className="text-xs mt-1">
                    Dữ liệu sẽ tự động xuất hiện khi ESP gửi thông số
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-3.5 px-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden justify-between">
          <h3 className="text-base font-bold text-center text-gray-800 mb-1 shrink-0">
            Công tắc đèn
          </h3>

          <div className="flex-1 flex flex-col justify-around py-1">
            {[1, 2, 3].map((num) => {
              const isOn = leds[num];
              const isLoading = loadingLeds[num];

              return (
                <div
                  key={num}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Lightbulb
                      className={`w-7 h-7 transition-colors duration-300 ${isOn
                          ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'text-gray-300'
                        }`}
                    />

                    <div>
                      <span className="text-base font-medium text-gray-700">
                        LED {num}
                      </span>

                      <div
                        className={`text-xs font-medium transition-colors ${isLoading
                            ? 'text-amber-500'
                            : isOn
                              ? 'text-emerald-600'
                              : 'text-gray-400'
                          }`}
                      >
                        {isLoading
                          ? 'Đang gửi lệnh...'
                          : isOn
                            ? 'Đang bật'
                            : 'Đang tắt'}
                      </div>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={() => handleToggleDevice(num)}
                    disabled={isLoading}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2a1b4d] ${isOn ? 'bg-[#2a1b4d]' : 'bg-gray-200'
                      } ${isLoading
                        ? 'opacity-70 cursor-wait'
                        : 'cursor-pointer'
                      }`}
                    title={
                      isOn
                        ? `Tắt LED ${num}`
                        : `Bật LED ${num}`
                    }
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition duration-300 shadow-sm ${isOn
                          ? 'translate-x-6'
                          : 'translate-x-1'
                        }`}
                    />
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
