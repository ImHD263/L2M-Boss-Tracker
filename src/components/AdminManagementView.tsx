import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserRole, SUPER_ADMIN_EMAIL, Language, AccessRequest, AllowedUser } from '../types';
import { 
  Shield, 
  UserCheck, 
  UserPlus, 
  Trash2, 
  Crown, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Lock,
  Clock,
  Check,
  X,
  Bell,
  Sparkles,
  Pencil
} from 'lucide-react';

interface AdminManagementViewProps {
  language: Language;
}

export const AdminManagementView: React.FC<AdminManagementViewProps> = ({ language }) => {
  const { 
    user, 
    userRole, 
    allowedUsers, 
    addAllowedUser, 
    removeAllowedUser, 
    updateUserRole,
    updateUserInGameName,
    accessRequests,
    approveAccessRequest,
    rejectAccessRequest
  } = useAuth();

  const [inputEmail, setInputEmail] = useState('');
  const [inputInGameName, setInputInGameName] = useState('');
  const [inputRole, setInputRole] = useState<UserRole>('member');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestRoles, setRequestRoles] = useState<Record<string, UserRole>>({});
  const [processingReqId, setProcessingReqId] = useState<string | null>(null);

  // Editing In-Game Name state
  const [editingIgnEmail, setEditingIgnEmail] = useState<string | null>(null);
  const [tempIgnValue, setTempIgnValue] = useState<string>('');
  const [isSavingIgn, setIsSavingIgn] = useState(false);

  const isSuperAdmin = user?.email?.toLowerCase().trim() === SUPER_ADMIN_EMAIL || userRole === 'admin';
  const isLeader = userRole === 'leader';

  const pendingRequests = accessRequests.filter(r => r.status === 'pending');

  const handleStartEditIgn = (u: AllowedUser) => {
    setEditingIgnEmail(u.email);
    setTempIgnValue(u.inGameName || '');
  };

  const handleSaveIgn = async (targetEmail: string) => {
    try {
      setIsSavingIgn(true);
      setStatusMsg(null);
      await updateUserInGameName(targetEmail, tempIgnValue.trim());
      setStatusMsg({
        type: 'success',
        text: language === 'vi' 
          ? `Đã cập nhật Tên Nhân Vật cho ${targetEmail} thành "${tempIgnValue.trim() || '(Trống)'}"` 
          : `Updated In-Game Name for ${targetEmail} to "${tempIgnValue.trim() || '(Empty)'}"`,
      });
      setEditingIgnEmail(null);
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Không thể cập nhật Tên Nhân Vật.' : 'Failed to update In-Game Name.'),
      });
    } finally {
      setIsSavingIgn(false);
    }
  };

  const handleApprove = async (req: AccessRequest) => {
    try {
      setProcessingReqId(req.id);
      setStatusMsg(null);
      const roleToAssign = isLeader ? 'member' : (requestRoles[req.id] || 'member');
      await approveAccessRequest(req.id, req.email, roleToAssign, req.inGameName);
      setStatusMsg({
        type: 'success',
        text: language === 'vi' 
          ? `Đã phê duyệt tài khoản ${req.email} (${req.inGameName ? `IGN: ${req.inGameName}` : 'Chưa có IGN'}) với vai trò ${roleToAssign.toUpperCase()}!` 
          : `Approved ${req.email} (${req.inGameName ? `IGN: ${req.inGameName}` : 'No IGN'}) as ${roleToAssign.toUpperCase()}!`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Không thể phê duyệt yêu cầu.' : 'Failed to approve request.'),
      });
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleReject = async (req: AccessRequest) => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc muốn từ chối yêu cầu của ${req.email}?` : `Are you sure to decline request from ${req.email}?`)) {
      return;
    }
    try {
      setProcessingReqId(req.id);
      setStatusMsg(null);
      await rejectAccessRequest(req.id);
      setStatusMsg({
        type: 'success',
        text: language === 'vi' 
          ? `Đã từ chối yêu cầu truy cập của ${req.email}.` 
          : `Declined access request from ${req.email}.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Không thể từ chối yêu cầu.' : 'Failed to decline request.'),
      });
    } finally {
      setProcessingReqId(null);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    const cleanEmail = inputEmail.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setStatusMsg({
        type: 'error',
        text: language === 'vi' ? 'Vui lòng nhập địa chỉ Email hợp lệ.' : 'Please enter a valid email address.',
      });
      return;
    }

    try {
      setIsSubmitting(true);
      await addAllowedUser(cleanEmail, isLeader ? 'member' : inputRole, inputInGameName.trim());
      setStatusMsg({
        type: 'success',
        text: language === 'vi' 
          ? `Đã thêm tài khoản ${cleanEmail} (${inputInGameName.trim() ? `IGN: ${inputInGameName.trim()}` : 'Chưa có IGN'}) thành công!` 
          : `Successfully added ${cleanEmail}!`,
      });
      setInputEmail('');
      setInputInGameName('');
      setInputRole('member');
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Không thể thêm tài khoản.' : 'Failed to add user.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveUser = async (email: string) => {
    if (!window.confirm(language === 'vi' ? `Bạn có chắc muốn xóa quyền của ${email}?` : `Are you sure to remove ${email}?`)) {
      return;
    }

    try {
      setStatusMsg(null);
      await removeAllowedUser(email);
      setStatusMsg({
        type: 'success',
        text: language === 'vi' ? `Đã xóa tài khoản ${email}.` : `Removed ${email}.`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Không thể xóa tài khoản.' : 'Failed to remove user.'),
      });
    }
  };

  const handleRoleChange = async (email: string, newRole: UserRole) => {
    try {
      setStatusMsg(null);
      await updateUserRole(email, newRole);
      setStatusMsg({
        type: 'success',
        text: language === 'vi' ? `Đã cập nhật vai trò cho ${email} thành ${newRole.toUpperCase()}` : `Updated role for ${email} to ${newRole.toUpperCase()}`,
      });
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.message || (language === 'vi' ? 'Lỗi thay đổi vai trò.' : 'Failed to update role.'),
      });
    }
  };

  const filteredUsers = allowedUsers.filter(u => 
    u.email.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase().trim())) ||
    (u.inGameName && u.inGameName.toLowerCase().includes(searchQuery.toLowerCase().trim()))
  );

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-in fade-in duration-300">
      
      {/* Page Title & Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-300 flex items-center justify-center shrink-0 shadow-inner">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span>{language === 'vi' ? 'Quản Lý Quyền Truy Cập Hệ Thống' : 'Access Control & Security'}</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                {isSuperAdmin ? 'Super Admin' : userRole === 'leader' ? 'Leader' : 'Member'}
              </span>
            </h1>
            <p className="text-xs text-slate-300 mt-1">
              {language === 'vi'
                ? 'Đăng nhập Google bảo mật. Chỉ những tài khoản có trong danh sách bên dưới mới được phép truy cập Lịch Boss.'
                : 'Google Login protection. Only authorized email accounts listed below can access the Boss Tracker.'}
            </p>
          </div>
        </div>

        <div className="text-xs bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-slate-700/80 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-bold">{language === 'vi' ? 'Đang đăng nhập:' : 'Logged in as:'}</div>
            <div className="font-semibold text-emerald-300">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Notification Toast Message */}
      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 shadow-md border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button onClick={() => setStatusMsg(null)} className="text-slate-400 hover:text-slate-600 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* PENDING ACCESS REQUESTS SECTION */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              pendingRequests.length > 0 
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 animate-pulse' 
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}>
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'vi' ? 'Yêu Cầu Truy Cập Đang Chờ Duyệt' : 'Pending Access Requests'}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  pendingRequests.length > 0
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {pendingRequests.length}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'vi'
                  ? 'Thành viên mới đăng nhập Google và bấm "Yêu Cầu Cấp Quyền". Bạn có thể duyệt hoặc từ chối tại đây.'
                  : 'New members requesting access via Google Login. Approve or decline below.'}
              </p>
            </div>
          </div>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs flex flex-col items-center justify-center space-y-1">
            <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mb-1" />
            <p className="font-medium text-slate-600 dark:text-slate-300">
              {language === 'vi' ? 'Hiện không có yêu cầu nào đang chờ xử lý' : 'No pending access requests'}
            </p>
            <p className="text-[11px] text-slate-400">
              {language === 'vi'
                ? 'Khi có người đăng nhập và gửi yêu cầu, họ sẽ tự động xuất hiện tại đây ngay lập tức.'
                : 'When new users log in and click Request Access, they will appear here in real-time.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {pendingRequests.map((req) => {
              const assignedRole = requestRoles[req.id] || 'member';
              const isProcessing = processingReqId === req.id;

              return (
                <div key={req.id} className="py-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    {req.photoURL ? (
                      <img src={req.photoURL} alt={req.displayName} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                        {req.email.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-2 truncate">
                        <span>{req.displayName || req.email}</span>
                        {req.inGameName ? (
                          <span className="px-2 py-0.5 rounded-md text-[11px] font-black font-mono bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            IGN: {req.inGameName}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] italic text-slate-400 border border-slate-200 dark:border-slate-700">
                            Chưa nhập IGN
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          Chờ duyệt
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate">
                        {req.email}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(req.requestedAt).toLocaleString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2.5 w-full md:w-auto justify-end">
                    {/* Role Selector */}
                    <div className="text-xs">
                      {isLeader ? (
                        <span className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          Thành Viên (Member)
                        </span>
                      ) : (
                        <select
                          value={assignedRole}
                          onChange={(e) => setRequestRoles(prev => ({ ...prev, [req.id]: e.target.value as UserRole }))}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="member">Thành Viên (Member)</option>
                          <option value="leader">Leader</option>
                          {isSuperAdmin && <option value="admin">Admin</option>}
                        </select>
                      )}
                    </div>

                    {/* Approve Button */}
                    <button
                      onClick={() => handleApprove(req)}
                      disabled={isProcessing}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title={language === 'vi' ? 'Duyệt thành viên vào hệ thống' : 'Approve user'}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Chấp Nhận' : 'Approve'}</span>
                    </button>

                    {/* Reject Button */}
                    <button
                      onClick={() => handleReject(req)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition-all border border-rose-200 dark:border-rose-500/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      title={language === 'vi' ? 'Từ chối yêu cầu này' : 'Decline request'}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>{language === 'vi' ? 'Từ Chối' : 'Decline'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Grid: Form Add User & Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Add User Card */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <UserPlus className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              {language === 'vi' ? 'Thêm Tài Khoản Được Phép' : 'Grant New Access'}
            </h2>
          </div>

          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'vi' ? 'Địa chỉ Gmail (*):' : 'Gmail Address (*):'}
              </label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'vi' ? 'Tên nhân vật (In-Game Name - IGN):' : 'In-Game Name (IGN):'}
              </label>
              <input
                type="text"
                value={inputInGameName}
                onChange={(e) => setInputInGameName(e.target.value)}
                placeholder={language === 'vi' ? 'Ví dụ: KiếmThánh (tùy chọn)' : 'e.g. BladeMaster (optional)'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {language === 'vi' ? 'Vai trò (Role):' : 'Role:'}
              </label>
              
              {isLeader ? (
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-slate-100">Thành Viên (Member)</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    {language === 'vi' ? '(Leader chỉ cấp quyền Member)' : '(Leader grants Member only)'}
                  </span>
                </div>
              ) : (
                <select
                  value={inputRole}
                  onChange={(e) => setInputRole(e.target.value as UserRole)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="member">
                    {language === 'vi' ? 'Thành Viên (Member) - Xem Lịch Boss' : 'Member - Access Tracker'}
                  </option>
                  <option value="leader">
                    {language === 'vi' ? 'Leader - Cấp Quyền Member' : 'Leader - Manage Members'}
                  </option>
                  {isSuperAdmin && (
                    <option value="admin">
                      {language === 'vi' ? 'Admin - Quyền Tối Cao' : 'Admin - Full Control'}
                    </option>
                  )}
                </select>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !inputEmail.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? (language === 'vi' ? 'Đang thêm...' : 'Adding...') : language === 'vi' ? 'Cấp Quyền Truy Cập' : 'Grant Access'}</span>
            </button>
          </form>

          <div className="pt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
            <div className="font-semibold text-slate-700 dark:text-slate-300">
              {language === 'vi' ? 'Phân quyền trong hệ thống:' : 'Role Hierarchy:'}
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px]">
              <li><strong className="text-amber-600 dark:text-amber-400">Super Admin ({SUPER_ADMIN_EMAIL}):</strong> Quyền tối cao, không thể xóa.</li>
              <li><strong className="text-indigo-600 dark:text-indigo-400">Admin:</strong> Thêm/xóa/sửa Member & Leader, cấp quyền toàn bộ.</li>
              <li><strong className="text-emerald-600 dark:text-emerald-400">Leader:</strong> Duyệt & thêm/xóa/sửa Tên nhân vật của Thành viên (Member).</li>
              <li><strong className="text-slate-600 dark:text-slate-300">Member:</strong> Xem thông tin Lịch Boss (không thể sửa Tên nhân vật).</li>
            </ul>
          </div>
        </div>

        {/* User Table List */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>{language === 'vi' ? 'Danh Sách Được Cấp Quyền' : 'Authorized Accounts List'}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono">
                  {allowedUsers.length}
                </span>
              </h2>
            </div>

            {/* Search filter */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'vi' ? 'Tìm email hoặc Tên NV...' : 'Search email or IGN...'}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 min-w-[180px]">{language === 'vi' ? 'Tài khoản' : 'Account'}</th>
                  <th className="py-2.5 px-3 min-w-[160px] text-amber-600 dark:text-amber-400">{language === 'vi' ? 'Tên nhân vật (IGN)' : 'In-Game Name (IGN)'}</th>
                  <th className="py-2.5 px-3">{language === 'vi' ? 'Vai trò' : 'Role'}</th>
                  <th className="py-2.5 px-3">{language === 'vi' ? 'Người cấp' : 'Granted By'}</th>
                  <th className="py-2.5 px-3 text-right">{language === 'vi' ? 'Thao tác' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      {language === 'vi' ? 'Không tìm thấy tài khoản nào.' : 'No accounts found.'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isOwner = u.email === SUPER_ADMIN_EMAIL;
                    const isTargetAdmin = u.role === 'admin';
                    const isTargetLeader = u.role === 'leader';

                    // Leader restrictions: cannot edit/remove Admin or Leader
                    const canCurrentManageTarget = isSuperAdmin
                      ? !isOwner
                      : isLeader
                      ? !isOwner && !isTargetAdmin && !isTargetLeader
                      : false;

                    const canEditTargetIgn = isSuperAdmin
                      ? true
                      : isLeader
                      ? !isTargetAdmin && !isTargetLeader
                      : false;

                    return (
                      <tr key={u.email} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        {/* 1. Account */}
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200 text-xs shrink-0">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
                                <span>{u.email}</span>
                                {isOwner && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[9px] shrink-0">
                                    <Crown className="w-3 h-3" />
                                    <span>OWNER</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* 2. In-Game Name (IGN) */}
                        <td className="py-3 px-3">
                          {editingIgnEmail === u.email ? (
                            <div className="flex items-center space-x-1.5">
                              <input
                                type="text"
                                value={tempIgnValue}
                                onChange={(e) => setTempIgnValue(e.target.value)}
                                placeholder="Tên nhân vật..."
                                autoFocus
                                disabled={isSavingIgn}
                                className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-amber-500 text-xs font-bold text-slate-900 dark:text-white w-32 focus:outline-hidden"
                              />
                              <button
                                onClick={() => handleSaveIgn(u.email)}
                                disabled={isSavingIgn}
                                className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Lưu"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingIgnEmail(null)}
                                disabled={isSavingIgn}
                                className="p-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-600 dark:text-slate-300 rounded-lg transition-colors cursor-pointer"
                                title="Hủy"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-1.5 group">
                              {u.inGameName ? (
                                <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25">
                                  {u.inGameName}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[11px]">
                                  {language === 'vi' ? 'Chưa đặt' : 'Not set'}
                                </span>
                              )}
                              
                              {/* Edit IGN button: only Admin or Leader can edit! */}
                              {canEditTargetIgn && (
                                <button
                                  onClick={() => handleStartEditIgn(u)}
                                  className="p-1 text-slate-400 hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors opacity-70 group-hover:opacity-100 cursor-pointer"
                                  title={language === 'vi' ? 'Sửa Tên Nhân Vật (chỉ Leader & Admin)' : 'Edit In-Game Name'}
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* 3. Role */}
                        <td className="py-3 px-3">
                          {isOwner ? (
                            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-extrabold text-[10px] uppercase">
                              Super Admin
                            </span>
                          ) : isSuperAdmin ? (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u.email, e.target.value as UserRole)}
                              className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200"
                            >
                              <option value="member">Member</option>
                              <option value="leader">Leader</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span
                              className={`px-2.5 py-1 rounded-lg font-bold text-[10px] uppercase border ${
                                u.role === 'admin'
                                  ? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
                                  : u.role === 'leader'
                                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                                  : 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          )}
                        </td>

                        {/* 4. Granted By */}
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 text-[11px]">
                          <div>{u.addedBy || 'System'}</div>
                        </td>

                        {/* 5. Actions */}
                        <td className="py-3 px-3 text-right">
                          {isOwner ? (
                            <span className="text-[10px] text-slate-400 italic flex items-center justify-end gap-1">
                              <Lock className="w-3 h-3 text-amber-500" />
                              <span>Bảo vệ</span>
                            </span>
                          ) : canCurrentManageTarget ? (
                            <button
                              onClick={() => handleRemoveUser(u.email)}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors cursor-pointer"
                              title="Xóa quyền truy cập"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">
                              Khóa
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

    </div>
  );
};
