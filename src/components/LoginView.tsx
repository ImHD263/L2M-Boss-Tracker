import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Language, SUPER_ADMIN_EMAIL } from '../types';
import { ShieldAlert, LogOut, ShieldCheck, Lock, Sparkles, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  language: Language;
}

export const LoginView: React.FC<LoginViewProps> = ({ language }) => {
  const { user, isAllowed, signInWithGoogle, logout, loading, requestAccess, myAccessRequest } = useAuth();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);
  const [inGameNameInput, setInGameNameInput] = useState('');

  const handleLogin = async () => {
    try {
      setErrorMsg(null);
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMsg(err.message || 'Đăng nhập Google không thành công. Vui lòng thử lại.');
    }
  };

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIgn = inGameNameInput.trim();
    if (!cleanIgn) {
      setErrorMsg(language === 'vi' ? 'Vui lòng nhập Tên Nhân Vật (In-Game Name) của bạn.' : 'Please enter your In-Game Name.');
      return;
    }

    try {
      setIsRequesting(true);
      setErrorMsg(null);
      await requestAccess(cleanIgn);
      setRequestSuccess(true);
    } catch (err: any) {
      setErrorMsg(err.message || 'Không thể gửi yêu cầu cấp quyền. Vui lòng thử lại.');
    } finally {
      setIsRequesting(false);
    }
  };

  // Case 1: Logged in but NOT ALLOWED
  if (user && !isAllowed) {
    const isPending = myAccessRequest?.status === 'pending' || requestSuccess;
    const isRejected = myAccessRequest?.status === 'rejected';
    const displayIgn = myAccessRequest?.inGameName || inGameNameInput;

    return (
      <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md text-center space-y-5 animate-in zoom-in-95 duration-200">
          
          <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-extrabold text-white">
              {language === 'vi' ? 'Đăng Ký Quyền Xem Lịch Boss' : 'Access Authorization Required'}
            </h1>
            <p className="text-xs text-slate-300">
              {language === 'vi'
                ? 'Nhập Tên Nhân Vật (In-Game Name) để Leader hoặc Admin phê duyệt tài khoản của bạn.'
                : 'Enter your In-Game Name for Leader or Admin approval.'}
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-700/80 text-left flex items-center space-x-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-600" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-indigo-600 font-bold text-white flex items-center justify-center text-sm">
                {user.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-white truncate">{user.displayName || 'Google User'}</div>
              <div className="text-[11px] font-mono text-slate-400 truncate">{user.email}</div>
            </div>
            {isPending ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                Đang Chờ Duyệt
              </span>
            ) : isRejected ? (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Bị Từ Chối
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Chưa Gửi
              </span>
            )}
          </div>

          {/* Status Alert or Form */}
          {isPending ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-left space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{language === 'vi' ? 'Đã gửi yêu cầu đến Leader / Admin!' : 'Request submitted to Leaders/Admins!'}</span>
              </div>
              
              {displayIgn && (
                <div className="p-2.5 rounded-xl bg-slate-900/60 border border-emerald-500/20 text-xs">
                  <span className="text-slate-400 text-[11px] block">{language === 'vi' ? 'Tên nhân vật (In-Game Name):' : 'In-Game Name:'}</span>
                  <span className="font-black text-amber-400 text-sm font-mono">{displayIgn}</span>
                </div>
              )}

              <p className="text-[11px] text-emerald-300/90 leading-relaxed">
                {language === 'vi'
                  ? 'Tài khoản Google & Tên Nhân Vật của bạn đã được ghi nhận. Leader hoặc Admin có thể duyệt ngay lập tức. Sau khi duyệt, màn hình Lịch Boss sẽ tự động mở mà không cần đăng nhập lại!'
                  : 'Your Google Account & In-Game Name are registered. Once approved by a Leader or Admin, you will enter automatically!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSendRequest} className="space-y-3.5 text-left">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center justify-between">
                  <span>{language === 'vi' ? 'Tên Nhân Vật (In-Game Name - IGN) (*):' : 'In-Game Name (IGN) (*):'}</span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    {language === 'vi' ? 'Nhập 1 lần duy nhất' : 'Enter once'}
                  </span>
                </label>
                <input
                  type="text"
                  value={inGameNameInput}
                  onChange={(e) => setInGameNameInput(e.target.value)}
                  placeholder={language === 'vi' ? 'Ví dụ: KiếmThánh, SátThủ99...' : 'e.g. ShadowBlade, Hunter99...'}
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-600 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                  {language === 'vi'
                    ? '⚠️ Tên này sẽ lưu cùng tài khoản Google của bạn. Chỉ Leader và Admin mới có quyền sửa đổi sau này.'
                    : '⚠️ This name will be linked to your Google account. Only Leaders and Admins can edit it later.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isRequesting || !inGameNameInput.trim()}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Sparkles className={`w-4 h-4 text-indigo-200 ${isRequesting ? 'animate-spin' : ''}`} />
                <span>
                  {isRequesting
                    ? (language === 'vi' ? 'Đang gửi đăng ký...' : 'Submitting...')
                    : (language === 'vi' ? 'Lưu & Gửi Yêu Cầu Duyệt (Submit Request)' : 'Submit Access Request')}
                </span>
              </button>
            </form>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
              {errorMsg}
            </div>
          )}

          {/* Admin instructions */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-700/60 text-xs text-slate-300 text-left space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-slate-200 text-[11px]">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === 'vi' ? 'Leader & Admin quản trị:' : 'Admin contact:'}</span>
            </div>
            <div className="font-mono text-indigo-400 text-[11px]">
              {SUPER_ADMIN_EMAIL}
            </div>
          </div>

          <button
            onClick={() => logout()}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-2 border border-slate-700/70 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'vi' ? 'Đăng Xuất & Đổi Tài Khoản Khác' : 'Logout & Switch Account'}</span>
          </button>

        </div>
      </div>
    );
  }

  // Case 2: Not logged in
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative z-10 text-center space-y-6">
        
        {/* App Logo */}
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Boss Timer Tracker
          </h1>
          <p className="text-xs text-slate-400">
            {language === 'vi'
              ? 'Hệ thống quản lý & đếm ngược lịch Boss tự động'
              : 'Automated Boss Schedule & Respawn Tracker'}
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-left space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Đồng bộ dữ liệu thời gian thực từ Google Sheet</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Bảo mật phân quyền Admin, Leader & Thành viên</span>
          </div>
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Âm thanh cảnh báo khi Boss sắp hồi chiêu</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-left">
            {errorMsg}
          </div>
        )}

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full py-3.5 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-2xl text-xs font-extrabold transition-all shadow-lg shadow-white/10 flex items-center justify-center space-x-3 group disabled:opacity-50"
        >
          {/* Google Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span className="group-hover:scale-105 transition-transform">
            {loading ? 'Đang Đăng Nhập...' : 'Đăng Nhập Bằng Tài Khoản Google'}
          </span>
        </button>

        <p className="text-[10px] text-slate-500">
          Chỉ các tài khoản được Admin cấp phép mới có thể truy cập thông tin Lịch Boss.
        </p>

      </div>
    </div>
  );
};
