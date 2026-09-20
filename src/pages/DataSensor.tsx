import { Search, RotateCcw, Thermometer, Droplets, Lightbulb, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sensorApi } from '../api/sensorApi';
import type { DataSensorItem } from '../api/types';

export default function DataSensor() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ searchParams hoặc sessionStorage để giữ nguyên bộ lọc khi reload (F5)
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('time') || sessionStorage.getItem('datasensor_time') || '';
  });

  const [sensorFilter, setSensorFilter] = useState(() => {
    return searchParams.get('type') || sessionStorage.getItem('datasensor_type') || 'ALL';
  });

  const [pageSize, setPageSize] = useState(() => {
    const s = searchParams.get('size') || sessionStorage.getItem('datasensor_size');
    return s ? Number(s) : 10;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get('page') || sessionStorage.getItem('datasensor_page');
    return p ? Number(p) : 1;
  });

  const [sensorData, setSensorData] = useState<DataSensorItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Lưu và đồng bộ trạng thái filter vào URL searchParams và sessionStorage khi có thay đổi
  useEffect(() => {
    sessionStorage.setItem('datasensor_type', sensorFilter);
    sessionStorage.setItem('datasensor_time', searchTerm);
    sessionStorage.setItem('datasensor_size', String(pageSize));
    sessionStorage.setItem('datasensor_page', String(currentPage));

    const params: Record<string, string> = {};
    if (sensorFilter !== 'ALL') params.type = sensorFilter;
    if (searchTerm.trim()) params.time = searchTerm.trim();
    if (currentPage > 1) params.page = String(currentPage);
    if (pageSize !== 10) params.size = String(pageSize);

    setSearchParams(params, { replace: true });
  }, [sensorFilter, searchTerm, pageSize, currentPage, setSearchParams]);

  // Convert filter display name to backend name
  const mapSensorTypeToBackend = (filter: string) => {
    switch (filter) {
      case 'Nhiệt độ':
        return 'temperature';
      case 'Độ ẩm':
        return 'humidity';
      case 'Ánh sáng':
        return 'light';
      default:
        return 'All';
    }
  };

  // Convert input date string (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD for backend
  const parseDateToApiFormat = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    // DD/MM/YYYY
    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    return trimmed;
  };

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return date.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getSensorDisplayName = (type: string) => {
    if (type === 'temperature') return 'Nhiệt độ';
    if (type === 'humidity') return 'Độ ẩm';
    if (type === 'light') return 'Ánh sáng';
    return type;
  };

  const getSensorDisplayValue = (type: string, val: string) => {
    if (type === 'temperature') return val.includes('°C') ? val : `${val}°C`;
    if (type === 'humidity') return val.includes('%') ? val : `${val}%`;
    if (type === 'light') return val.includes('Lux') ? val : `${val} Lux`;
    return val;
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await sensorApi.search({
        page: currentPage - 1,
        size: pageSize,
        type: mapSensorTypeToBackend(sensorFilter),
        time: parseDateToApiFormat(searchTerm),
      });

      if (res.success && res.data) {
        setSensorData(res.data.content || []);
        setTotalPages(Math.max(1, res.data.totalPages));
        setTotalElements(res.data.totalElements || 0);
      } else {
        setSensorData([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err) {
      console.log('Notice: Chưa thể kết nối Backend hoặc chưa có dữ liệu:', err);
      setSensorData([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, sensorFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const resetFilters = () => {
    setSearchTerm('');
    setSensorFilter('ALL');
    setCurrentPage(1);
    sessionStorage.removeItem('datasensor_type');
    sessionStorage.removeItem('datasensor_time');
    sessionStorage.removeItem('datasensor_size');
    sessionStorage.removeItem('datasensor_page');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-in fade-in duration-500">
      {/* Toolbar: Search on the left, Filter & Reset on the right (same row) */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search input with time search capability */}
        <div className="relative flex-1 max-w-sm lg:max-w-md min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo ngày (YYYY-MM-DD hoặc DD/MM/YYYY)..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filter and Reset button grouped on the right */}
        <div className="flex items-center gap-3 shrink-0 flex-nowrap overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Loại cảm biến:</span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
              value={sensorFilter}
              onChange={(e) => {
                setSensorFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="Nhiệt độ">Nhiệt độ</option>
              <option value="Độ ẩm">Độ ẩm</option>
              <option value="Ánh sáng">Ánh sáng</option>
            </select>
          </div>

          {/* Reset button - always visible */}
          <button
            onClick={resetFilters}
            title="Đặt lại bộ lọc"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 pb-6 mt-4 relative min-h-[300px]">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-10">
            <Loader2 className="w-8 h-8 text-[#2a1b4d] animate-spin" />
          </div>
        )}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2a1b4d] text-white">
              <th className="py-4 px-6 font-semibold rounded-tl-xl w-24">ID</th>
              <th className="py-4 px-6 font-semibold">Loại cảm biến</th>
              <th className="py-4 px-6 font-semibold">Giá trị cảm biến</th>
              <th className="py-4 px-6 font-semibold rounded-tr-xl">Thời gian đo</th>
            </tr>
          </thead>
          <tbody>
            {sensorData.length > 0 ? (
              sensorData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  }`}
                >
                  <td className="py-4 px-6 text-gray-600 font-mono text-sm">{row.id}</td>
                  <td className="py-4 px-6 text-gray-900 font-medium">
                    {getSensorDisplayName(row.sensorType)}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        row.sensorType === 'temperature'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : row.sensorType === 'humidity'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {row.sensorType === 'temperature' && <Thermometer className="w-3.5 h-3.5" />}
                      {row.sensorType === 'humidity' && <Droplets className="w-3.5 h-3.5" />}
                      {row.sensorType === 'light' && <Lightbulb className="w-3.5 h-3.5" />}
                      {getSensorDisplayValue(row.sensorType, row.value)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm font-mono">
                    {formatDateTime(row.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu</p>
                    <p className="text-xs text-gray-400">
                      Dữ liệu sẽ xuất hiện khi ESP gửi thông số qua MQTT và được lưu vào hệ thống
                    </p>
                    {(searchTerm || sensorFilter !== 'ALL') && (
                      <button
                        onClick={resetFilters}
                        className="text-xs text-[#2a1b4d] underline font-medium mt-1 cursor-pointer"
                      >
                        Đặt lại bộ lọc
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 px-6">
        <div className="text-xs text-gray-500">
          Hiển thị{' '}
          <span className="font-semibold text-gray-700">
            {sensorData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>{' '}
          đến{' '}
          <span className="font-semibold text-gray-700">
            {Math.min(currentPage * pageSize, totalElements)}
          </span>{' '}
          trong <span className="font-semibold text-gray-700">{totalElements}</span> bản ghi
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-xs">Số hàng:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={15}>15</option>
            </select>
          </div>
          <span className="text-xs font-medium">
            Trang {currentPage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
