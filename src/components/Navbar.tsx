import { NavLink } from "react-router-dom";
import { Sparkles, FormInput, Search, Settings } from "lucide-react";
import { cn } from "../lib/utils";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 p-4 flex justify-center pointer-events-none">
      <div className="glass-panel rounded-full px-6 py-3 flex items-center gap-8 pointer-events-auto">
        <NavLink to="/" className={({isActive}) => cn("flex flex-col items-center gap-1 text-slate-500 hover:text-pink-400 transition-colors", isActive && "text-pink-500")}>
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">首頁</span>
        </NavLink>
        <NavLink to="/form" className={({isActive}) => cn("flex flex-col items-center gap-1 text-slate-500 hover:text-pink-400 transition-colors", isActive && "text-pink-500")}>
          <FormInput className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">委託填單</span>
        </NavLink>
        <NavLink to="/track" className={({isActive}) => cn("flex flex-col items-center gap-1 text-slate-500 hover:text-blue-400 transition-colors", isActive && "text-blue-500")}>
          <Search className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider">進度查詢</span>
        </NavLink>
        <NavLink to="/admin" className={({isActive}) => cn("flex flex-col items-center gap-1 text-slate-500 hover:text-slate-800 transition-colors", isActive && "text-slate-800")}>
          <Settings className="w-4 h-4" />
          <span className="text-[10px] font-bold tracking-wider">管理員</span>
        </NavLink>
      </div>
    </nav>
  );
}
