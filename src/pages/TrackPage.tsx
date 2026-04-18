import React, { useState } from "react";
import { db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Search, Loader2, Check, Package, PenTool, PaintBucket, Palette, Image as ImageIcon, Send } from "lucide-react";
import { cn } from "../lib/utils";

const PROGRESS_NODES = [
  { id: "1", label: "已填單", icon: Package },
  { id: "2", label: "排單中", icon: Loader2 },
  { id: "3", label: "草稿", icon: PenTool },
  { id: "4", label: "線稿", icon: PenTool },
  { id: "5", label: "色稿", icon: Palette },
  { id: "6", label: "成圖", icon: PaintBucket },
  { id: "7", label: "已交付", icon: Send }
];

export default function TrackPage() {
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [commission, setCommission] = useState<any>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = searchInput.trim();
    if (!code) return;
    
    setIsLoading(true);
    setError("");
    setCommission(null);

    try {
      // 1. Try directly searching commissions (for temp codes)
      let docSnap = await getDoc(doc(db, "commissions", code));
      
      // 2. If not found, try searching aliases (for official tracking IDs)
      if (!docSnap.exists()) {
        const aliasSnap = await getDoc(doc(db, "tracking_aliases", code));
        if (aliasSnap.exists()) {
          const actualCode = aliasSnap.data().commissionId;
          docSnap = await getDoc(doc(db, "commissions", actualCode));
        }
      }

      if (docSnap.exists()) {
        setCommission({ id: docSnap.id, ...docSnap.data() });
      } else {
        setError("找不到該訂單，請確認追蹤碼是否正確！");
      }
    } catch (err) {
      console.error(err);
      setError("查詢失敗，請檢查網路連線");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center animate-in fade-in max-w-3xl mx-auto w-full pt-10">
      <div className="glass-panel p-8 w-full mb-8 text-center bg-white/50">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">進度查詢</h2>
        <p className="text-slate-500 mb-6 text-sm">請輸入您的臨時追蹤碼或正式訂單編號</p>
        
        <form onSubmit={handleSearch} className="flex gap-4 max-w-md mx-auto">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="請輸入追蹤碼..."
            className="glass-input flex-1 font-mono tracking-wide"
          />
          <button type="submit" disabled={isLoading} className="btn-submit !w-auto !rounded-[50px] px-8 flex items-center justify-center">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>
        {error && <p className="text-red-500 mt-4 text-sm font-bold">{error}</p>}
      </div>

      {commission && (
        <div className="glass-panel p-8 w-full animate-in slide-in-from-bottom-8">
          <div className="border-b border-slate-200/50 pb-6 mb-8 flex justify-between items-end">
            <div>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">訂單資訊</p>
              <h3 className="text-2xl font-bold text-slate-800">{commission.title}</h3>
              <p className="text-slate-500 mt-1">{commission.nickname} 委託的 {commission.type}</p>
            </div>
            <div className="text-right">
              <span className="inline-block bg-white/60 px-4 py-1.5 rounded-full font-mono font-bold text-sm text-slate-600 shadow-sm border border-white/50">
                {commission.trackingId || commission.id}
              </span>
            </div>
          </div>

          <div className="relative">
            {/* Timeline Progress */}
            <div className="flex flex-col sm:flex-row justify-between relative z-10 gap-6 sm:gap-0">
              {/* Desktop background line */}
              <div className="hidden sm:block absolute top-[28px] left-[5%] right-[5%] h-1 bg-[#e0e0e0] -z-10 rounded-full">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${(Math.max(PROGRESS_NODES.findIndex(n => n.id === commission.status), 0) / (PROGRESS_NODES.length - 1)) * 100}%` }} 
                />
              </div>
              
              {PROGRESS_NODES.map((node, i) => {
                const currentIdx = PROGRESS_NODES.findIndex(n => n.id === commission.status);
                const isPast = i <= currentIdx;
                const isCurrent = i === currentIdx;
                
                const Icon = node.icon;

                return (
                  <div key={node.id} className="flex sm:flex-col items-center gap-4 sm:gap-3 flex-1 relative">
                    {/* Mobile connecting line */}
                    {i !== PROGRESS_NODES.length - 1 && (
                      <div className="sm:hidden absolute left-[28px] top-[40px] bottom-[-30px] w-0.5 bg-slate-200/50" />
                    )}
                    
                    <div className={cn(
                      "step-circle w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all duration-500 z-10 shadow-sm shrink-0 font-bold",
                      isCurrent ? "bg-white border-blue-500 text-blue-500 shadow-[0_0_15px_rgba(129,212,250,0.4)] scale-110" : 
                      isPast ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-[#e0e0e0] text-slate-400"
                    )}>
                      {isPast && !isCurrent ? <Check className="w-6 h-6" /> : <Icon className={cn("w-6 h-6", isCurrent && "animate-pulse")} />}
                    </div>
                    
                    <div className="sm:text-center mt-2">
                      <p className={cn("font-bold text-sm", isCurrent ? "text-blue-500" : isPast ? "text-slate-800" : "text-slate-400")}>
                        {node.label}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {commission.updatedAt?.seconds && (
            <div className="mt-12 text-center text-xs text-slate-400">
              最後更新時間: {new Date(commission.updatedAt.seconds * 1000).toLocaleString('zh-TW')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
