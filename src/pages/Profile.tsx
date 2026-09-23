import { Mail, UserCircle, GraduationCap, MapPin, Phone, BookOpen, ExternalLink, Users, Camera, Trash2 } from 'lucide-react';
import { FaGithub, FaFigma } from 'react-icons/fa';
import { useState, useRef } from 'react';

export default function Profile() {
  const [avatar, setAvatar] = useState<string>(() => {
    return localStorage.getItem('user_avatar') || '';
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Vui lòng chọn file ảnh dung lượng dưới 5MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setAvatar(base64);
        localStorage.setItem('user_avatar', base64);
        window.dispatchEvent(new Event('avatarUpdated'));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatar('');
    localStorage.removeItem('user_avatar');
    window.dispatchEvent(new Event('avatarUpdated'));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 overflow-hidden animate-in fade-in duration-500">
      {/* User Card */}
      <div className="w-full lg:w-[350px] xl:w-[380px] shrink-0 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 xl:p-6 flex flex-col items-center justify-center h-full overflow-hidden">
        <div className="flex flex-col items-center w-full my-auto">
          {/* Avatar with Upload button */}
          <div className="relative group mb-3">
            <div className="w-24 h-24 xl:w-28 xl:h-28 shrink-0 aspect-square bg-gradient-to-br from-[#2a1b4d] to-purple-600 rounded-full flex items-center justify-center text-3xl xl:text-4xl text-white font-bold shadow-lg border-4 border-white overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>NT</span>
              )}
            </div>

            {/* Nút Upload ảnh */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full bg-[#2a1b4d] text-white hover:bg-purple-700 shadow-md border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
              title="Đổi ảnh đại diện"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Nút Xoá ảnh đại diện nếu có */}
            {avatar && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="absolute top-0 right-0 p-1.5 rounded-full bg-red-600 text-white hover:bg-red-700 shadow-md border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-all duration-200"
                title="Xoá ảnh đại diện"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>

          <h2 className="text-xl xl:text-2xl font-bold text-gray-800 text-center">Nguyễn Duy Thanh</h2>
          <div className="w-full h-px bg-gray-100 my-3 xl:my-4" />

          {/* User Details */}
          <div className="w-full space-y-2.5 xl:space-y-3 text-sm">
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <Mail className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium truncate">ThanhND.B23CN761@stu.ptit.edu.vn</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <UserCircle className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium">B23DCCN761</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <Users className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium">D23CNPM03</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <GraduationCap className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium">Khoa CNTT1</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium">Hà Đông, Hà Nội, Việt Nam</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 hover:text-blue-600 transition-colors">
              <Phone className="w-4.5 h-4.5 text-gray-400 shrink-0" />
              <span className="font-medium">0987654321</span>
            </div>
          </div>
        </div>
      </div>

      {/* Links Cards */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
        {/* Github */}
        <a
          href="https://github.com/ThanhND05/iot_frontend"
          className="bg-white p-5 xl:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <FaGithub className="w-10 h-10 xl:w-12 xl:h-12 text-gray-800 shrink-0 group-hover:scale-105 transition-transform" />
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-800">GitHub</h3>
            </div>
            <p className="text-sm xl:text-base text-gray-600 ml-0.5">Source code dự án</p>
          </div>
          <div className="flex items-center gap-2 text-sm xl:text-base text-blue-600 font-semibold group-hover:underline mt-4">
            <span>Mở liên kết</span>
            <ExternalLink className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
        </a>

        {/* Figma */}
        <a
          href="https://www.figma.com/design/GeleNXABjWCLxidTSf8UJv/IoT-Device-Monitoring-Dashboard--Community-?node-id=6732-5549&t=xn6YcY6AEr1BEJ82-1"
          className="bg-white p-5 xl:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-full"
          target="_blank"
          rel="noopener noreferrer"
        >
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <FaFigma className="w-10 h-10 xl:w-12 xl:h-12 text-pink-500 shrink-0 group-hover:scale-105 transition-transform" />
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-800">Figma</h3>
            </div>
            <p className="text-sm xl:text-base text-gray-600 ml-0.5">Bản thiết kế UI/UX</p>
          </div>
          <div className="flex items-center gap-2 text-sm xl:text-base text-blue-600 font-semibold group-hover:underline mt-4">
            <span>Mở liên kết</span>
            <ExternalLink className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
        </a>

        {/* Postman */}
        <a
          href="#"
          className="bg-white p-5 xl:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-10 h-10 xl:w-12 xl:h-12 rounded-full bg-[#FF6C37] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-sm">
                <span className="text-white font-bold text-base xl:text-lg">P</span>
              </div>
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-800">Postman</h3>
            </div>
            <p className="text-sm xl:text-base text-gray-600 ml-0.5">Bộ sưu tập API test</p>
          </div>
          <div className="flex items-center gap-2 text-sm xl:text-base text-blue-600 font-semibold group-hover:underline mt-4">
            <span>Mở liên kết</span>
            <ExternalLink className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
        </a>

        {/* Report */}
        <a
          href="#"
          className="bg-white p-5 xl:p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group flex flex-col justify-between h-full"
        >
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <BookOpen className="w-10 h-10 xl:w-12 xl:h-12 text-red-500 shrink-0 group-hover:scale-105 transition-transform" />
              <h3 className="text-2xl xl:text-3xl font-bold text-gray-800">Báo cáo</h3>
            </div>
            <p className="text-sm xl:text-base text-gray-600 ml-0.5">Tài liệu báo cáo bài tập lớn</p>
          </div>
          <div className="flex items-center gap-2 text-sm xl:text-base text-blue-600 font-semibold group-hover:underline mt-4">
            <span>Mở liên kết</span>
            <ExternalLink className="w-4 h-4 xl:w-4.5 xl:h-4.5" />
          </div>
        </a>
      </div>
    </div>
  );
}
