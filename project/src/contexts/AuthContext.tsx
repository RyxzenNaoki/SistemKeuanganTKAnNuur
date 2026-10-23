import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { ROLE_HOME, UserRole, AccountStatus, isUserRole, toAccountStatus, isPublicPath } from '../config/roles';

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole | null;
  userStatus: AccountStatus;
  // true = sudah login dengan Google tetapi belum melengkapi pendaftaran (belum punya profil)
  needsOnboarding: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [userStatus, setUserStatus] = useState<AccountStatus>('active');
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const rawRole = userDoc.data().role;
            // Role di luar admin/guru/parent (mis. data lama "bendahara") dianggap tidak valid
            const role: UserRole | null = isUserRole(rawRole) ? rawRole : null;
            setUserRole(role);
            setUserStatus(toAccountStatus(userDoc.data().status));
            setNeedsOnboarding(false);

            // 🔁 Auto-redirect ke halaman sesuai role
            if (role && !isPublicPath(location.pathname) && !location.pathname.startsWith(ROLE_HOME[role])) {
              navigate(ROLE_HOME[role]);
            }
          } else {
            console.warn('User document not found');
            setUserRole(null);
            // Pengguna Google yang baru pertama masuk belum punya profil -> arahkan melengkapi pendaftaran.
            // (Pendaftar email/password tidak dialihkan: mereka membuat profilnya sendiri saat mendaftar.)
            const isGoogleUser = user.providerData.some(p => p.providerId === 'google.com');
            setNeedsOnboarding(isGoogleUser);
            if (isGoogleUser && location.pathname !== '/complete-registration') {
              navigate('/complete-registration');
            }
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
        setNeedsOnboarding(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [location.pathname, navigate]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // 🔁 jangan redirect di sini — tunggu dari useEffect
  };

  // Masuk / daftar dengan akun Google (popup). Pengguna baru diarahkan ke
  // halaman "Lengkapi Pendaftaran" oleh listener onAuthStateChanged di atas.
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  // Muat ulang role & status (dipakai layar "menunggu persetujuan")
  const refreshProfile = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      const data = snap.data();
      setUserRole(isUserRole(data.role) ? data.role : null);
      setUserStatus(toAccountStatus(data.status));
      setNeedsOnboarding(false);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserRole(null);
    setUserStatus('active');
    setNeedsOnboarding(false);
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    currentUser,
    userRole,
    userStatus,
    needsOnboarding,
    loading,
    refreshProfile,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
