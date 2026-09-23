import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Thermometer, Droplets, Lightbulb } from 'lucide-react';
import { useState } from 'react';

// Mock Data cho biểu đồ sóng nhỏ
const waveData = [
  { name: '1', value: 10 }, { name: '2', value: 30 }, { name: '3', value: 50 },
  { name: '4', value: 20 }, { name: '5', value: 60 }, { name: '6', value: 80 },
  { name: '7', value: 40 }, { name: '8', value: 20 },
];

// Mock Data gốc cho biểu đồ lớn (giá trị ánh sáng thực tế 3 chữ số 350-550 Lux)
const rawMockRealtimeData = [
  { time: '22:11:31', temp: 30, humid: 80, light: 420 },
  { time: '22:11:33', temp: 32, humid: 78, light: 450 },
  { time: '22:11:35', temp: 31, humid: 75, light: 390 },
  { time: '22:11:37', temp: 33, humid: 72, light: 480 },
  { time: '22:11:39', temp: 32, humid: 75, light: 510 },
  { time: '22:11:41', temp: 34, humid: 78, light: 460 },
  { time: '22:11:43', temp: 35, humid: 82, light: 550 },
  { time: '22:11:45', temp: 32, humid: 80, light: 430 },
];

// Chuẩn hoá các giá trị về thang đo 100%:
// - Nhiệt độ (dải đo DHT11 0 - 50°C): normTemp = (temp / 50) * 100
// - Độ ẩm (dải đo 0 - 100%): normHumid = humid
// - Ánh sáng (dải đo quang trở 0 - 1000 Lux): normLight = (light / 1000) * 100
const mockRealtimeData = rawMockRealtimeData.map((d) => ({
  ...d,
  normTemp: Math.min(100, Math.max(0, Number(((d.temp / 50) * 100).toFixed(1)))),
  normHumid: Math.min(100, Math.max(0, Number(d.humid.toFixed(1)))),
  normLight: Math.min(100, Math.max(0, Number(((d.light / 1000) * 100).toFixed(1)))),
}));

// Custom Tooltip hiển thị giá trị thực tế của cảm biến khi hover chuột
const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 backdrop-blur-xs border border-gray-200 p-3 rounded-xl shadow-lg text-xs space-y-2 min-w-[200px]">
        <div className="font-bold text-gray-700 pb-1 border-b border-gray-100 flex items-center justify-between">
          <span>Thời gian:</span>
          <span className="font-mono text-gray-500">{data.time}</span>
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

const StatCard = ({ title, value, unit, icon: Icon, colorClass, iconBgClass, iconColorClass, gradientId }: any) => (
  <div className="bg-white rounded-2xl shadow-sm p-6 relative overflow-hidden flex flex-col justify-between h-40 border border-gray-100 hover:shadow-md transition-all hover:-translate-y-1">
    <div className="flex justify-between items-start z-10">
      <div>
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <div className="text-3xl font-bold mt-1 text-gray-900">{value} <span className="text-xl font-normal text-gray-500">{unit}</span></div>
      </div>
      <div className={`p-2 rounded-lg ${iconBgClass}`}>
        <Icon className={`w-6 h-6 ${iconColorClass}`} />
      </div>
    </div>
    
    <div className="absolute bottom-0 left-0 right-0 h-24 opacity-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={waveData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={colorClass} stopOpacity={0.4}/>
              <stop offset="95%" stopColor={colorClass} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={colorClass} strokeWidth={2} fillOpacity={1} fill={`url(#${gradientId})`} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default function Dashboard() {
  // Khởi tạo trạng thái đèn từ localStorage để tránh bị reset khi F5 reload trang
  const [leds, setLeds] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem('dashboard_leds');
      return saved ? JSON.parse(saved) : { led1: true, led2: true, led3: false };
    } catch {
      return { led1: true, led2: true, led3: false };
    }
  });

  const toggleLed = (led: string) => {
    setLeds(prev => {
      const updated = { ...prev, [led]: !prev[led] };
      localStorage.setItem('dashboard_leds', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Nhiệt độ" value="32" unit="°C" icon={Thermometer} colorClass="#EF4444" iconBgClass="bg-red-100" iconColorClass="text-red-500" gradientId="colorTemp" />
        <StatCard title="Độ ẩm" value="50" unit="%" icon={Droplets} colorClass="#3B82F6" iconBgClass="bg-blue-100" iconColorClass="text-blue-500" gradientId="colorHumid" />
        <StatCard title="Ánh sáng" value="450" unit="Lux" icon={Lightbulb} colorClass="#F97316" iconBgClass="bg-orange-100" iconColorClass="text-orange-500" gradientId="colorLight" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xs font-semibold text-gray-400 mb-2 uppercase tracking-wider">
            Biểu đồ theo thời gian thực
          </h3>
          
          <div className="h-[370px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockRealtimeData} margin={{ top: 10, right: 20, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} />
                <YAxis
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  tickFormatter={(val) => `${val}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  iconType="circle" 
                  iconSize={7} 
                  wrapperStyle={{ paddingTop: '6px', fontSize: '11px', bottom: 0 }} 
                  formatter={(value) => <span className="text-gray-500 font-medium text-xs ml-0.5 mr-2">{value}</span>}
                />
                <Line
                  type="monotone"
                  dataKey="normTemp"
                  name="Nhiệt độ"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="normLight"
                  name="Ánh sáng"
                  stroke="#F59E0B"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="normHumid"
                  name="Độ ẩm"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-bold text-center text-gray-800 mb-8 mt-2">Công tắc đèn</h3>
          
          <div className="flex-1 flex flex-col justify-center gap-8 px-4">
            {[1, 2, 3].map((num) => {
              const key = `led${num}`;
              const isOn = leds[key];
              return (
                <div key={num} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lightbulb className={`w-8 h-8 transition-colors duration-300 ${isOn ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' : 'text-gray-300'}`} />
                    <div>
                      <span className="text-lg font-medium text-gray-700">LED {num}</span>
                      <div className={`text-xs font-medium transition-colors ${isOn ? 'text-emerald-600' : 'text-gray-400'}`}>
                        {isOn ? 'Đang bật' : 'Đang tắt'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Toggle Switch */}
                  <button 
                    onClick={() => toggleLed(key)}
                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2a1b4d] cursor-pointer ${isOn ? 'bg-[#2a1b4d]' : 'bg-gray-200'}`}
                    title={isOn ? `Tắt LED ${num}` : `Bật LED ${num}`}
                  >
                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition duration-300 shadow-sm ${isOn ? 'translate-x-7' : 'translate-x-1'}`} />
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
