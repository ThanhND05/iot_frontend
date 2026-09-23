import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Clock, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import logoImg from '../assets/logo.png';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/datasensor', label: 'Datasensor', icon: Database },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MainLayout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/dashboard': return 'Trang quản lý hệ thống IoT';
      case '/datasensor': return 'Dữ liệu cảm biến';
      case '/history': return 'Lịch sử bật tắt thiết bị';
      case '/profile': return 'Trang cá nhân';
      default: return 'Trang quản lý';
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#F3F4F6] text-gray-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`${isCollapsed ? 'w-20' : 'w-64'
          } bg-gradient-to-b from-[#2a1b4d] to-[#1e1438] text-white flex flex-col shadow-xl z-20 transition-all duration-300 ease-in-out shrink-0 relative`}
      >
        {/* Floating Toggle Button ở viền bên phải */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-[26px] w-7 h-7 bg-white text-[#2a1b4d] rounded-full shadow-md border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 hover:scale-110 active:scale-95 transition-all duration-200 z-30"
          title={isCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          ) : (
            <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>

        {/* Sidebar Header */}
        <div className="h-20 flex items-center justify-center border-b border-white/10 px-4 transition-all duration-300">
          {!isCollapsed ? (
            <Link to="/dashboard" className="flex items-center justify-center overflow-hidden hover:opacity-95 transition-opacity">
              <img src={logoImg} alt="ThanhIoT" className="h-9 w-auto max-w-[185px] object-contain rounded-md" />
            </Link>
          ) : (
            <Link to="/dashboard" className="flex items-center justify-center overflow-hidden hover:opacity-95 transition-opacity" title="ThanhIoT">
              <span className="text-xl font-black text-red-500 tracking-tighter">T</span>
              <span className="text-sm font-bold text-white">IoT</span>
            </Link>
          )}
        </div>

        {/* Sidebar Navigation */}
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                title={isCollapsed ? item.label : undefined}
                className={`flex items-center rounded-xl transition-all duration-200 font-medium ${isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
                  } ${isActive
                    ? 'bg-gradient-to-r from-white/95 to-white/80 text-[#2a1b4d] shadow-md font-semibold'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-20 bg-[#F3F4F6] flex items-center justify-between px-8 z-0 border-b border-gray-200 shrink-0">
          <div>
            {/* <div className="text-xs sm:text-sm text-gray-500">Chào mừng trở lại,</div> */}
            <h1 className="text-lg sm:text-xl font-bold text-[#2a1b4d] truncate">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-semibold text-gray-800">Nguyễn Duy Thanh</div>
              <div className="text-xs text-gray-500">thanhnd.b23cn761@gmail.com</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md shrink-0">
              <img
                src="https://ui-avatars.com/api/?name=Thanh+Nguyen&background=2563eb&color=fff"
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
