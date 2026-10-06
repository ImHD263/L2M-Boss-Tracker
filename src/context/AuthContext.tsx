import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';
import { AllowedUser, UserRole, SUPER_ADMIN_EMAIL, AccessRequest } from '../types';

interface AuthContextType {
  user: User | null;
  userRole: UserRole | null;
  isAllowed: boolean;
  loading: boolean;
  allowedUsers: AllowedUser[];
  currentUserRecord: AllowedUser | null;
  accessRequests: AccessRequest[];
  myAccessRequest: AccessRequest | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  addAllowedUser: (email: string, role: UserRole, inGameName?: string) => Promise<void>;
  removeAllowedUser: (targetEmail: string) => Promise<void>;
  updateUserRole: (targetEmail: string, newRole: UserRole) => Promise<void>;
  updateUserInGameName: (targetEmail: string, newInGameName: string) => Promise<void>;
  setMyInGameName: (inGameName: string) => Promise<void>;
  requestAccess: (inGameName: string) => Promise<void>;
  approveAccessRequest: (requestId: string, targetEmail: string, role: UserRole, customInGameName?: string) => Promise<void>;
  rejectAccessRequest: (requestId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAllowed, setIsAllowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>([]);
  const [currentUserRecord, setCurrentUserRecord] = useState<AllowedUser | null>(null);
  const [accessRequests, setAccessRequests] = useState<AccessRequest[]>([]);
  const [myAccessRequest, setMyAccessRequest] = useState<AccessRequest | null>(null);

  // 1. Listen for Firebase Auth state changes & redirect result
  useEffect(() => {
    // Check if user returned from a redirect sign-in
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          setUser(result.user);
        }
      })
      .catch((err) => {
        console.warn('Redirect sign in result error:', err);
      });

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setUserRole(null);
        setIsAllowed(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time listener for allowed_users collection from Firestore (only when authenticated)
  useEffect(() => {
    if (!user) {
      setAllowedUsers([]);
      setUserRole(null);
      setIsAllowed(false);
      setLoading(false);
      return;
    }

    const emailLower = user.email ? user.email.toLowerCase().trim() : '';

    // Fast-track super admin access immediately
    if (emailLower === SUPER_ADMIN_EMAIL) {
      setUserRole('admin');
      setIsAllowed(true);
    }

    const allowedRef = collection(db, 'allowed_users');
    
    const unsubscribe = onSnapshot(
      allowedRef,
      async (snapshot) => {
        const usersList: AllowedUser[] = [];
        let hasSuperAdminInDb = false;

        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as AllowedUser;
          const cleanEmail = (data.email || docSnap.id).toLowerCase().trim();
          if (cleanEmail === SUPER_ADMIN_EMAIL) {
            hasSuperAdminInDb = true;
          }
          usersList.push({
            ...data,
            email: cleanEmail,
            role: data.role || 'member',
            inGameName: data.inGameName || '',
          });
        });

        // Ensure super admin exists in database if missing
        if (!hasSuperAdminInDb) {
          try {
            await setDoc(doc(db, 'allowed_users', SUPER_ADMIN_EMAIL), {
              email: SUPER_ADMIN_EMAIL,
              role: 'admin',
              addedBy: 'System Super Admin',
              addedAt: new Date().toISOString(),
              displayName: 'Super Admin',
              inGameName: 'Super Admin',
            }, { merge: true });
          } catch (e) {
            console.error('Error auto-seeding super admin:', e);
          }
        }

        setAllowedUsers(usersList);

        // Check permission and record for current logged-in user
        const foundUser = usersList.find((u) => u.email.toLowerCase().trim() === emailLower);
        setCurrentUserRecord(foundUser || null);

        if (emailLower === SUPER_ADMIN_EMAIL) {
          setUserRole('admin');
          setIsAllowed(true);
        } else {
          if (foundUser) {
            setUserRole(foundUser.role);
            setIsAllowed(true);
          } else {
            setUserRole(null);
            setIsAllowed(false);
          }
        }

        setLoading(false);
      },
      (error) => {
        console.error('Error listening to allowed_users:', error);
        // Fallback check if user is super admin
        if (emailLower === SUPER_ADMIN_EMAIL) {
          setUserRole('admin');
          setIsAllowed(true);
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Login via Google Popup (with fallback to redirect)
  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.warn('signInWithPopup failed:', err?.code, err?.message);
      
      // If popup is blocked by browser/iframe, attempt redirect flow
      if (
        err?.code === 'auth/popup-blocked' ||
        err?.code === 'auth/cancelled-popup-request' ||
        err?.message?.includes('popup-blocked')
      ) {
        try {
          console.log('Falling back to signInWithRedirect...');
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          console.error('Redirect login error:', redirectErr);
          setLoading(false);
          throw redirectErr;
        }
      }

      setLoading(false);

      if (err?.code === 'auth/popup-closed-by-user') {
        throw new Error('Bạn đã đóng cửa sổ đăng nhập. Vui lòng bấm Đăng Nhập lại.');
      }

      if (err?.message?.includes('INTERNAL ASSERTION FAILED') || err?.message?.includes('closing/hidden')) {
        throw new Error('Kết nối đăng nhập bị gián đoạn. Vui lòng thử bấm Đăng Nhập lại.');
      }

      throw err;
    }
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setUserRole(null);
    setIsAllowed(false);
  };

  // Add new allowed user
  const addAllowedUser = async (email: string, role: UserRole, inGameName?: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const cleanEmail = email.toLowerCase().trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Email không hợp lệ');
    }

    // Role Permission Checks
    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Bạn không có quyền thêm tài khoản mới.');
    }

    if (isLeader && role !== 'member') {
      throw new Error('Leader chỉ có thể cấp quyền Thành Viên (Member).');
    }

    await setDoc(doc(db, 'allowed_users', cleanEmail), {
      email: cleanEmail,
      role,
      inGameName: inGameName ? inGameName.trim() : '',
      addedBy: user.email,
      addedAt: new Date().toISOString(),
    }, { merge: true });
  };

