import { Search, RotateCcw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface SensorItem {
  id: number;
  type: 'Nhiệt độ' | 'Độ ẩm' | 'Ánh sáng';
  value: string;
  time: string;
}

// Hàm tìm kiếm giá trị cảm biến linh hoạt (vd: nhập 32 ra 32.0°C, 32.4°C,...)
const matchesValueSearch = (itemValue: string, rawQuery: string): boolean => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  if (itemValue.toLowerCase().includes(query)) return true;

  const numOnlyQuery = query.replace(/[^\d.]/g, '');
  const numOnlyValue = itemValue.replace(/[^\d.]/g, '');

  if (numOnlyQuery) {
    if (numOnlyValue.includes(numOnlyQuery)) return true;
    if (numOnlyValue.startsWith(numOnlyQuery)) return true;

    const queryInt = parseInt(numOnlyQuery, 10);
    const valFloat = parseFloat(numOnlyValue);
    if (!isNaN(queryInt) && !isNaN(valFloat) && Math.floor(valFloat) === queryInt) {
      return true;
    }
  }

  return false;
};

// Hàm tìm kiếm thời gian linh hoạt (hỗ trợ YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, HH:mm,...)
const matchesTimeSearch = (itemTime: string, rawQuery: string): boolean => {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return true;

  // Kiểm tra trực tiếp chuỗi con
  if (itemTime.toLowerCase().includes(query)) return true;

  // Phân tích định dạng "DD/MM/YYYY HH:mm:ss" của dữ liệu
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}:\d{1,2}(?::\d{1,2})?))?$/.exec(itemTime.trim());
  if (match) {
    const [, d, m, y, timePart] = match;
    const day = d.padStart(2, '0');
    const month = m.padStart(2, '0');
    const dayNum = parseInt(d, 10).toString();
    const monthNum = parseInt(m, 10).toString();

    // Các biến thể ngày/tháng/năm tương đương
    const variants = [
      `${y}-${month}-${day}`,        // 2026-09-12 (chuẩn YYYY-MM-DD)
      `${y}/${month}/${day}`,        // 2026/09/12
      `${y}-${monthNum}-${dayNum}`,  // 2026-9-12
      `${day}-${month}-${y}`,        // 12-09-2026
      `${day}/${month}/${y}`,        // 12/09/2026
      `${dayNum}/${monthNum}/${y}`,  // 12/9/2026
      `${dayNum}-${monthNum}-${y}`,  // 12-9-2026
      `${y}-${month}`,               // 2026-09
      `${month}/${y}`,               // 09/2026
      `${day}/${month}`,             // 12/09
      `${day}-${month}`,             // 12-09
    ];

    if (timePart) {
      variants.push(timePart);
      variants.push(`${y}-${month}-${day} ${timePart}`);
      variants.push(`${day}/${month}/${y} ${timePart}`);
    }

    const slashQuery = query.replace(/[-.]/g, '/');
    const dashQuery = query.replace(/[./]/g, '-');

    if (
      variants.some(
        (v) =>
          v.toLowerCase().includes(query) ||
          v.toLowerCase().includes(slashQuery) ||
          v.toLowerCase().includes(dashQuery)
      )
    ) {
      return true;
    }
  }

  return false;
};

const mockData: SensorItem[] = [
  { id: 25, type: 'Nhiệt độ', value: '32.4°C', time: '12/09/2026 22:12:05' },
  { id: 24, type: 'Độ ẩm', value: '76%', time: '12/09/2026 22:11:48' },
  { id: 23, type: 'Ánh sáng', value: '450 Lux', time: '12/09/2026 22:11:20' },
  { id: 22, type: 'Nhiệt độ', value: '31.8°C', time: '12/09/2026 22:09:55' },
  { id: 21, type: 'Độ ẩm', value: '79%', time: '12/09/2026 22:08:30' },
  { id: 20, type: 'Ánh sáng', value: '380 Lux', time: '12/09/2026 22:07:15' },
  { id: 19, type: 'Nhiệt độ', value: '33.1°C', time: '12/09/2026 22:05:40' },
  { id: 18, type: 'Độ ẩm', value: '73%', time: '12/09/2026 22:04:12' },
  { id: 17, type: 'Ánh sáng', value: '520 Lux', time: '12/09/2026 22:02:50' },
  { id: 16, type: 'Nhiệt độ', value: '30.5°C', time: '12/09/2026 22:00:22' },
  { id: 15, type: 'Độ ẩm', value: '82%', time: '12/09/2026 21:58:10' },
  { id: 14, type: 'Ánh sáng', value: '610 Lux', time: '12/09/2026 21:55:45' },
  { id: 13, type: 'Nhiệt độ', value: '32.0°C', time: '12/09/2026 21:52:30' },
  { id: 12, type: 'Độ ẩm', value: '75%', time: '12/09/2026 21:50:18' },
  { id: 11, type: 'Ánh sáng', value: '340 Lux', time: '12/09/2026 21:47:02' },
  { id: 10, type: 'Nhiệt độ', value: '29.8°C', time: '12/09/2026 21:44:25' },
  { id: 9, type: 'Độ ẩm', value: '80%', time: '12/09/2026 21:41:50' },
  { id: 8, type: 'Ánh sáng', value: '490 Lux', time: '12/09/2026 21:38:12' },
  { id: 7, type: 'Nhiệt độ', value: '31.2°C', time: '12/09/2026 21:35:40' },
  { id: 6, type: 'Độ ẩm', value: '71%', time: '12/09/2026 21:32:05' },
  { id: 5, type: 'Ánh sáng', value: '430 Lux', time: '12/09/2026 21:29:18' },
];

