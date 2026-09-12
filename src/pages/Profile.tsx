import { Mail, UserCircle, GraduationCap, MapPin, Phone, BookOpen, ExternalLink, Users } from 'lucide-react';
import { FaGithub, FaFigma } from 'react-icons/fa';

export default function Profile() {
  return (
    <div className="min-h-full flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-8">
      {/* User Card */}
      <div className="w-full lg:w-[420px] xl:w-[450px] shrink-0 bg-white rounded-3xl shadow-sm border border-gray-100 p-8 flex flex-col items-center h-fit">
        <div className="w-32 h-32 shrink-0 aspect-square bg-gradient-to-br from-[#2a1b4d] to-purple-600 rounded-full flex items-center justify-center text-4xl text-white font-bold mb-4 shadow-xl border-4 border-white">
          NT
        </div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">Nguyễn Duy Thanh</h2>

        <div className="w-full h-px bg-gray-200 my-8"></div>

        <div className="w-full space-y-5">
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <Mail className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">ThanhND.B23CN761@stu.ptit.edu.vn</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <UserCircle className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium">B23DCCN761</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <Users className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium">D23CNPM03</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <GraduationCap className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium">Khoa CNTT1</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <MapPin className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium">Hà Đông, Hà Nội, Việt Nam</span>
          </div>
          <div className="flex items-center gap-4 text-gray-600 hover:text-blue-600 transition-colors">
            <Phone className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="font-medium">0987654321</span>
          </div>
        </div>
      </div>

      {/* Links Cards */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 h-fit">
        {/* Github */}
        <a href="https://github.com/ThanhND05/iot_backend" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-48" target="_blank" rel="noopener noreferrer">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaGithub className="w-8 h-8 text-gray-800 shrink-0" />
              <h3 className="text-xl font-bold text-gray-800">GitHub</h3>
            </div>
            <p className="text-gray-600">Source code dự án</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:underline">
            Mở liên kết <ExternalLink className="w-4 h-4" />
          </div>
        </a>

        {/* Figma */}
        <a href="https://www.figma.com/design/GeleNXABjWCLxidTSf8UJv/IoT-Device-Monitoring-Dashboard--Community-?node-id=6732-5549&t=xn6YcY6AEr1BEJ82-1" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-48" target="_blank" rel="noopener noreferrer">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <FaFigma className="w-8 h-8 text-pink-500 shrink-0" />
              <h3 className="text-xl font-bold text-gray-800">Figma</h3>
            </div>
            <p className="text-gray-600">Bản thiết kế UI/UX</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:underline">
            Mở liên kết <ExternalLink className="w-4 h-4" />
          </div>
        </a>

        {/* Postman */}
        <a href="#" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-[#FF6C37] flex items-center justify-center shrink-0">
                <span className="text-white font-bold text-xs">P</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800">Postman</h3>
            </div>
            <p className="text-gray-600">Bộ sưu tập API test</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:underline">
            Mở liên kết <ExternalLink className="w-4 h-4" />
          </div>
        </a>

        {/* Report */}
        <a href="#" className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between h-48">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <BookOpen className="w-8 h-8 text-red-500 shrink-0" />
              <h3 className="text-xl font-bold text-gray-800">Báo cáo</h3>
            </div>
            <p className="text-gray-600">Tài liệu báo cáo bài tập lớn</p>
          </div>
          <div className="flex items-center gap-2 text-blue-600 font-medium group-hover:underline">
            Mở liên kết <ExternalLink className="w-4 h-4" />
          </div>
        </a>
      </div>
    </div>
  )
}
