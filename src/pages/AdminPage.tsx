import { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, User } from "firebase/auth";
import { collection, query, orderBy, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { LogIn, LogOut, Settings2, Image as ImageIcon, Check, Loader2, Maximize2, X, Lock } from "lucide-react";
import { cn } from "../lib/utils";

const STATUS_OPTS = [
  { id: "1", label: "已填單" }, { id: "2", label: "排單中" }, { id: "3", label: "草稿" },
  { id: "4", label: "線稿" }, { id: "5", label: "色稿" }, { id: "6", label: "成圖" }, { id: "7", label: "已交付" }
];

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState("");

  const [commissions, setCommissions] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(true);
  
  const [fullImage, setFullImage] = useState<string | null>(null);

  useEffect(() => {
    // 檢查 localStorage 是否已經解鎖過密碼
    const isLocalUnlocked = localStorage.getItem("mutsuki_admin_locked") === "unlocked";
    
    // 如果本地已經輸入對過密碼，且有登入 Google (必須)，則放行
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "admins", u.uid));
          if (snap.exists() && isLocalUnlocked) {
            setIsAdmin(true);
            await loadDashboard();
          } else {
            setIsAdmin(false);
          }
        } catch (e) {
          setIsAdmin(false);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const loadDashboard = async () => {
    try {
      const gSnap = await getDoc(doc(db, "settings", "global"));
      if (gSnap.exists()) setIsAccepting(gSnap.data().isAccepting);

      const q = query(collection(db, "commissions"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCommissions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleAccepting = async () => {
    try {
      await setDoc(doc(db, "settings", "global"), { isAccepting: !isAccepting }, { merge: true });
      setIsAccepting(!isAccepting);
    } catch (e) {
      alert("更新接單狀態失敗" + e);
    }
  };

  const handleUpdateCommission = async (id: string, newStatus: string, newTrackingId: string) => {
    try {
      const updateData: any = { status: newStatus };
      if (newTrackingId) {
        updateData.trackingId = newTrackingId;
        // CREATE ALIAS using empty structure matching rules
        await setDoc(doc(db, "tracking_aliases", newTrackingId), {
          commissionId: id
        });
      }
      
      await updateDoc(doc(db, "commissions", id), updateData);
      alert("儲存成功！");
      await loadDashboard(); // refresh
    } catch (e) {
      alert("儲存失敗: " + e);
    }
  };

  const loginWithGoogle = () => {
    signInWithPopup(auth, new GoogleAuthProvider()).catch(console.error);
  };
  
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "Mutsuki2024" && user) {
        // 先存入 localStorage 下回就可以不用一直輸入
        localStorage.setItem("mutsuki_admin_locked", "unlocked");
        setLoginError("");
        try {
          const snap = await getDoc(doc(db, "admins", user.uid));
          if(snap.exists()) {
             setIsAdmin(true);
             await loadDashboard();
          } else {
             setLoginError("此 Google 帳號無權限");
          }
        } catch(e) {
          setLoginError("查無權限");
        }
    } else {
        setLoginError("金鑰錯誤，請重新輸入");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mutsuki_admin_locked");
    setIsAdmin(false);
    signOut(auth);
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-pink-500" /></div>;

  if (!user || user.isAnonymous || !isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center animate-in zoom-in-95 mt-[-50px]">
        <div className="glass-panel p-10 text-center max-w-sm w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 to-blue-300"></div>
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-slate-50">
             <Lock className="w-6 h-6 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">管理員後台解鎖</h2>
          
          {(!user || user.isAnonymous) ? (
            <>
              <p className="text-sm text-slate-500 mb-8">請先使用管理員的 Google 帳號登入</p>
              <button onClick={loginWithGoogle} className="btn-submit py-4 px-6 flex items-center justify-center gap-2">
                <LogIn className="w-5 h-5" /> Google 登入
              </button>
            </>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 mt-6">
              <p className="text-sm text-slate-500 mb-2 font-bold">已登入：{user.displayName} <br/><span className="text-xs font-normal opacity-80 cursor-pointer text-slate-400 hover:text-slate-600" onClick={() => signOut(auth)}>不是您？重新登入</span></p>
              <input 
                type="password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="請輸入系統金鑰" 
                className={cn("glass-input text-center tracking-widest", loginError && "border-red-400 focus:ring-red-400")}
              />
              {loginError && <p className="text-xs text-red-500 font-bold">{loginError}</p>}
              <button type="submit" className="btn-submit py-3 mt-2">
                解鎖控制台
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in max-w-5xl mx-auto flex flex-col gap-8 pb-10">
      
      {/* Dashboard Header */}
      <div className="glass-panel p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 bg-white/60">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">管理中心</h2>
          <p className="text-sm text-slate-500 mt-1">Hello, {user.displayName}</p>
        </div>
        
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-3 cursor-pointer select-none bg-white/50 px-4 py-2 rounded-xl shadow-inner border border-white/50">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only" 
                checked={isAccepting} 
                onChange={handleToggleAccepting} 
              />
              <div className={cn("block w-14 h-8 rounded-full transition-colors", isAccepting ? "bg-green-400" : "bg-slate-300")}></div>
              <div className={cn("absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200", isAccepting ? "translate-x-6" : "")}></div>
            </div>
            <span className="font-bold text-slate-700">{isAccepting ? "正在接單中" : "暫停接單"}</span>
          </label>

          <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-slate-100/50">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {commissions.map(c => (
           <CommissionCard key={c.id} commission={c} onSave={handleUpdateCommission} onShowImage={setFullImage} />
        ))}
        {commissions.length === 0 && (
          <div className="text-center text-slate-500 py-10 glass-panel">目前沒有訂單。</div>
        )}
      </div>

      {/* Full Image Modal */}
      {fullImage && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in" onClick={() => setFullImage(null)}>
          <button className="absolute top-6 right-6 text-white/50 hover:text-white bg-black/50 p-2 rounded-full"><X className="w-8 h-8"/></button>
          <img src={fullImage} alt="Reference" className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

function CommissionCard({commission, onSave, onShowImage}: any) {
  const [status, setStatus] = useState(commission.status);
  const [trackingId, setTrackingId] = useState(commission.trackingId || "");
  const [isSaving, setIsSaving] = useState(false);
  
  const hasChanges = status !== commission.status || trackingId !== (commission.trackingId || "");

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(commission.id, status, trackingId);
    setIsSaving(false);
  };

  return (
    <div className="glass-panel p-6 sm:p-8 flex flex-col md:flex-row gap-8 bg-white/40">
      
      {/* Left: Info */}
      <div className="flex-1 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold tracking-tight text-slate-800">{commission.title}</h3>
          <span className="text-xs font-bold font-mono bg-white/60 px-2 py-1 rounded text-slate-400 border border-white/40">
            {commission.id}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm bg-white/40 p-4 rounded-xl border border-white/50">
          <div><span className="text-slate-400 block mb-1">暱稱</span><span className="font-bold text-slate-700">{commission.nickname}</span></div>
          <div><span className="text-slate-400 block mb-1">聯絡方式</span><span className="font-bold text-slate-700 truncate block">{commission.contact}</span></div>
          <div><span className="text-slate-400 block mb-1">委託類型</span><span className="font-bold text-slate-700">{commission.type}</span></div>
          <div><span className="text-slate-400 block mb-1">時間</span><span className="text-slate-600">{new Date(commission.createdAt?.seconds * 1000).toLocaleDateString()}</span></div>
        </div>

        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">詳細需求</span>
          <p className="mt-2 text-sm text-slate-700 whitespace-pre-wrap bg-white/40 p-4 rounded-xl border border-white/50">{commission.description || "無填寫"}</p>
        </div>
      </div>

      {/* Right: Controls & Reference */}
      <div className="w-full md:w-64 shrink-0 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-white/50 pt-6 md:pt-0 md:pl-6">
        
        {/* Reference Image Thumbnail */}
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">參考圖</span>
          {commission.referenceUrl ? (
            <div 
              className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 cursor-pointer group border border-white/60 shadow-sm"
              onClick={() => onShowImage(commission.referenceUrl)}
            >
              <img src={commission.referenceUrl} loading="lazy" alt="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                <Maximize2 className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md w-6 h-6" />
              </div>
            </div>
          ) : (
            <div className="aspect-video rounded-xl bg-white/40 border border-dashed border-slate-300 flex items-center justify-center flex-col text-slate-400">
              <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
              <span className="text-xs font-medium">無參考圖</span>
            </div>
          )}
        </div>

        {/* Status Form */}
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">進度狀態</label>
            <select 
              value={status} 
              onChange={e => setStatus(e.target.value)}
              className="glass-input w-full p-2 text-sm"
            >
              {STATUS_OPTS.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1 block mb-2">正式訂單編號</label>
            <input 
              type="text" 
              value={trackingId}
              onChange={e => setTrackingId(e.target.value)}
              placeholder="若有正式編號可填寫"
              className="glass-input w-full p-2 text-sm font-mono tracking-wide"
            />
          </div>

          <button 
            disabled={!hasChanges || isSaving}
            onClick={handleSave}
            className="btn-submit w-full py-3 flex items-center justify-center gap-2"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            儲存變更
          </button>
        </div>
      </div>
    </div>
  );
}
