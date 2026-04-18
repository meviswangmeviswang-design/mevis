import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import imageCompression from "browser-image-compression";
import { ensureAnonymousSession, db, storage } from "../lib/firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { generateTempTrackingCode, cn } from "../lib/utils";
import { Copy, CheckCircle2, Image as ImageIcon, Loader2 } from "lucide-react";

const formSchema = z.object({
  nickname: z.string().min(1, "請填寫暱稱"),
  contact: z.string().min(1, "請填寫聯絡方式"),
  title: z.string().min(1, "請填寫委託標題"),
  type: z.string().min(1, "請選擇委託內容"),
  description: z.string().max(5000, "描述過長"),
});
type FormValues = z.infer<typeof formSchema>;

export default function FormPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isAccepting, setIsAccepting] = useState<boolean>(true);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [tosAgreed, setTosAgreed] = useState(false);
  
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { description: "" }
  });

  useEffect(() => {
    async function checkStatus() {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) {
          setIsAccepting(snap.data().isAccepting);
        } else {
          // Default to true if not set
          setIsAccepting(true);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setCheckingStatus(false);
      }
    }
    checkStatus();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    try {
      const options = {
        maxSizeMB: 0.5, // 500KB
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.8
      };
      const compressedBlob = await imageCompression(file, options);
      const convertedFile = new File([compressedBlob], file.name.split('.')[0] + '.webp', {
        type: 'image/webp'
      });
      setCompressedFile(convertedFile);
      setPreviewUrl(URL.createObjectURL(convertedFile));
    } catch (error) {
      console.error("Compression err:", error);
      alert("圖片壓縮失敗，請重試");
    } finally {
      setIsCompressing(false);
    }
  };

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      await ensureAnonymousSession();
      
      const tmpCode = generateTempTrackingCode();
      let referenceUrl = "";

      if (compressedFile) {
        const storageRef = ref(storage, `references/${tmpCode}/${compressedFile.name}`);
        await uploadBytes(storageRef, compressedFile);
        referenceUrl = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, "commissions", tmpCode), {
        ...data,
        referenceUrl,
        status: "1",
        trackingId: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      setTrackingCode(tmpCode);
      setStep(3);
    } catch (error) {
      console.error(error);
      alert("提交失敗，請確認網路狀態後重試！");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkingStatus) {
    return <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-pink-400" /></div>;
  }

  if (!isAccepting) {
    return (
      <div className="flex-1 flex items-center justify-center animate-in fade-in">
        <div className="glass-panel p-10 text-center max-w-md w-full">
          <h2 className="text-2xl font-bold text-slate-800 mb-4">目前暫停接單中</h2>
          <p className="text-slate-500">很抱歉，因為畫師目前檔期較滿，暫時關閉委託表單。請留意社群的後續公告！</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center animate-in fade-in max-w-2xl mx-auto w-full">
      {step === 1 && (
        <div className="glass-panel p-8 w-full mt-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">委託注意事項 (TOS)</h2>
          <div className="tos-box mb-6 text-slate-700">
            <h3 className="font-bold mb-2">1. 委託流程</h3>
            <p className="mb-4">填寫表單後會進行排單，確認草稿無誤後再進行匯款。開始作畫後不接受大幅度修改。</p>
            <h3 className="font-bold mb-2">2. 授權與使用範圍</h3>
            <p className="mb-4">非買斷制，成品僅供個人收藏、頭貼、非商業性質使用。若需商用請於「需求描述」內事先提出，將另行報價。</p>
            <h3 className="font-bold mb-2">3. 其他事項</h3>
            <p>完稿後皆會加上浮水印公開至作品集，若不希望公開請提前備註。</p>
          </div>
          
          <label className="flex items-center gap-3 cursor-pointer p-2 mb-6 select-none">
            <input 
              type="checkbox" 
              checked={tosAgreed}
              onChange={(e) => setTosAgreed(e.target.checked)}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500 border-slate-300"
            />
            <span className="font-semibold text-slate-700">我已詳細閱讀並同意上述須知</span>
          </label>

          <button 
            disabled={!tosAgreed}
            onClick={() => setStep(2)}
            className="btn-submit py-4 text-lg"
          >
            進入填單
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="glass-panel p-8 w-full mt-4 animate-in slide-in-from-right-4">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">委託填單</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">暱稱 *</label>
                <input {...register("nickname")} className={cn("glass-input w-full", errors.nickname && "border-red-400 ring-2 ring-red-200")} placeholder="您的稱呼" />
                {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">聯絡方式 *</label>
                <input {...register("contact")} className={cn("glass-input w-full", errors.contact && "border-red-400")} placeholder="Discord / Email 等" />
                {errors.contact && <p className="text-red-500 text-xs mt-1">{errors.contact.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">委託標題 *</label>
              <input {...register("title")} className={cn("glass-input w-full", errors.title && "border-red-400")} placeholder="例如：雙人半身立繪" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">委託內容 *</label>
              <select {...register("type")} className={cn("glass-input w-full appearance-none", errors.type && "border-red-400")}>
                <option value="">請選擇...</option>
                <option value="頭像">頭像 (Icon)</option>
                <option value="半身">半身 (Half body)</option>
                <option value="立繪">立繪 (Full body)</option>
                <option value="服裝設計">服裝設計 (Design)</option>
                <option value="驚喜包">驚喜包</option>
              </select>
              {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">詳細需求描述</label>
              <textarea {...register("description")} rows={4} className="glass-input w-full resize-none" placeholder="設定細節、希望的氛圍、動作等..." />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">參考圖 (選填)</label>
              <div className="flex items-center gap-4">
                <label className="glass-btn flex-1 flex flex-col items-center justify-center py-6 cursor-pointer border-dashed border-2 hover:bg-white/20 transition-colors">
                  <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
                  <span className="text-sm text-slate-500 font-medium">點擊上傳圖片</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </label>
                {isCompressing ? (
                  <div className="w-24 h-24 rounded-2xl glass-panel flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-pink-400" />
                  </div>
                ) : previewUrl ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden glass-panel shrink-0 border border-white/60 p-1">
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-xl" />
                  </div>
                ) : null}
              </div>
              <p className="text-xs text-slate-400 mt-2">上傳後將自動壓縮，最大支援 500KB</p>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setStep(1)} className="glass-btn py-4 flex-1">上一步</button>
              <button type="submit" disabled={isSubmitting} className="btn-submit py-4 flex-[2]">
                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "確認送出"}
              </button>
            </div>
          </form>
        </div>
      )}

      {step === 3 && (
        <div className="glass-panel p-10 w-full mt-12 text-center animate-in zoom-in-95 font-sans">
          <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-green-200">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-4">提交成功！</h2>
          <p className="text-slate-600 mb-8">已收到您的訂單，確認排單後會給您一組正式的訂單編號。</p>
          
          <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-inner max-w-sm mx-auto">
            <p className="text-sm font-bold text-slate-500 mb-2 uppercase tracking-widest">臨時追蹤碼</p>
            <div className="flex items-center justify-between gap-4 bg-white/80 p-4 rounded-xl border border-slate-100">
              <span className="font-mono font-bold text-xl text-slate-800 select-all tracking-wider">{trackingCode}</span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(trackingCode);
                  alert("已複製！");
                }}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-700"
              >
                <Copy className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-6">您可以隨時在「進度查詢」頁面輸入此代碼查看狀態。</p>
        </div>
      )}
    </div>
  );
}
