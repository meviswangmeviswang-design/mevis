import { ExternalLink, Brush, Mail, Twitter, Facebook, Instagram } from "lucide-react";

export default function Home() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-500">
      <div className="glass-panel p-8 sm:p-12 max-w-lg w-full text-center flex flex-col items-center">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-full bg-white shadow-xl mb-6 border-4 border-white flex items-center justify-center text-slate-300 overflow-hidden relative">
          {/* 預設載入 /avatar.jpeg，若無圖片使用者可自行上傳並命名為 avatar.jpeg */}
          <img 
            src="/avatar.jpeg" 
            alt="夢月 Avatar" 
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-tr from-pink-300 to-blue-300 hidden">
             <Brush className="w-10 h-10 text-white" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">
          夢月
        </h1>
        <p className="text-slate-500 mb-8 font-medium">
          Freelance Illustrator & Character Designer
        </p>

        <div className="w-full flex flex-col gap-4">
          <a href="https://x.com/yuchenwang78317" target="_blank" rel="noopener noreferrer" className="glass-btn flex items-center justify-center gap-3 w-full group">
            <Twitter className="w-5 h-5 text-sky-500 group-hover:scale-110 transition-transform" />
            <span>Twitter / X</span>
            <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
          </a>
          <a href="https://www.facebook.com/profile.php?id=61575737396381" target="_blank" rel="noopener noreferrer" className="glass-btn flex items-center justify-center gap-3 w-full group">
            <Facebook className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
            <span>Facebook</span>
            <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
          </a>
          <a href="https://www.instagram.com/ramona_1577/" target="_blank" rel="noopener noreferrer" className="glass-btn flex items-center justify-center gap-3 w-full group">
            <Instagram className="w-5 h-5 text-pink-500 group-hover:scale-110 transition-transform" />
            <span>Instagram</span>
            <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
          </a>
          <a href="https://mail.google.com/mail/?view=cm&fs=1&to=meiyiya005@gmail.com" target="_blank" rel="noopener noreferrer" className="glass-btn flex items-center justify-center gap-3 w-full group">
            <Mail className="w-5 h-5 text-slate-500 group-hover:scale-110 transition-transform" />
            <span>聯絡信箱 (Email)</span>
            <ExternalLink className="w-4 h-4 ml-auto opacity-50" />
          </a>
        </div>
      </div>
      
      <div className="mt-12 text-sm text-slate-400 font-medium tracking-wide">
        © {new Date().getFullYear()} 夢月. All rights reserved.
      </div>
    </div>
  );
}
