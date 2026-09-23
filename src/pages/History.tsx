import { Search, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface HistoryItem {
  id: number;
  name: string;
  action: 'Bật' | 'Tắt';
  status: 'Thành công' | 'Thất bại';
  time: string;
}

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

const mockData: HistoryItem[] = [
  { id: 20, name: 'LED 1', action: 'Bật', status: 'Thành công', time: '12/09/2026 21:46:12' },
  { id: 19, name: 'LED 2', action: 'Tắt', status: 'Thành công', time: '12/09/2026 21:40:05' },
  { id: 18, name: 'LED 3', action: 'Bật', status: 'Thất bại', time: '12/09/2026 21:35:48' },
  { id: 17, name: 'LED 1', action: 'Tắt', status: 'Thành công', time: '12/09/2026 21:28:30' },
  { id: 16, name: 'LED 2', action: 'Bật', status: 'Thất bại', time: '12/09/2026 21:15:19' },
  { id: 15, name: 'LED 3', action: 'Tắt', status: 'Thành công', time: '12/09/2026 21:02:44' },
  { id: 14, name: 'LED 1', action: 'Bật', status: 'Thành công', time: '12/09/2026 20:55:22' },
  { id: 13, name: 'LED 2', action: 'Tắt', status: 'Thành công', time: '12/09/2026 20:41:10' },
  { id: 12, name: 'LED 3', action: 'Bật', status: 'Thành công', time: '12/09/2026 20:30:00' },
  { id: 11, name: 'LED 1', action: 'Tắt', status: 'Thất bại', time: '12/09/2026 20:12:35' },
  { id: 10, name: 'LED 2', action: 'Bật', status: 'Thành công', time: '12/09/2026 19:58:14' },
  { id: 9, name: 'LED 3', action: 'Tắt', status: 'Thành công', time: '12/09/2026 19:45:29' },
  { id: 8, name: 'LED 1', action: 'Bật', status: 'Thành công', time: '12/09/2026 19:30:15' },
  { id: 7, name: 'LED 2', action: 'Bật', status: 'Thất bại', time: '12/09/2026 19:15:50' },
  { id: 6, name: 'LED 3', action: 'Bật', status: 'Thành công', time: '12/09/2026 19:00:02' },
];

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ searchParams hoặc sessionStorage để giữ nguyên khi reload
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('time') || sessionStorage.getItem('history_time') || '';
  });

  const [deviceFilter, setDeviceFilter] = useState(() => {
    return searchParams.get('device') || sessionStorage.getItem('history_device') || 'ALL';
  });

  const [actionFilter, setActionFilter] = useState(() => {
    return searchParams.get('action') || sessionStorage.getItem('history_action') || 'ALL';
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    return searchParams.get('status') || sessionStorage.getItem('history_status') || 'ALL';
  });

  const [pageSize, setPageSize] = useState(() => {
    const s = searchParams.get('size') || sessionStorage.getItem('history_size');
    return s ? Number(s) : 10;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const p = searchParams.get('page') || sessionStorage.getItem('history_page');
    return p ? Number(p) : 1;
  });

  // Đồng bộ filter vào URL searchParams và sessionStorage khi có thay đổi
  useEffect(() => {
    sessionStorage.setItem('history_device', deviceFilter);
    sessionStorage.setItem('history_action', actionFilter);
    sessionStorage.setItem('history_status', statusFilter);
    sessionStorage.setItem('history_time', searchTerm);
    sessionStorage.setItem('history_size', String(pageSize));
    sessionStorage.setItem('history_page', String(currentPage));

    const params: Record<string, string> = {};
    if (deviceFilter !== 'ALL') params.device = deviceFilter;
    if (actionFilter !== 'ALL') params.action = actionFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (searchTerm.trim()) params.time = searchTerm.trim();
    if (currentPage > 1) params.page = String(currentPage);
    if (pageSize !== 10) params.size = String(pageSize);

    setSearchParams(params, { replace: true });
  }, [deviceFilter, actionFilter, statusFilter, searchTerm, pageSize, currentPage, setSearchParams]);

  // Filter data based on search term, device, action, and status
  const filteredData = useMemo(() => {
    return mockData.filter((item) => {
      const matchDevice = deviceFilter === 'ALL' || item.name === deviceFilter;
      const matchAction = actionFilter === 'ALL' || item.action === actionFilter;
      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchSearch = matchesTimeSearch(item.time, searchTerm);

      return matchDevice && matchAction && matchStatus && matchSearch;
    });
  }, [searchTerm, deviceFilter, actionFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  // Handle page reset if current page exceeds total
  const safePage = Math.min(currentPage, totalPages);

  const resetFilters = () => {
    setSearchTerm('');
    setDeviceFilter('ALL');
    setActionFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
    sessionStorage.removeItem('history_device');
    sessionStorage.removeItem('history_action');
    sessionStorage.removeItem('history_status');
    sessionStorage.removeItem('history_time');
    sessionStorage.removeItem('history_size');
    sessionStorage.removeItem('history_page');
    setSearchParams({}, { replace: true });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full animate-in fade-in duration-500">
      {/* Toolbar: Search on the left, Filters on the right (same row) */}
      <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Expanded search input on the left */}
        <div className="relative flex-1 max-w-sm lg:max-w-md min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo thời gian..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        {/* Filters and Reset button grouped on the right in one single row */}
        <div className="flex items-center gap-3 shrink-0 flex-nowrap overflow-x-auto">
          {/* Device Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Tên thiết bị:</span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
              value={deviceFilter}
              onChange={(e) => {
                setDeviceFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="LED 1">LED 1</option>
              <option value="LED 2">LED 2</option>
              <option value="LED 3">LED 3</option>
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Hành động:</span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="Bật">Bật</option>
              <option value="Tắt">Tắt</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">Trạng thái:</span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="Thành công">Thành công</option>
              <option value="Thất bại">Thất bại</option>
            </select>
          </div>

          {/* Reset Filters button - always visible on the same row */}
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
      <div className="flex-1 overflow-auto px-6 pb-6 mt-4">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#2a1b4d] text-white">
              <th className="py-4 px-6 font-semibold rounded-tl-xl w-24">ID</th>
              <th className="py-4 px-6 font-semibold">Tên thiết bị</th>
              <th className="py-4 px-6 font-semibold">Hành động</th>
              <th className="py-4 px-6 font-semibold">Trạng thái</th>
              <th className="py-4 px-6 font-semibold rounded-tr-xl">Thời gian thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {currentData.length > 0 ? (
              currentData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    }`}
                >
                  <td className="py-4 px-6 text-gray-600 font-mono text-sm">{row.id}</td>
                  <td className="py-4 px-6 text-gray-900 font-medium">{row.name}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${row.action === 'Bật'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                    >
                      {row.action}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${row.status === 'Thành công'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                    >
                      {row.status === 'Thành công' ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5" />
                      )}
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 text-sm font-mono">{row.time}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium">Không tìm thấy dữ liệu phù hợp</p>
                    <button
                      onClick={resetFilters}
                      className="text-xs text-[#2a1b4d] underline font-medium mt-1"
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
      <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600 px-6">
        <div className="text-xs text-gray-500">
          Hiển thị <span className="font-semibold text-gray-700">{filteredData.length > 0 ? (safePage - 1) * pageSize + 1 : 0}</span> đến{' '}
          <span className="font-semibold text-gray-700">
            {Math.min(safePage * pageSize, filteredData.length)}
          </span>{' '}
          trong <span className="font-semibold text-gray-700">{filteredData.length}</span> bản ghi
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
            Trang {safePage} / {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            >
              &lt;
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
