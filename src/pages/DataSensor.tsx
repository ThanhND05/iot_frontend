import { Search } from 'lucide-react';
import { useState } from 'react';

const mockData = Array.from({ length: 50 }).map((_, i) => ({
  id: 15 - i > 0 ? 15 - i : 100 - i,
  type: 'Nhiệt độ',
  value: (30 + Math.random() * 5).toFixed(1) + '°C',
  time: `15/08/2026 22:11:${31 - i > 10 ? 31 - i : '0' + (31 - i > 0 ? 31 - i : 59 + (31-i))}`
})).slice(0, 10);

export default function DataSensor() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-in fade-in duration-500">
      {/* Toolbar */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm" 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-600">Loại cảm biến:</span>
          <select className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors">
            <option>Nhiệt độ</option>
            <option>Độ ẩm</option>
            <option>Ánh sáng</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6 mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2a1b4d] text-white">
              <th className="py-4 px-6 font-medium rounded-tl-xl w-24">ID</th>
              <th className="py-4 px-6 font-medium">Loại cảm biến</th>
              <th className="py-4 px-6 font-medium">Giá trị cảm biến</th>
              <th className="py-4 px-6 font-medium rounded-tr-xl">Thời gian đo</th>
            </tr>
          </thead>
          <tbody>
            {mockData.map((row, idx) => (
              <tr key={row.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                <td className="py-4 px-6 text-gray-600">{row.id}</td>
                <td className="py-4 px-6 text-gray-800 font-medium">{row.type}</td>
                <td className="py-4 px-6 text-gray-800">{row.value}</td>
                <td className="py-4 px-6 text-gray-500">{row.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-end gap-4 text-sm text-gray-600">
        <span>Rows per page: 
            <select className="bg-transparent font-medium ml-1 focus:outline-none cursor-pointer">
                <option>7</option>
                <option>10</option>
            </select>
        </span>
        <span>1 of 10</span>
        <div className="flex gap-1">
          <button className="p-1 rounded hover:bg-gray-100 transition-colors">&lt;</button>
          <button className="p-1 rounded hover:bg-gray-100 transition-colors">&gt;</button>
        </div>
      </div>
    </div>
  )
}