  // Remove allowed user
  const removeAllowedUser = async (targetEmail: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const cleanTarget = targetEmail.toLowerCase().trim();

    if (cleanTarget === SUPER_ADMIN_EMAIL) {
      throw new Error('Không thể xóa tài khoản Super Admin duy nhất.');
    }

    const targetUser = allowedUsers.find((u) => u.email === cleanTarget);
    const targetRole = targetUser?.role || 'member';

    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Bạn không có quyền xóa tài khoản.');
    }

    if (isLeader) {
      if (targetRole === 'admin' || targetRole === 'leader') {
        throw new Error('Leader không thể xóa tài khoản Admin hoặc Leader khác!');
      }
    }

    await deleteDoc(doc(db, 'allowed_users', cleanTarget));
  };

  // Update user role
  const updateUserRole = async (targetEmail: string, newRole: UserRole) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const cleanTarget = targetEmail.toLowerCase().trim();

    if (cleanTarget === SUPER_ADMIN_EMAIL) {
      throw new Error('Không thể đổi quyền của Super Admin.');
    }

    const targetUser = allowedUsers.find((u) => u.email === cleanTarget);
    const targetRole = targetUser?.role || 'member';

    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Bạn không có quyền chỉnh sửa tài khoản.');
    }

    if (isLeader) {
      if (targetRole === 'admin' || targetRole === 'leader') {
        throw new Error('Leader không có quyền thay đổi vai trò của Admin hoặc Leader khác.');
      }
      if (newRole === 'admin' || newRole === 'leader') {
        throw new Error('Leader chỉ có thể quản lý danh sách Thành Viên (Member).');
      }
    }

    await setDoc(
      doc(db, 'allowed_users', cleanTarget),
      {
        role: newRole,
        updatedBy: user.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // Update In-Game Name (IGN) - only Leader and Admin can edit
  const updateUserInGameName = async (targetEmail: string, newInGameName: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const cleanTarget = targetEmail.toLowerCase().trim();

    const targetUser = allowedUsers.find((u) => u.email === cleanTarget);
    const targetRole = targetUser?.role || 'member';

    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Chỉ Leader và Admin mới có quyền chỉnh sửa Tên Nhân Vật.');
    }

    if (isLeader) {
      if (targetRole === 'admin' || targetRole === 'leader') {
        throw new Error('Leader không thể sửa Tên Nhân Vật của Admin hoặc Leader khác.');
      }
    }

    await setDoc(
      doc(db, 'allowed_users', cleanTarget),
      {
        inGameName: newInGameName.trim(),
        updatedBy: user.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // User sets their in-game name on first login (or when not set yet)
  const setMyInGameName = async (inGameName: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const cleanEmail = user.email.toLowerCase().trim();
    const trimmed = inGameName.trim();
    if (!trimmed) {
      throw new Error('Vui lòng nhập Tên Nhân Vật hợp lệ.');
    }

    const myRecord = allowedUsers.find((u) => u.email === cleanEmail);
    // If already set and user is regular member, prevent modification (only leader/admin can edit)
    if (myRecord?.inGameName && userRole === 'member') {
      throw new Error('Tên nhân vật đã được lưu. Chỉ Leader hoặc Admin mới có quyền sửa đổi.');
    }

    await setDoc(
      doc(db, 'allowed_users', cleanEmail),
      {
        inGameName: trimmed,
        updatedBy: user.email,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // 3. Real-time listener for access_requests collection
  useEffect(() => {
    if (!user) {
      setAccessRequests([]);
      setMyAccessRequest(null);
      return;
    }

    const requestsRef = collection(db, 'access_requests');
    const unsubscribe = onSnapshot(
      requestsRef,
      (snapshot) => {
        const reqList: AccessRequest[] = [];
        const userEmailLower = user.email ? user.email.toLowerCase().trim() : '';

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const reqItem: AccessRequest = {
            id: docSnap.id,
            email: (data.email || docSnap.id).toLowerCase().trim(),
            displayName: data.displayName || data.email,
            photoURL: data.photoURL,
            inGameName: data.inGameName || '',
            requestedAt: data.requestedAt || new Date().toISOString(),
            status: data.status || 'pending',
            reviewedBy: data.reviewedBy,
            reviewedAt: data.reviewedAt,
          };
          reqList.push(reqItem);
        });

        // Sort latest request first
        reqList.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
        setAccessRequests(reqList);

        const mine = reqList.find((r) => r.email === userEmailLower);
        setMyAccessRequest(mine || null);
      },
      (err) => {
        console.warn('Error listening to access_requests:', err);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Request Access when newly logged in (requires inGameName)
  const requestAccess = async (inGameName: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const cleanEmail = user.email.toLowerCase().trim();
    const trimmedIgn = inGameName.trim();
    if (!trimmedIgn) {
      throw new Error('Vui lòng nhập Tên Nhân Vật trong game trước khi gửi yêu cầu.');
    }

    const docRef = doc(db, 'access_requests', cleanEmail);
    await setDoc(
      docRef,
      {
        id: cleanEmail,
        email: cleanEmail,
        inGameName: trimmedIgn,
        displayName: user.displayName || cleanEmail.split('@')[0],
        photoURL: user.photoURL || '',
        requestedAt: new Date().toISOString(),
        status: 'pending',
      },
      { merge: true }
    );
  };

  // Approve access request (Leader or Admin can approve)
  const approveAccessRequest = async (requestId: string, targetEmail: string, role: UserRole, customInGameName?: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const cleanTarget = targetEmail.toLowerCase().trim();

    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Bạn không có quyền duyệt yêu cầu.');
    }

    if (isLeader && role !== 'member') {
      throw new Error('Leader chỉ có thể cấp quyền Thành Viên (Member).');
    }

    // Add to allowed_users collection
    const targetUserInReq = accessRequests.find((r) => r.id === requestId || r.email === cleanTarget);
    const finalInGameName = (customInGameName !== undefined && customInGameName.trim() !== '') 
      ? customInGameName.trim() 
      : (targetUserInReq?.inGameName || '');

    await setDoc(doc(db, 'allowed_users', cleanTarget), {
      email: cleanTarget,
      role: role,
      inGameName: finalInGameName,
      addedBy: user.email,
      addedAt: new Date().toISOString(),
      displayName: targetUserInReq?.displayName || cleanTarget.split('@')[0],
      photoURL: targetUserInReq?.photoURL || '',
    }, { merge: true });

    // Update access request status
    await setDoc(
      doc(db, 'access_requests', requestId),
      {
        status: 'approved',
        inGameName: finalInGameName,
        reviewedBy: user.email,
        reviewedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  // Reject access request
  const rejectAccessRequest = async (requestId: string) => {
    if (!user || !user.email) throw new Error('Chưa đăng nhập');
    const myEmail = user.email.toLowerCase().trim();
    const isSuperAdmin = myEmail === SUPER_ADMIN_EMAIL || userRole === 'admin';
    const isLeader = userRole === 'leader';

    if (!isSuperAdmin && !isLeader) {
      throw new Error('Bạn không có quyền từ chối yêu cầu.');
    }

    await setDoc(
      doc(db, 'access_requests', requestId),
      {
        status: 'rejected',
        reviewedBy: user.email,
        reviewedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        isAllowed,
        loading,
        allowedUsers,
        currentUserRecord,
        accessRequests,
        myAccessRequest,
        signInWithGoogle,
        logout,
        addAllowedUser,
        removeAllowedUser,
        updateUserRole,
        updateUserInGameName,
        setMyInGameName,
        requestAccess,
        approveAccessRequest,
        rejectAccessRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
