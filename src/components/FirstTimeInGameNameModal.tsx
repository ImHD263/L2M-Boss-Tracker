import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language } from '../types';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface FirstTimeInGameNameModalProps {
  language: Language;
}

export const FirstTimeInGameNameModal: React.FC<FirstTimeInGameNameModalProps> = ({ language }) => {
  const { user, currentUserRecord, setMyInGameName, logout } = useAuth();
  const [ign, setIgn] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // If user has inGameName already, do not show modal
  if (!user || (currentUserRecord && currentUserRecord.inGameName && currentUserRecord.inGameName.trim() !== '')) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIgn = ign.trim();
    if (!cleanIgn) {
      setErrorMsg(language === 'vi' ? 'Vui lòng nhập Tên Nhân Vật trong game của bạn.' : 'Please enter your In-Game Name.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);
      await setMyInGameName(cleanIgn);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể lưu tên nhân vật. Vui lòng thử lại.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 text-center">
        
        {/* Header Icon */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-inner">
          <Shield className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {language === 'vi' ? 'Cập Nhật Tên Nhân Vật (IGN)' : 'Set Your In-Game Name (IGN)'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'vi'
              ? 'Tài khoản của bạn đã được cấp quyền. Vui lòng nhập Tên Nhân Vật trong game để hoàn tất thiết lập.'
              : 'Your account is authorized. Please enter your In-Game Name to complete setup.'}
          </p>
        </div>

        {/* User Account Info */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-left flex items-center space-x-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="Avatar" className="w-9 h-9 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
              {user.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1 text-xs">
            <div className="font-bold text-slate-900 dark:text-white truncate">
              {user.displayName || user.email?.split('@')[0]}
            </div>
            <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
              {user.email}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span>{language === 'vi' ? 'Tên Nhân Vật (In-Game Name) (*):' : 'In-Game Name (*):'}</span>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                {language === 'vi' ? 'Chỉ nhập 1 lần' : 'Set once'}
              </span>
            </label>
            <input
              type="text"
              value={ign}
              onChange={(e) => setIgn(e.target.value)}
              placeholder={language === 'vi' ? 'Ví dụ: KiếmThánh, XạThủ99...' : 'e.g. BladeMaster, Archer99...'}
              required
              autoFocus
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">
              {language === 'vi'
                ? '📌 Tên này sẽ liên kết vĩnh viễn với tài khoản Google của bạn. Sau khi lưu, chỉ Leader và Admin mới có quyền chỉnh sửa.'
                : '📌 This will be permanently tied to your account. Only Leaders & Admins can edit it afterwards.'}
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-1 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || !ign.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Sparkles className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>
                {isSubmitting
                  ? (language === 'vi' ? 'Đang lưu...' : 'Saving...')
                  : (language === 'vi' ? 'Lưu Tên Nhân Vật & Tiếp Tục' : 'Save In-Game Name & Continue')}
              </span>
            </button>

            <button
              type="button"
              onClick={() => logout()}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              {language === 'vi' ? 'Đăng xuất tài khoản khác' : 'Switch account'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
