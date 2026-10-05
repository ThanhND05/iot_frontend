import { Search, RotateCcw, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback, useRef, startTransition } from 'react';
import { useSearchParams } from 'react-router-dom';
import { sensorApi } from '../api/sensorApi';
import type { DataSensorItem } from '../api/types';

const MAX_PAGE_SIZE = 100;

export default function DataSensor() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(() => {
    return (
      searchParams.get('search') ||
      sessionStorage.getItem('datasensor_search') ||
      ''
    );
  });

  const [sensorFilter, setSensorFilter] = useState(() => {
    return (
      searchParams.get('type') ||
      sessionStorage.getItem('datasensor_type') ||
      'ALL'
    );
  });

  const [pageSize, setPageSize] = useState(() => {
    const raw =
      searchParams.get('size') ||
      sessionStorage.getItem('datasensor_size');
    const parsed = raw ? Number(raw) : 10;
    return Number.isFinite(parsed) && parsed > 0
      ? Math.min(parsed, MAX_PAGE_SIZE)
      : 10;
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const raw =
      searchParams.get('page') ||
      sessionStorage.getItem('datasensor_page');
    const parsed = raw ? Number(raw) : 1;
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  });

  const [sensorData, setSensorData] = useState<DataSensorItem[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Chỉ nhận kết quả của request mới nhất, tránh response cũ ghi đè response mới.
  const requestIdRef = useRef(0);
  const loadingTimerRef = useRef<number | null>(null);

  // Tránh gọi API sau mỗi phím bấm.
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 220);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  const validPageSize = pageSize > 0 ? Math.min(pageSize, MAX_PAGE_SIZE) : 10;

  // Đồng bộ trạng thái filter vào URL + sessionStorage.
  useEffect(() => {
    sessionStorage.setItem('datasensor_type', sensorFilter);
    sessionStorage.setItem('datasensor_search', searchTerm);
    sessionStorage.setItem('datasensor_size', String(validPageSize));
    sessionStorage.setItem('datasensor_page', String(currentPage));

    const params: Record<string, string> = {};
    if (sensorFilter !== 'ALL') {
      params.type = sensorFilter;
    }
    if (debouncedSearchTerm) {
      params.search = debouncedSearchTerm;
    }
    if (currentPage > 1) {
      params.page = String(currentPage);
    }
    if (validPageSize !== 10) {
      params.size = String(validPageSize);
    }

    setSearchParams(params, { replace: true });
  }, [
    sensorFilter,
    debouncedSearchTerm,
    validPageSize,
    currentPage,
    setSearchParams,
  ]);

  const mapSensorTypeToBackend = (filter: string) => {
    switch (filter) {
      case 'Nhiệt độ':
        return 'temperature';
      case 'Độ ẩm':
        return 'humidity';
      case 'Ánh sáng':
        return 'light';
      case 'Thời gian':
      case 'ALL':
      default:
        return 'All';
    }
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

  const getSensorDisplayName = (type: string) => {
    if (type === 'temperature') return 'Nhiệt độ';
    if (type === 'humidity') return 'Độ ẩm';
    if (type === 'light') return 'Ánh sáng';
    return type;
  };

  const getSensorDisplayValue = (type: string, value: string) => {
    if (type === 'temperature') {
      return value.includes('°C') ? value : `${value}°C`;
    }
    if (type === 'humidity') {
      return value.includes('%') ? value : `${value}%`;
    }
    if (type === 'light') {
      return value.includes('Lux') ? value : `${value} Lux`;
    }
    return value;
  };

  const fetchData = useCallback(async () => {
    const requestId = ++requestIdRef.current;

    if (loadingTimerRef.current !== null) {
      window.clearTimeout(loadingTimerRef.current);
    }

    // Request nhanh dưới 150ms sẽ không hiện spinner -> tránh nháy UI.
    loadingTimerRef.current = window.setTimeout(() => {
      if (requestId === requestIdRef.current) {
        setIsLoading(true);
      }
    }, 150);

    try {
      const isTimeMode = sensorFilter === 'Thời gian';
      const res = await sensorApi.search({
        page: currentPage - 1,
        size: validPageSize,
        type: mapSensorTypeToBackend(sensorFilter),
        search: isTimeMode ? undefined : (debouncedSearchTerm || undefined),
        time: isTimeMode ? (debouncedSearchTerm || undefined) : undefined,
        searchMode: isTimeMode ? 'TIME' : 'ALL',
      });

      // Nếu đã có request mới hơn thì bỏ kết quả cũ.
      if (requestId !== requestIdRef.current) return;

      if (res.success && res.data) {
        const nextTotalPages = Math.max(1, res.data.totalPages || 1);

        startTransition(() => {
          setSensorData(res.data.content || []);
          setTotalPages(nextTotalPages);
          setTotalElements(res.data.totalElements || 0);
        });

        if (currentPage > nextTotalPages) {
          setCurrentPage(nextTotalPages);
        }
      }
    } catch (err) {
      if (requestId === requestIdRef.current) {
        console.log('Notice: Chưa thể kết nối Backend hoặc chưa có dữ liệu:', err);
      }
      // Giữ nguyên dữ liệu đang hiển thị nếu request lỗi.
    } finally {
      if (requestId === requestIdRef.current) {
        if (loadingTimerRef.current !== null) {
          window.clearTimeout(loadingTimerRef.current);
          loadingTimerRef.current = null;
        }
        setIsLoading(false);
      }
    }
  }, [currentPage, validPageSize, sensorFilter, debouncedSearchTerm]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSensorFilter('ALL');
    setPageSize(10);
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
      {/* Toolbar */}
      <div className="px-5 py-2.5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
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

        <div className="flex items-center gap-3 shrink-0 flex-nowrap overflow-x-auto">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-xs font-medium text-gray-600 whitespace-nowrap">
              Loại cảm biến:
            </span>
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
              <th className="py-2.5 px-4 font-semibold rounded-tl-xl w-20">
                ID
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Loại cảm biến
              </th>
              <th className="py-2.5 px-4 font-semibold">
                Giá trị cảm biến
              </th>
              <th className="py-2.5 px-4 font-semibold rounded-tr-xl">
                Thời gian đo
              </th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {sensorData.length > 0 ? (
              sensorData.map((row, idx) => (
                <tr
                  key={row.id}
                  className={`border-b border-gray-100 hover:bg-purple-50/30 transition-colors ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'
                  }`}
                >
                  <td className="py-2 px-4 text-gray-600 font-mono">
                    {row.id}
                  </td>
                  <td className="py-2 px-4 text-gray-900 font-medium">
                    {getSensorDisplayName(row.sensorType)}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        row.sensorType === 'temperature'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : row.sensorType === 'humidity'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {getSensorDisplayValue(row.sensorType, row.value)}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-gray-500 font-mono">
                    {formatDateTime(row.createdAt)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={4}
                  className="py-10 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Search className="w-8 h-8 text-gray-300" />
                    <p className="text-sm font-medium text-gray-600">
                      Không tìm thấy dữ liệu cảm biến phù hợp
                    </p>
                    <p className="text-xs text-gray-400">
                      Hãy thử thay đổi từ khóa hoặc bộ lọc
                    </p>
                    {(searchTerm || sensorFilter !== 'ALL') && (
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
            {sensorData.length > 0
              ? (currentPage - 1) * validPageSize + 1
              : 0}
          </span>{' '}
          đến{' '}
          <span className="font-semibold text-gray-700">
            {Math.min(
              (currentPage - 1) * validPageSize + sensorData.length,
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
                setCurrentPage((page) => Math.min(totalPages, page + 1))
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
