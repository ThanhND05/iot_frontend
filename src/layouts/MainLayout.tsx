import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Database, Clock, User, Hexagon } from 'lucide-react';

const MENU_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/datasensor', label: 'Datasensor', icon: Database },
  { path: '/history', label: 'History', icon: Clock },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function MainLayout() {
  const location = useLocation();

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
      <aside className="w-64 bg-gradient-to-b from-[#2a1b4d] to-[#1e1438] text-white flex flex-col shadow-xl z-10">
        <div className="p-6 flex items-center gap-2 text-2xl font-bold border-b border-white/10">
          <span className="text-red-500">Thanh</span><span>IoT</span>
          <Hexagon className="w-6 h-6 text-white/50" />
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {MENU_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium ${
                  isActive 
                    ? 'bg-gradient-to-r from-white/90 to-white/70 text-[#2a1b4d] shadow-lg scale-105' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#F3F4F6] flex items-center justify-between px-8 z-0 border-b border-gray-200">
          <div>
            <div className="text-sm text-gray-500">Chào mừng trở lại,</div>
            <h1 className="text-xl font-bold text-[#2a1b4d]">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm font-semibold text-gray-800">Nguyễn Duy Thanh</div>
              <div className="text-xs text-gray-500">thanhnd.b23cn761@gmail.com</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold overflow-hidden shadow-md">
                <img src="https://ui-avatars.com/api/?name=Thanh+Nguyen&background=2563eb&color=fff" alt="Avatar" className="w-full h-full object-cover"/>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
