import {
  Search,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from 'lucide-react';
import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { actionApi } from '../api/actionApi';
import type { ActionResponse } from '../api/types';
import { webSocketService } from '../services/websocketService';

const MAX_PAGE_SIZE = 100;

export default function History() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(() => {
    return (
      searchParams.get('time') ||
      sessionStorage.getItem('history_time') ||
      ''
    );
  });

  const [deviceFilter, setDeviceFilter] = useState(() => {
    return (
      searchParams.get('device') ||
      sessionStorage.getItem('history_device') ||
      'ALL'
    );
  });

  const [actionFilter, setActionFilter] = useState(() => {
    return (
      searchParams.get('action') ||
      sessionStorage.getItem('history_action') ||
      'ALL'
    );
  });

  const [statusFilter, setStatusFilter] = useState(() => {
    return (
      searchParams.get('status') ||
      sessionStorage.getItem('history_status') ||
      'ALL'
    );
  });

  const [pageSize, setPageSize] = useState(() => {
    const raw =
      searchParams.get('size') ||
      sessionStorage.getItem('history_size');
    const parsed = raw ? Number(raw) : 10;
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, MAX_PAGE_SIZE)
      : 10;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const raw =
      searchParams.get('page') ||
      sessionStorage.getItem('history_page');
    const parsed = raw ? Number(raw) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const [actions, setActions] = useState<ActionResponse[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Bỏ qua response cũ khi người dùng đổi filter liên tục.
  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef<number | null>(null);

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const validPageSize = pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : 10;

  useEffect(() => {
    sessionStorage.setItem('history_device', deviceFilter);
    sessionStorage.setItem('history_action', actionFilter);
    sessionStorage.setItem('history_status', statusFilter);
    sessionStorage.setItem('history_time', searchTerm);
    sessionStorage.setItem('history_size', String(validPageSize));
    sessionStorage.setItem('history_page', String(currentPage));

    const params: Record<string, string> = {};
    if (deviceFilter !== 'ALL') {
      params.device = deviceFilter;
    }
    if (actionFilter !== 'ALL') {
      params.action = actionFilter;
    }
    if (statusFilter !== 'ALL') {
      params.status = statusFilter;
    }
    if (debouncedSearchTerm) {
      params.time = debouncedSearchTerm;
    }
    if (currentPage > 1) {
      params.page = String(currentPage);
    }
    if (validPageSize !== 10) {
      params.size = String(validPageSize);
    }

    setSearchParams(params, { replace: true });
  }, [
    deviceFilter,
    actionFilter,
    statusFilter,
    debouncedSearchTerm,
    validPageSize,
    currentPage,
    setSearchParams,
  ]);

  const mapActionToBackend = (
    value: string,
  ): 'ON' | 'OFF' | undefined => {
    if (value === 'Bật') return 'ON';
    if (value === 'Tắt') return 'OFF';
    return undefined;
  };

  const mapStatusToBackend = (
    value: string,
  ): 'SUCCESS' | 'FAILED' | 'PENDING' | undefined => {
    if (value === 'Thành công') return 'SUCCESS';
    if (value === 'Thất bại') return 'FAILED';
    if (value === 'Đang chờ') return 'PENDING';
    return undefined;
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

  const formatDateTime = (isoString?: string | null) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      return isoString;
    }
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
    const requestId = ++requestIdRef.current;

    if (loadingTimerRef.current !== null) {
      window.clearTimeout(loadingTimerRef.current);
    }

    // Chỉ hiện loading khi request đủ chậm để người dùng thực sự cần thấy nó.
    loadingTimerRef.current = window.setTimeout(() => {
      if (requestId === requestIdRef.current) {
        setIsLoading(true);
      }
    }, 150);

    try {
      const res = await actionApi.searchActions({
        page: currentPage - 1,
        size: validPageSize,
        device: deviceFilter === 'ALL' ? undefined : deviceFilter,
        action: mapActionToBackend(actionFilter),
        status: mapStatusToBackend(statusFilter),
        time: debouncedSearchTerm || undefined,
      });

      if (requestId !== requestIdRef.current) return;

      if (res.success && res.data) {
        const nextTotalPages = Math.max(1, res.data.totalPages || 1);

        startTransition(() => {
          setActions(res.data.content || []);
          setTotalPages(nextTotalPages);
          setTotalElements(res.data.totalElements || 0);
        });

        if (currentPage > nextTotalPages) {
          setCurrentPage(nextTotalPages);
        }
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        console.log(
          'Notice: Chưa thể kết nối Backend hoặc chưa có dữ liệu hành động:',
          err,
        );
      }
      // Giữ nguyên bảng hiện tại nếu request lỗi.
    } finally {
      if (requestId === requestIdRef.current) {
        if (loadingTimerRef.current !== null) {
          window.clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        setIsLoading(false);
      }
    }
  }, [
    currentPage,
    validPageSize,
    deviceFilter,
    actionFilter,
    statusFilter,
    debouncedSearchTerm,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    return () => {
      if (loadingTimerRef.current !== null) {
        window.clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Keep a stable ref to fetchData so WebSocket callbacks always use the latest version.
  const fetchDataRef = useRef(fetchData);

  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // Refresh history when any device action status changes via WebSocket.
  // This makes PENDING → SUCCESS/FAILED appear instantly without manual reload.
  useEffect(() => {
    const unsubscribes = [1, 2, 3].map((deviceId) =>
      webSocketService.onDeviceStatus(deviceId, () => {
        // Small delay to let the DB write complete before re-fetching.
        setTimeout(() => fetchDataRef.current(), 500);
      }),
    );

    return () => unsubscribes.forEach((fn) => fn());
  }, []);

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setDeviceFilter('ALL');
    setActionFilter('ALL');
    setStatusFilter('ALL');
    setPageSize(10);
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col h-full overflow-hidden animate-in fade-in duration-500">
      {/* Toolbar */}
      <div className="px-5 py-2.5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="relative flex-1 max-w-sm lg:max-w-md min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo thời gian..."
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50/80 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] focus:bg-white transition-all text-gray-800 placeholder-gray-400"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-nowrap overflow-x-auto">
          {/* Device Filter */}
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Tên thiết bị:
            </span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
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
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Hành động:
            </span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
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
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Trạng thái:
            </span>
            <select
              className="bg-gray-50/80 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs font-medium text-gray-700 cursor-pointer hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#2a1b4d]/20 focus:border-[#2a1b4d] transition-all"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="ALL">Tất cả</option>
              <option value="Thành công">Thành công</option>
              <option value="Thất bại">Thất bại</option>
              <option value="Đang chờ">Đang chờ</option>
            </select>
          </div>

          <button
            onClick={resetFilters}
            title="Đặt lại bộ lọc"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200/80 rounded-xl transition-all shrink-0 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại</span>
          </button>

          {/* Reserved spinner slot — no layout shift */}
          <div className="w-3.5 h-3.5 shrink-0">
            {isLoading && (
              <Loader2 className="w-3.5 h-3.5 text-[#2a1b4d] animate-spin" />
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#2a1b4d] text-white text-xs">
              <th className="py-2.5 px-4 font-semibold rounded-tl-xl w-16">
                ID
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Người thực hiện
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Tên thiết bị
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Hành động
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Trạng thái
              </th>
              <th className="py-2.5 px-4 font-semibold rounded-tr-xl">
                Thời gian thực hiện
              </th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {actions.length > 0 ? (
              actions.map((row, idx) => {
                const actionLabel = mapActionDisplay(row.action);
                const statusLabel = mapStatusDisplay(row.status);

                return (
                  <tr
                    key={row.id}
                    className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                    }`}
                  >
                    <td className="py-2 px-4 text-gray-600 font-mono">
                      {row.id}
                    </td>
                    <td className="py-2 px-4 text-gray-800 font-medium">
                      Nguyễn Duy Thanh
                    </td>
                    <td className="py-2 px-4 text-gray-900 font-medium">
                      {row.deviceName || `LED ${row.deviceId}`}
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold ${
                          actionLabel === 'Bật'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {actionLabel}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          statusLabel === 'Thành công'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : statusLabel === 'Thất bại'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {statusLabel === 'Thành công' && (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        {statusLabel === 'Thất bại' && (
                          <XCircle className="w-3.5 h-3.5" />
                        )}
                        {statusLabel === 'Đang chờ' && (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-gray-500 font-mono">
                      {formatDateTime(row.createdAt)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium">
                      Không tìm thấy dữ liệu phù hợp
                    </p>
                    {(searchTerm ||
                      deviceFilter !== 'ALL' ||
                      actionFilter !== 'ALL' ||
                      statusFilter !== 'ALL') && (
                      <button
                        onClick={resetFilters}
                        className="text-xs text-[#2a1b4d] underline font-medium mt-1 cursor-pointer"
                      >
                        Xóa bộ lọc
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
      <div className="px-5 py-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600 shrink-0">
        <div className="text-gray-500">
          Hiển thị{' '}
          <span className="font-semibold text-gray-700">
            {actions.length > 0
              ? (currentPage - 1) * validPageSize + 1
              : 0}
          </span>{' '}
          đến{' '}
          <span className="font-semibold text-gray-700">
            {Math.min(
              (currentPage - 1) * validPageSize + actions.length,
              totalElements,
            )}
          </span>{' '}
          trong{' '}
          <span className="font-semibold text-gray-700">
            {totalElements}
          </span>{' '}
          bản ghi
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span>Số hàng:</span>
            <input
              type="number"
              min={1}
              max={MAX_PAGE_SIZE}
              value={pageSize || ''}
              onChange={(e) => {
                const raw = e.target.value;
                if (raw === '') {
                  setPageSize(0);
                  return;
                }
                const parsed = Number.parseInt(raw, 10);
                if (Number.isFinite(parsed) && parsed > 0) {
                  setPageSize(Math.min(parsed, MAX_PAGE_SIZE));
                  setCurrentPage(1);
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
            Trang {currentPage} / {totalPages}
          </span>

          <div className="flex gap-1">
            <button
              onClick={() =>
                setCurrentPage((page) => Math.max(1, page - 1))
              }
              disabled={currentPage <= 1}
              className="p-1 px-2 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs cursor-pointer"
            >
              &lt;
            </button>
            <button
              onClick={() =>
                setCurrentPage((page) =>
                  Math.min(totalPages, page + 1),
                )
              }
              disabled={currentPage >= totalPages}
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
