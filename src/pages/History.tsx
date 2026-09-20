import { Search, CheckCircle2, XCircle, RotateCcw, Loader2, Clock } from 'lucide-react';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { actionApi } from '../api/actionApi';
import type { ActionResponse } from '../api/types';

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Khởi tạo state từ searchParams hoặc sessionStorage để giữ nguyên bộ lọc khi reload (F5)
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('time') || sessionStorage.getItem('history_time') || '';
  });

  const [deviceFilter, setDeviceFilter] = useState(() => {
    return searchParams.get('device') || sessionStorage.getItem('history_device') || 'ALL';
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

  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Lưu và đồng bộ trạng thái filter vào URL searchParams và sessionStorage khi có thay đổi
  useEffect(() => {
    sessionStorage.setItem('history_device', deviceFilter);
    sessionStorage.setItem('history_status', statusFilter);
    sessionStorage.setItem('history_time', searchTerm);
    sessionStorage.setItem('history_size', String(pageSize));
    sessionStorage.setItem('history_page', String(currentPage));

    const params: Record<string, string> = {};
    if (deviceFilter !== 'ALL') params.device = deviceFilter;
    if (statusFilter !== 'ALL') params.status = statusFilter;
    if (searchTerm.trim()) params.time = searchTerm.trim();
    if (currentPage > 1) params.page = String(currentPage);
    if (pageSize !== 10) params.size = String(pageSize);

    setSearchParams(params, { replace: true });
  }, [deviceFilter, statusFilter, searchTerm, pageSize, currentPage, setSearchParams]);

  // Parse input date string (DD/MM/YYYY or YYYY-MM-DD) to YYYY-MM-DD
  const parseDateToApiFormat = (input: string) => {
    const trimmed = input.trim();
    if (!trimmed) return undefined;

    const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(trimmed);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

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

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await actionApi.searchActions({
        page: currentPage - 1,
        size: pageSize,
        device: deviceFilter === 'ALL' ? undefined : deviceFilter,
        time: parseDateToApiFormat(searchTerm),
      });

      if (res.success && res.data) {
        setActions(res.data.content || []);
        setTotalPages(Math.max(1, res.data.totalPages));
        setTotalElements(res.data.totalElements || 0);
      } else {
        setActions([]);
        setTotalPages(1);
        setTotalElements(0);
      }
    } catch (err) {
      console.log('Notice: Chưa thể kết nối Backend hoặc chưa có dữ liệu hành động:', err);
      setActions([]);
      setTotalPages(1);
      setTotalElements(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, pageSize, deviceFilter, searchTerm]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Client-side status filter if specified
  const filteredActions = useMemo(() => {
    if (statusFilter === 'ALL') return actions;
    return actions.filter((item) => {
      if (statusFilter === 'Thành công') return item.status === 'SUCCESS';
      if (statusFilter === 'Thất bại') return item.status === 'FAILED';
      return true;
    });
  }, [actions, statusFilter]);

  const resetFilters = () => {
    setSearchTerm('');
    setDeviceFilter('ALL');
    setStatusFilter('ALL');
    setCurrentPage(1);
    sessionStorage.removeItem('history_device');
    sessionStorage.removeItem('history_status');
    sessionStorage.removeItem('history_time');
    sessionStorage.removeItem('history_size');
    sessionStorage.removeItem('history_page');
    setSearchParams({}, { replace: true });
  };

  const mapActionDisplay = (action: string) => {
    if (action === 'ON') return 'Bật';
    if (action === 'OFF') return 'Tắt';
    return action;
  };

  const mapStatusDisplay = (status: string) => {
    if (status === 'SUCCESS') return 'Thành công';
    if (status === 'FAILED') return 'Thất bại';
    if (status === 'PENDING') return 'Đang chờ';
    return status;
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
            placeholder="Tìm theo ngày (YYYY-MM-DD hoặc DD/MM/YYYY)..."
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
              <th className="py-4 px-6 font-semibold">Tên thiết bị</th>
              <th className="py-4 px-6 font-semibold">Hành động</th>
              <th className="py-4 px-6 font-semibold">Trạng thái</th>
              <th className="py-4 px-6 font-semibold rounded-tr-xl">Thời gian thực hiện</th>
            </tr>
          </thead>
          <tbody>
            {filteredActions.length > 0 ? (
              filteredActions.map((row, idx) => {
                const actionLabel = mapActionDisplay(row.action);
                const statusLabel = mapStatusDisplay(row.status);

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    }`}
                  >
                    <td className="py-4 px-6 text-gray-600 font-mono text-sm">{row.id}</td>
                    <td className="py-4 px-6 text-gray-900 font-medium">{row.deviceName || `LED ${row.deviceId}`}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${
                          actionLabel === 'Bật'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                          statusLabel === 'Thành công'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : statusLabel === 'Thất bại'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {statusLabel === 'Thành công' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {statusLabel === 'Thất bại' && <XCircle className="w-3.5 h-3.5" />}
                        {statusLabel === 'Đang chờ' && <Clock className="w-3.5 h-3.5" />}
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm font-mono">
                      {formatDateTime(row.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">Chưa có dữ liệu</p>
                    <p className="text-xs text-gray-400">
                      Lịch sử bật/tắt thiết bị sẽ được ghi lại tự động khi bạn điều khiển công tắc
                    </p>
                    {(searchTerm || deviceFilter !== 'ALL' || statusFilter !== 'ALL') && (
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
            {filteredActions.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
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