export default function DataSensor() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ URL searchParams hoặc sessionStorage để giữ nguyên khi reload
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || sessionStorage.getItem('datasensor_search') || '';
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

  // Đồng bộ filter vào URL searchParams và sessionStorage khi có thay đổi
  useEffect(() => {
    sessionStorage.setItem('datasensor_type', sensorFilter);
    sessionStorage.setItem('datasensor_search', searchTerm);
    sessionStorage.setItem('datasensor_size', String(pageSize));
    sessionStorage.setItem('datasensor_page', String(currentPage));

    const params: Record<string, string> = {};
    if (sensorFilter !== 'ALL') params.type = sensorFilter;
    if (searchTerm.trim()) params.search = searchTerm.trim();
    if (currentPage > 1) params.page = String(currentPage);
    if (pageSize !== 10) params.size = String(pageSize);

    setSearchParams(params, { replace: true });
  }, [sensorFilter, searchTerm, pageSize, currentPage, setSearchParams]);

  // Logic lọc:
  // - Khi chọn "Thời gian": chỉ tìm kiếm theo thời gian
  // - Khi chọn các lựa chọn khác (Tất cả, Nhiệt độ, Độ ẩm, Ánh sáng): có thể tìm kiếm cả theo thời gian và chỉ số
  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      if (sensorFilter === 'Thời gian') {
        return !searchTerm.trim() || matchesTimeSearch(item.time, searchTerm);
      }

      const matchType = sensorFilter === 'ALL' || item.type === sensorFilter;
      const matchSearch =
        !searchTerm.trim() ||
        matchesValueSearch(item.value, searchTerm) ||
        matchesTimeSearch(item.time, searchTerm);

      return matchType && matchSearch;
    });
  }, [searchTerm, sensorFilter]);

  const validPageSize = pageSize > 0 ? pageSize : 10;
  const totalPages = Math.max(1, Math.ceil(filteredData.length / validPageSize));
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * validPageSize;
    return filteredData.slice(start, start + validPageSize);
  }, [filteredData, currentPage, validPageSize]);

  const safePage = Math.min(currentPage, totalPages);

  const resetFilters = () => {
    setSearchTerm('');
    setSensorFilter('ALL');
    setCurrentPage(1);
    sessionStorage.removeItem('datasensor_type');
    sessionStorage.removeItem('datasensor_search');
    sessionStorage.removeItem('datasensor_size');
    sessionStorage.removeItem('datasensor_page');
    setSearchParams({}, { replace: true });
  };

  const getSearchPlaceholder = () => {
    if (sensorFilter === 'Thời gian') {
      return 'Tìm kiếm theo thời gian...';
    }
    if (sensorFilter === 'ALL') {
      return 'Tìm kiếm theo giá trị hoặc thời gian...';
    }
    return `Tìm kiếm ${sensorFilter.toLowerCase()} theo giá trị hoặc thời gian...`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* Toolbar: Search on the left, Filter & Reset on the right (same row) */}
      <div className="px-5 py-2.5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        {/* Search input linh hoạt */}
        <div className="relative flex-1 max-w-sm lg:max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder={getSearchPlaceholder()}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filter and Reset button grouped on the right */}
        <div className="flex items-center gap-3 shrink-0 flex-nowrap overflow-x-auto">
          {/* Dropdown Bộ lọc (Loại cảm biến + Thời gian) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">Loại cảm biến:</span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
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
              <option value="Thời gian">Thời gian</option>
            </select>
          </div>

          {/* Reset button - always visible */}
          <button
            onClick={resetFilters}
            title="Đặt lại bộ lọc"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#2a1b4d] text-white text-xs">
              <th className="py-2.5 px-4 font-semibold rounded-tl-xl w-20">ID</th>
              <th className="py-2.5 px-4 font-semibold">Loại cảm biến</th>
              <th className="py-2.5 px-4 font-semibold">Giá trị cảm biến</th>
              <th className="py-2.5 px-4 font-semibold rounded-tr-xl">Thời gian đo</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {currentData.length > 0 ? (
              currentData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    }`}
                >
                  <td className="py-2 px-4 text-gray-600 font-mono">{row.id}</td>
                  <td className="py-2 px-4 text-gray-900 font-medium">{row.type}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${row.type === 'Nhiệt độ'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : row.type === 'Độ ẩm'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                    >
                      {row.value}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-500 font-mono">{row.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="py-10 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium">Không tìm thấy dữ liệu cảm biến phù hợp</p>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-[#2a1b4d] underline font-medium mt-1 cursor-pointer"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 shrink-0">
        <div className="text-gray-500">
          Hiển thị <span className="font-semibold text-gray-700">{filteredData.length > 0 ? (safePage - 1) * validPageSize + 1 : 0}</span> đến{' '}
          <span className="font-semibold text-gray-700">
            {Math.min(safePage * validPageSize, filteredData.length)}
          </span>{' '}
          trong <span className="font-semibold text-gray-700">{filteredData.length}</span> bản ghi
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Số hàng:</span>
            <input
              type="number"
              min={1}
              max={100}
              value={pageSize || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setPageSize(0);
                } else {
                  const num = parseInt(val, 10);
                  if (!isNaN(num) && num > 0) {
                    setPageSize(num);
                    setCurrentPage(1);
                  }
                }
              }}
              onBlur={() => {
                if (!pageSize || pageSize < 1) {
                  setPageSize(10);
                }
              }}
              className="w-14 bg-gray-50/80 border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold text-center text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] focus:bg-white transition-all"
            />
          </div>
          <span className="font-medium">
            Trang {safePage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1 px-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1 px-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
