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
} from 'firebase/auth';
import {
  doc,
  getDoc,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';

type UserRole = 'admin' | 'bendahara' | 'parent' | 'guru' | null;

interface AuthContextType {
  currentUser: User | null;
  userRole: UserRole;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
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
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const role = userDoc.data().role as UserRole;
            setUserRole(role);

            // 🔁 Auto-redirect based on role
            if (role === 'admin') navigate('/admin/dashboard');
            else if (role === 'parent') navigate('/parent/dashboard');
          } else {
            console.warn('User document not found');
            setUserRole(null);
          }
        } catch (err) {
          console.error('Error fetching user role:', err);
          setUserRole(null);
        }
      } else {
        setUserRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    // 🔁 jangan redirect di sini — tunggu dari useEffect
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserRole(null);
    navigate('/login');
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const value: AuthContextType = {
    currentUser,
    userRole,
    loading,
    signIn,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
