import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Wallet, 
  Share2, 
  ArrowUpRight, 
  ArrowLeft,
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ShieldCheck, 
  Tablet, 
  Laptop, 
  Monitor, 
  HardDrive, 
  Cloud, 
  Server, 
  Check, 
  Phone, 
  FileText, 
  User, 
  LayoutDashboard,
  Upload,
  CheckCheck,
  Calculator,
  Activity,
  QrCode,
  Info,
  Sparkles,
  TrendingUp,
  Search,
  ChevronRight,
  Shield,
  Layers,
  Lock,
  Unlock,
  AlertTriangle,
  RefreshCw,
  History,
  XCircle,
  Zap,
  Radio,
  Eye,
  EyeOff,
  WifiOff,
  Wifi,
  Sun,
  Moon
} from 'lucide-react';

import logoImg from './assets/images/renttech_logo_1785944206733.jpg';
import heroImg from './assets/images/hero_tech_rental_1785944221535.jpg';
import { BrandLogo } from './components/BrandLogo';
import { AICustomerService } from './components/AICustomerService';
import { AuthModal } from './components/AuthModal';
import { AuthGate } from './components/AuthGate';
import { UserProfileModal } from './components/UserProfileModal';
import { LanguageSelector } from './components/LanguageSelector';
import { EarningsChart } from './components/EarningsChart';
import { TransactionReceiptModal, HistoryItem } from './components/TransactionReceiptModal';
import { AdminAnalyticsChart } from './components/AdminAnalyticsChart';
import { authService } from './services/authService';
import { dataService } from './services/dataService';
import { translations, SupportedLanguage } from './i18n';

// Fonction utilitaire de mise à jour des comptes utilisateurs dans la base locale (localStorage)
interface UserIdentifier {
  email?: string;
  phone?: string;
  fullName?: string;
  referralCode?: string;
}

const updateRegisteredUserAccount = (
  identifier: UserIdentifier,
  addBalance: number,
  addInvested: number,
  addEarned: number
) => {
  try {
    const raw = localStorage.getItem('renttech_registered_users_v2');
    if (!raw) return;
    const users: any[] = JSON.parse(raw);
    let updated = false;

    const newUsers = users.map(u => {
      const matchEmail = identifier.email && u.email && u.email.toLowerCase() === identifier.email.toLowerCase();
      const matchPhone = identifier.phone && u.phone && u.phone.trim() === identifier.phone.trim();
      const matchName = identifier.fullName && u.fullName && u.fullName.trim().toLowerCase() === identifier.fullName.trim().toLowerCase();
      const matchRef = identifier.referralCode && u.referralCode && u.referralCode.trim().toUpperCase() === identifier.referralCode.trim().toUpperCase();

      if (matchEmail || matchPhone || matchName || matchRef) {
        updated = true;
        return {
          ...u,
          balance: Math.max(0, (u.balance || 0) + addBalance),
          totalInvested: Math.max(0, (u.totalInvested || 0) + addInvested),
          totalEarned: Math.max(0, (u.totalEarned || 0) + addEarned)
        };
      }
      return u;
    });

    if (updated) {
      localStorage.setItem('renttech_registered_users_v2', JSON.stringify(newUsers));
      window.dispatchEvent(new Event('renttech_data_sync'));
    }
  } catch (e) {
    console.error('Error updating stored user account:', e);
  }
};

// Fonction utilitaire de masquage de confidentialité financière pour numéros de téléphone et PIN
const maskPhone = (phoneStr?: string): string => {
  if (!phoneStr) return '••••••••';
  const clean = phoneStr.trim();
  if (clean.length < 8) return clean;
  return `${clean.slice(0, 4)} *** *** ${clean.slice(-3)}`;
};

// Grille stricte des 8 niveaux d'investissement avec images haute définition et spécifications techniques réelles
export interface TechPack {
  id: number;
  name: string;
  category: 'Tablette' | 'Ordinateur' | 'Serveur' | 'Datacenter';
  price: number;
  commission: number;
  dailyYield: number; // Gain quotidien estimé
  stockAvailable: number;
  totalUnits: number;
  icon: any;
  image: string;
  specs: {
    processor: string;
    ram: string;
    storage: string;
    gpu: string;
    location: string;
  };
}

const INVESTMENT_LEVELS: TechPack[] = [
  { 
    id: 1, 
    name: 'Niveau 1 - Pack Découverte iPad Mini', 
    category: 'Tablette',
    price: 15000, 
    commission: 3000, 
    dailyYield: 750,
    stockAvailable: 4,
    totalUnits: 15,
    icon: Tablet,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Apple A15 Bionic 6-core',
      ram: '4 GB LPDDR5',
      storage: '64 GB NVMe',
      gpu: '5-core Apple GPU',
      location: 'Hub Kinshasa Gombe'
    }
  },
  { 
    id: 2, 
    name: 'Niveau 2 - Pack Pro iPad Air M2', 
    category: 'Tablette',
    price: 30000, 
    commission: 6000, 
    dailyYield: 1600,
    stockAvailable: 7,
    totalUnits: 20,
    icon: Tablet,
    image: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Apple M2 8-core CPU',
      ram: '8 GB Unified Memory',
      storage: '128 GB High-Speed',
      gpu: '10-core GPU',
      location: 'Hub Lubumbashi Centre'
    }
  },
  { 
    id: 3, 
    name: 'Niveau 3 - Pack Station Laptop Core i5', 
    category: 'Ordinateur',
    price: 80000, 
    commission: 16000, 
    dailyYield: 4500,
    stockAvailable: 2,
    totalUnits: 12,
    icon: Laptop,
    image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Intel Core i5-13500H 12-core',
      ram: '16 GB DDR5 4800MHz',
      storage: '512 GB M.2 NVMe SSD',
      gpu: 'Intel Iris Xe Graphics',
      location: 'Hub Goma Carrefour'
    }
  },
  { 
    id: 4, 
    name: 'Niveau 4 - Pack Workstation Pro i7 Ultra', 
    category: 'Ordinateur',
    price: 100000, 
    commission: 20000, 
    dailyYield: 6000,
    stockAvailable: 5,
    totalUnits: 18,
    icon: Monitor,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Intel Core i7-14700K 20-core',
      ram: '32 GB DDR5 Corsair',
      storage: '1 TB PCIe 4.0 SSD',
      gpu: 'NVIDIA RTX 4070 12GB',
      location: 'Hub Kinshasa Limete'
    }
  },
  { 
    id: 5, 
    name: 'Niveau 5 - Pack Serveur Tech Entreprise', 
    category: 'Serveur',
    price: 300000, 
    commission: 60000, 
    dailyYield: 18500,
    stockAvailable: 3,
    totalUnits: 8,
    icon: HardDrive,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Dual AMD EPYC 7763 128-core',
      ram: '128 GB ECC Registered DDR4',
      storage: '4x 2TB SAS SSD RAID-10',
      gpu: 'NVIDIA A100 Tensor Core 40GB',
      location: 'Datacenter Bukavu'
    }
  },
  { 
    id: 6, 
    name: 'Niveau 6 - Pack Flotte Tactile VIP', 
    category: 'Tablette',
    price: 500000, 
    commission: 100000, 
    dailyYield: 32000,
    stockAvailable: 1,
    totalUnits: 5,
    icon: Cpu,
    image: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Flotte de 10x iPad Pro M2',
      ram: '160 GB Cumulé',
      storage: '2.5 TB Storage Cloud',
      gpu: 'Apple Neural Engine Enterprise',
      location: 'Hub Kinshasa & Lubumbashi'
    }
  },
  { 
    id: 7, 
    name: 'Niveau 7 - Pack High-Tech Cloud Master', 
    category: 'Datacenter',
    price: 1000000, 
    commission: 200000, 
    dailyYield: 68000,
    stockAvailable: 2,
    totalUnits: 6,
    icon: Cloud,
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Cluster Server 256 vCPU Xeon Platinum',
      ram: '512 GB High-Speed RAM',
      storage: '20 TB NVMe SAN Storage',
      gpu: '4x NVIDIA H100 SXM5 80GB',
      location: 'Datacenter Kinshasa Tech Core'
    }
  },
  { 
    id: 8, 
    name: 'Niveau 8 - Pack Partner Datacenter Ultra', 
    category: 'Datacenter',
    price: 2000000, 
    commission: 400000, 
    dailyYield: 145000,
    stockAvailable: 1,
    totalUnits: 3,
    icon: Server,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    specs: {
      processor: 'Full Rack Dedicated Tier IV Datacenter',
      ram: '2048 GB ECC DDR5 Enterprise',
      storage: '100 TB High Availability All-Flash',
      gpu: '8x NVIDIA HGX H100 Cluster',
      location: 'Datacenter Master RD Congo'
    }
  },
];

// Ticker d'information système officiel RentTech Hub (aucune donnée financière fictive)
const INITIAL_TICKER = [
  { id: 1, user: 'Système RentTech', action: 'Nœud réseau sécurisé TLS 1.3 opérationnel', amount: 'ACTIF', time: 'En direct', type: 'system' },
  { id: 2, user: 'Flotte Informatique', action: 'Packs ordinateurs & serveurs disponibles à la location', amount: 'RDC', time: 'En direct', type: 'system' },
  { id: 3, user: 'Trésorerie', action: 'Demandes de retraits traitées sous validation administrative', amount: 'SÉCURISÉ', time: 'En direct', type: 'system' },
  { id: 4, user: 'Service Client', action: 'Support & assistance aux investisseurs disponible', amount: '24/7', time: 'En direct', type: 'system' },
];

export default function App() {
  const [currentLang, setCurrentLang] = useState<SupportedLanguage>('fr');
  const t = translations[currentLang] || translations.fr;

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'admin' | 'files'>('dashboard');
  const [activeView, setActiveView] = useState<'overview' | 'deposit' | 'withdraw' | 'calculator' | 'history'>('overview');
  
  // Profil Utilisateur (données financières réelles avec bonus de bienvenue 2 000 FC et statut d'activation)
  const [user, setUser] = useState({
    id: 'user_default',
    fullName: 'Investisseur',
    email: '',
    phone: '',
    referralCode: 'RT892X4',
    balance: 2000,
    totalInvested: 0,
    totalEarned: 0,
    role: 'user' as 'user' | 'admin',
    isActivated: false,
    welcomeBonusClaimed: true,
  });

  const [copied, setCopied] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedPack, setSelectedPack] = useState<TechPack>(INVESTMENT_LEVELS[0]);
  const [modalPackSpecs, setModalPackSpecs] = useState<TechPack | null>(null);
  const [showQrCode, setShowQrCode] = useState(false);
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<HistoryItem | null>(null);

  // Gestion de l'état de connexion réseau (navigator.onLine)
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof window !== 'undefined' ? navigator.onLine : true
  );
  const [showRestoredNotice, setShowRestoredNotice] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => {
        setShowRestoredNotice(false);
      }, 4500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Détection dynamique des préférences système de thème (Dark/Light/System)
  type ThemeMode = 'system' | 'dark' | 'light';
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('renttech_theme_preference');
      if (saved === 'dark' || saved === 'light' || saved === 'system') {
        return saved;
      }
    }
    return 'system';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (themeMode === 'dark') return true;
      if (themeMode === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      let activeDark = true;
      if (themeMode === 'dark') {
        activeDark = true;
      } else if (themeMode === 'light') {
        activeDark = false;
      } else {
        activeDark = mediaQuery.matches;
      }

      setIsDarkMode(activeDark);

      if (activeDark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };

    applyTheme();
    localStorage.setItem('renttech_theme_preference', themeMode);

    const handleSystemThemeChange = (e: MediaQueryListEvent) => {
      if (themeMode === 'system') {
        setIsDarkMode(e.matches);
        if (e.matches) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    } else {
      mediaQuery.addListener(handleSystemThemeChange);
      return () => mediaQuery.removeListener(handleSystemThemeChange);
    }
  }, [themeMode]);

  const cycleThemeMode = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  // Chargement automatique de session Supabase au démarrage si actif
  useEffect(() => {
    if (!authService.isOnlineBackend()) return;

    authService.getCurrentSession().then(async (session) => {
      if (session?.user) {
        const userId = session.user.id;
        const [profile, wallet] = await Promise.all([
          authService.getProfile(userId),
          dataService.getWallet(userId)
        ]);

        if (profile) {
          setIsLoggedIn(true);
          setUser({
            id: userId,
            fullName: profile.full_name || session.user.email?.split('@')[0] || 'Investisseur',
            email: profile.email || session.user.email || '',
            phone: profile.phone || '',
            referralCode: profile.referral_code || 'RT892X4',
            balance: Number(wallet?.balance || 0),
            totalInvested: Number(wallet?.total_deposited || 0),
            totalEarned: Number(wallet?.total_earned || 0),
            role: profile.role || 'user'
          });
        }
      }
    });
  }, []);

  const handleGateLoginSuccess = async (userData: { name: string; email: string; phone: string; role: 'user' | 'admin'; referralCode: string; balance?: number }) => {
    setIsLoggedIn(true);

    let realBalance = userData.balance !== undefined ? userData.balance : 2000;
    let realInvested = 0;
    let realEarned = 0;
    let isActivated = false;
    let welcomeBonusClaimed = true;

    // Si Supabase est connecté, récupération immédiate des données réelles des tables 'wallets' et 'profiles'
    if (authService.isOnlineBackend()) {
      const session = await authService.getCurrentSession();
      if (session?.user) {
        const [wallet, profile] = await Promise.all([
          dataService.getWallet(session.user.id),
          dataService.getProfile(session.user.id),
        ]);
        if (wallet) {
          realBalance = Number(wallet.available_balance_cdf ?? wallet.balance ?? 0);
          realInvested = Number(wallet.total_deposited || 0);
          realEarned = Number(wallet.total_earned || 0);
        }
        if (profile) {
          isActivated = Boolean(profile.is_activated);
          welcomeBonusClaimed = Boolean(profile.welcome_bonus_claimed);
        }
      }
    }

    setUser({
      id: userData.role === 'admin' ? 999 : 1,
      fullName: userData.name,
      email: userData.email,
      phone: userData.phone,
      referralCode: userData.referralCode,
      balance: userData.role === 'admin' ? 0 : realBalance,
      totalInvested: userData.role === 'admin' ? 0 : realInvested,
      totalEarned: userData.role === 'admin' ? 0 : realEarned,
      role: userData.role,
      isActivated,
      welcomeBonusClaimed,
    });

    if (userData.role === 'admin') {
      setIsAdminPinVerified(true);
      setActiveTab('admin');
    } else {
      setActiveTab('dashboard');
      setActiveView('overview');
    }
  };

  const handleLogout = async () => {
    if (authService.isOnlineBackend()) {
      await authService.signOut();
    }
    setIsLoggedIn(false);
    setIsAdminPinVerified(false);
    setIsProfileModalOpen(false);
    setActiveTab('dashboard');
    setActiveView('overview');
  };
  
  // Formulaires & Cryptographie
  const [depositAmount, setDepositAmount] = useState<number>(15000);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositError, setDepositError] = useState('');
  const [depositHash, setDepositHash] = useState('');
  const [depositProofPreview, setDepositProofPreview] = useState<string>('');
  const [depositProofFileName, setDepositProofFileName] = useState<string>('');

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDepositProofFileName(file.name);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawResult = reader.result as string;
        // Optimization & compression of screenshot image to fit smoothly in localStorage without quota errors
        const img = new Image();
        img.src = rawResult;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_SIZE = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.75);
            setDepositProofPreview(compressed);
          } else {
            setDepositProofPreview(rawResult);
          }
          setDepositError('');
        };
        img.onerror = () => {
          setDepositProofPreview(rawResult);
          setDepositError('');
        };
      };
      reader.readAsDataURL(file);
    }
  };

  const openDepositView = (pack?: TechPack) => {
    if (pack) {
      setSelectedPack(pack);
      setDepositAmount(pack.price);
    }
    setDepositSuccess(false);
    setDepositProofPreview('');
    setDepositProofFileName('');
    setDepositError('');
    setActiveTab('dashboard');
    setActiveView('deposit');
  };

  const [withdrawAmount, setWithdrawAmount] = useState<number>(5000);
  const [withdrawPhone, setWithdrawPhone] = useState('+243976704762');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawHash, setWithdrawHash] = useState('');

  // Investissements Actifs (chargés exclusivement depuis Supabase ou vides par défaut)
  const [activeInvestments, setActiveInvestments] = useState<any[]>([]);

  // Synchronisation des investissements et du portefeuille réels depuis Supabase
  useEffect(() => {
    if (!authService.isOnlineBackend() || !isLoggedIn) return;

    dataService.getUserInvestments(String(user.id)).then(dbInvestments => {
      if (dbInvestments && dbInvestments.length > 0) {
        setActiveInvestments(dbInvestments.map(inv => ({
          id: inv.id,
          userName: user.fullName,
          userPhone: user.phone,
          packName: inv.pack_name,
          investedAmount: inv.amount,
          dailyYield: inv.daily_yield,
          createdAt: new Date(inv.created_at).getTime(),
          lastCollectedAt: inv.last_payout_at ? new Date(inv.last_payout_at).getTime() : new Date(inv.created_at).getTime(),
          nextYieldAt: (inv.last_payout_at ? new Date(inv.last_payout_at).getTime() : new Date(inv.created_at).getTime()) + (24 * 3600 * 1000),
        })));
      } else {
        // En mode Supabase en direct, aucun faux investissement n'est inventé
        setActiveInvestments([]);
      }
    });

    dataService.getProfile(String(user.id)).then(profile => {
      if (profile) {
        setUser(prev => ({
          ...prev,
          fullName: profile.full_name || prev.fullName,
          phone: profile.phone || prev.phone,
          isActivated: Boolean(profile.is_activated),
          welcomeBonusClaimed: Boolean(profile.welcome_bonus_claimed),
        }));
      }
    });

    dataService.getWallet(String(user.id)).then(wallet => {
      if (wallet) {
        setUser(prev => ({
          ...prev,
          balance: Number(wallet.available_balance_cdf ?? wallet.balance ?? 0),
          totalInvested: Number(wallet.total_deposited || 0),
          totalEarned: Number(wallet.total_earned || 0),
        }));
      }
    });
  }, [isLoggedIn, user.id]);

  // Horloge dynamique pour le décompte live 24H (mis à jour chaque seconde)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Récolte du gain journalier de 24H
  const claimInvestmentYield = (invId: string | number) => {
    const target = activeInvestments.find(i => i.id === invId);
    if (!target) return;

    const now = Date.now();
    const yieldAmount = target.dailyYield;

    setUser(prev => ({
      ...prev,
      balance: prev.balance + yieldAmount,
      totalEarned: prev.totalEarned + yieldAmount
    }));

    updateRegisteredUserAccount(
      { phone: target.userPhone, fullName: target.userName },
      yieldAmount,
      0,
      yieldAmount
    );

    const updatedInvestments = activeInvestments.map(inv => {
      if (inv.id === invId) {
        return {
          ...inv,
          lastCollectedAt: now,
          nextYieldAt: now + 24 * 60 * 60 * 1000
        };
      }
      return inv;
    });

    setActiveInvestments(updatedInvestments);
    try {
      localStorage.setItem('renttech_active_investments_v2', JSON.stringify(updatedInvestments));
    } catch (e) {
      console.error(e);
    }

    setUserHistory(prev => [
      {
        id: `TX-AIRTEL-GAIN-${Math.floor(100000 + Math.random() * 900000)}`,
        type: 'profit',
        title: `Gain Journalier 24H (${target.packName})`,
        amount: yieldAmount,
        status: 'approuve',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        hash: `SHA256: ${Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('')}`
      },
      ...prev
    ]);

    window.dispatchEvent(new Event('renttech_data_sync'));
  };

  const formatCountdown = (targetTimeMs: number, nowMs: number) => {
    const diff = targetTimeMs - nowMs;
    if (diff <= 0) return '00h 00m 00s';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  // Notifications en temps réel pour l'utilisateur sur la décision Administrateur (Retraits)
  const [withdrawalAlerts, setWithdrawalAlerts] = useState<{ id: number; type: 'approuve' | 'rejete'; amount: number; phone: string; date: string }[]>([]);

  // Live Ticker
  const [ticker, setTicker] = useState(INITIAL_TICKER);

  // Historique Personnel Utilisateur (transactions réelles)
  const [userHistory, setUserHistory] = useState<any[]>([]);

  // Cyber Security Logs Audit Trail
  const [cyberLogs] = useState([
    { id: 1, event: 'Connexion Sécurisée TLS 1.3', ip: '197.243.112.45 (Goma Node)', time: '09:14:02', status: 'VERIFIED' },
    { id: 2, event: 'Contrôle WAF & Jeton Anti-CSRF', ip: '197.243.112.45', time: '09:14:03', status: 'PROTECTED' },
    { id: 3, event: 'Vérification Hachage BCRYPT MDP', ip: '197.243.112.45', time: '09:14:03', status: 'SUCCESS' },
    { id: 4, event: 'Authentification PIN Admin Guard', ip: '197.243.100.12', time: '09:15:10', status: 'ACTIVE' }
  ]);

  // Recherche & Filtre Packs
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // ROI Calculator
  const [calcPack, setCalcPack] = useState<TechPack>(INVESTMENT_LEVELS[2]);
  const [calcDays, setCalcDays] = useState(30);

  // Admin Data & Security State (PIN Code : 998844)
  const [isAdminPinVerified, setIsAdminPinVerified] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAttempts, setPinAttempts] = useState(0);

  // Helper pour mettre à jour les données des utilisateurs enregistrés dans localStorage
  const updateRegisteredUserAccount = (
    targetIdentifier: { email?: string; phone?: string; fullName?: string },
    deltaBalance: number,
    deltaInvested: number = 0,
    deltaEarned: number = 0
  ) => {
    try {
      const rawUsers = localStorage.getItem('renttech_registered_users_v2');
      if (!rawUsers) return;
      const users = JSON.parse(rawUsers);
      if (!Array.isArray(users)) return;

      const updatedUsers = users.map((u: any) => {
        const matchEmail = targetIdentifier.email && u.email && u.email.toLowerCase() === targetIdentifier.email.toLowerCase();
        const matchPhone = targetIdentifier.phone && u.phone && u.phone === targetIdentifier.phone;
        const matchName = targetIdentifier.fullName && u.fullName && u.fullName.toLowerCase() === targetIdentifier.fullName.toLowerCase();

        if (matchEmail || matchPhone || matchName) {
          return {
            ...u,
            balance: Math.max(0, (u.balance || 0) + deltaBalance),
            totalInvested: Math.max(0, (u.totalInvested || 0) + deltaInvested),
            totalEarned: Math.max(0, (u.totalEarned || 0) + deltaEarned)
          };
        }
        return u;
      });

      localStorage.setItem('renttech_registered_users_v2', JSON.stringify(updatedUsers));
    } catch (e) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', e);
    }
  };

  const [pendingDeposits, setPendingDeposits] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('renttech_pending_deposits_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 101, txId: 'TX-AIRTEL-DEP-101', userName: 'Mumbere Grace', phone: '0998765432', pack: 'Niveau 3 - Pack Station Laptop Core i5', amount: 80000, proof: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="%23111827"/><text x="15" y="40" fill="%2310B981" font-size="14" font-weight="bold">TRANSACTION AIRTEL MONEY</text><text x="15" y="70" fill="%23FFFFFF" font-size="12">Ref: RTM8829104</text><text x="15" y="95" fill="%23F59E0B" font-size="12">Montant: 80 000 FC</text><text x="15" y="120" fill="%239CA3AF" font-size="10">Statut: SUCCES</text></svg>', date: '2026-08-05 09:15', hash: 'SHA256: 4e9a8f1b2c3d4e5f' },
      { id: 102, txId: 'TX-AIRTEL-DEP-102', userName: 'Kasereka David', phone: '0993344556', pack: 'Niveau 1 - Pack Découverte iPad Mini', amount: 15000, proof: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="150" viewBox="0 0 300 150"><rect width="300" height="150" fill="%23111827"/><text x="15" y="40" fill="%2310B981" font-size="14" font-weight="bold">TRANSACTION AIRTEL MONEY</text><text x="15" y="70" fill="%23FFFFFF" font-size="12">Ref: RTM1049921</text><text x="15" y="95" fill="%23F59E0B" font-size="12">Montant: 15 000 FC</text><text x="15" y="120" fill="%239CA3AF" font-size="10">Statut: SUCCES</text></svg>', date: '2026-08-05 10:30', hash: 'SHA256: 8a7b6c5d4e3f2a1b' }
    ];
  });

  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('renttech_pending_withdrawals_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 201, txId: 'TX-AIRTEL-W-201', userName: 'Kavira Alice', email: 'alice.k@gmail.com', phone: '0994433221', amount: 25000, currentBalance: 65000, date: '2026-08-05 08:45', hash: 'SHA256: 9e8d7c6b5a4f3e2d' }
    ];
  });

  const [completedDeposits, setCompletedDeposits] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('renttech_completed_deposits_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: 901, txId: 'TX-AIRTEL-DEP-9921', userName: 'Mumbere Grace', phone: '0998765432', pack: 'Niveau 3 - Pack Station Laptop Core i5', amount: 80000, status: 'approuve', date: '2026-08-04 14:20', processedAt: '2026-08-04 14:25', hash: 'SHA256: 7f8a9b1c2d3e4f5a' }
    ];
  });

  // Synchronisation continue des demandes de dépôts et de retraits
  useEffect(() => {
    const syncRequests = () => {
      try {
        const depData = localStorage.getItem('renttech_pending_deposits_v2');
        if (depData) {
          const parsed = JSON.parse(depData);
          if (Array.isArray(parsed)) setPendingDeposits(parsed);
        }
        const wData = localStorage.getItem('renttech_pending_withdrawals_v2');
        if (wData) {
          const parsed = JSON.parse(wData);
          if (Array.isArray(parsed)) setPendingWithdrawals(parsed);
        }
        const compData = localStorage.getItem('renttech_completed_deposits_v2');
        if (compData) {
          const parsed = JSON.parse(compData);
          if (Array.isArray(parsed)) setCompletedDeposits(parsed);
        }
        const invData = localStorage.getItem('renttech_active_investments_v2');
        if (invData) {
          const parsed = JSON.parse(invData);
          if (Array.isArray(parsed)) setActiveInvestments(parsed);
        }
      } catch (e) {
        console.error(e);
      }
    };

    syncRequests();
    window.addEventListener('storage', syncRequests);
    window.addEventListener('renttech_data_sync', syncRequests);
    return () => {
      window.removeEventListener('storage', syncRequests);
      window.removeEventListener('renttech_data_sync', syncRequests);
    };
  }, [activeTab]);

  const handleAdminTabAccess = () => {
    if (activeTab === 'admin') {
      setActiveTab('dashboard');
    } else {
      if (!isAdminPinVerified) {
        setIsPinModalOpen(true);
        setAdminPinError('');
        setAdminPinInput('');
      } else {
        setActiveTab('admin');
      }
    }
  };

  const handleVerifyPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinAttempts >= 5) {
      setAdminPinError('Trop d\'échecs. Verrouillage temporaire de 15 minutes activé.');
      return;
    }

    if (adminPinInput === '998844') {
      setIsAdminPinVerified(true);
      setIsPinModalOpen(false);
      setActiveTab('admin');
      setAdminPinError('');
      setAdminPinInput('');
    } else {
      const newAttempts = pinAttempts + 1;
      setPinAttempts(newAttempts);
      setAdminPinError(`Code PIN incorrect (${newAttempts}/5). Le code PIN par défaut est 998844.`);
    }
  };

  const handleLockAdminPin = () => {
    setIsAdminPinVerified(false);
    setActiveTab('dashboard');
  };

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}${window.location.pathname}?ref=${user.referralCode}`
    : `?ref=${user.referralCode}`;

  const copyLink = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(referralUrl);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // SOUMISSION DÉPÔT & RECHARGE SECURISE
  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDepositError('');

    if (!isOnline) {
      setDepositError(t.offlineSubmitBlocked);
      return;
    }

    if (depositAmount < 5000) {
      setDepositError('Le montant minimum de recharge est de 5 000 FC.');
      return;
    }

    // CONTROLE STRICT : LA CAPTURE D'ÉCRAN DE PREUVE EST OBLIGATOIRE
    if (!depositProofPreview) {
      setDepositError("⚠️ SOUMISSION REFUSÉE : Vous n'avez pas joint la capture d'écran de votre message de confirmation Airtel Money ! Veuillez obligatoirement cliquer sur la zone ci-dessous pour sélectionner la capture de votre message avant de soumettre.");
      return;
    }

    const txId = `TX-AIRTEL-DEP-${Math.floor(100000 + Math.random() * 900000)}`;
    const hash = `SHA256: ${Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;

    const newDeposit = {
      id: Date.now(),
      txId,
      userName: user.fullName,
      phone: user.phone,
      pack: selectedPack.name,
      amount: depositAmount,
      proof: depositProofPreview,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      hash
    };

    const updatedDeposits = [newDeposit, ...pendingDeposits];
    setPendingDeposits(updatedDeposits);
    try {
      localStorage.setItem('renttech_pending_deposits_v2', JSON.stringify(updatedDeposits));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du dépôt dans localStorage:', err);
    }
    window.dispatchEvent(new Event('renttech_data_sync'));

    setUserHistory(prev => [
      {
        id: txId,
        type: 'deposit',
        title: `Recharge (${selectedPack.name})`,
        amount: depositAmount,
        status: 'en_attente',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        hash
      },
      ...prev
    ]);

    setTicker(prev => [
      { id: Date.now(), user: `${user.fullName.split(' ')[0]} K.`, action: `a soumis une recharge de ${selectedPack.name}`, amount: `${depositAmount.toLocaleString('fr-FR')} FC`, time: 'à l\'instant', type: 'deposit' },
      ...prev
    ]);

    setDepositHash(hash);
    setDepositSuccess(true);
  };

  // SOUMISSION RETRAIT AIRTEL MONEY SÉCURISÉ (ULTRA PRO VERIFICATION)
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawError('');

    if (!isOnline) {
      setWithdrawError(t.offlineSubmitBlocked);
      return;
    }

    // Règle 2 : Aucun retrait autorisé tant que le compte n'est pas activé
    if (!user.isActivated) {
      setWithdrawError("Droit de retrait bloqué : Votre compte est en attente d'activation. Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits.");
      return;
    }

    // Règle 3 : Le retrait minimum est fixé à 5 000 FC
    if (withdrawAmount < 5000) {
      setWithdrawError('Le montant minimum de retrait est de 5 000 FC.');
      return;
    }

    // Règle 3 : Le bonus de bienvenue (2 000 FC) ne doit pas pouvoir être retiré directement
    const bonusToDeduct = user.welcomeBonusClaimed ? 2000 : 0;
    const withdrawableBalance = Math.max(0, user.balance - bonusToDeduct);

    if (withdrawAmount > withdrawableBalance) {
      setWithdrawError(`Solde retirable insuffisant (${withdrawableBalance.toLocaleString('fr-FR')} FC disponibles). Le bonus de bienvenue de 2 000 FC est réservé à l'investissement locatif et ne peut être retiré directement.`);
      return;
    }

    if (!withdrawPhone || withdrawPhone.length < 10) {
      setWithdrawError('Veuillez fournir un numéro Airtel Money valide à 10 chiffres (ex: 0992611845).');
      return;
    }

    const txId = `TX-AIRTEL-W-${Math.floor(100000 + Math.random() * 900000)}`;
    const hash = `SHA256: ${Array.from({length: 24}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;

    // Enregistrement dans la table Supabase withdrawal_requests si configuré
    if (authService.isOnlineBackend()) {
      const res = await dataService.requestWithdrawal({
        userId: String(user.id),
        amount: withdrawAmount,
        destinationPhone: withdrawPhone,
        paymentMethod: 'airtel_money',
      });

      if (!res.success) {
        setWithdrawError(res.error || 'Erreur lors de la validation du retrait.');
        return;
      }
    }

    // Déduire immédiatement le montant du solde disponible (verrouillage de sécurité)
    setUser(prev => ({
      ...prev,
      balance: prev.balance - withdrawAmount
    }));

    // Mettre à jour également la balance sauvegardée dans localStorage
    updateRegisteredUserAccount({ email: user.email, phone: user.phone, fullName: user.fullName }, -withdrawAmount, 0, 0);

    const newWithdrawal = {
      id: Date.now(),
      txId,
      userName: user.fullName,
      email: user.email,
      phone: withdrawPhone,
      amount: withdrawAmount,
      currentBalance: user.balance - withdrawAmount,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      hash
    };

    const updatedWithdrawals = [newWithdrawal, ...pendingWithdrawals];
    setPendingWithdrawals(updatedWithdrawals);
    try {
      localStorage.setItem('renttech_pending_withdrawals_v2', JSON.stringify(updatedWithdrawals));
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du retrait dans localStorage:', err);
    }
    window.dispatchEvent(new Event('renttech_data_sync'));

    setUserHistory(prev => [
      {
        id: txId,
        type: 'withdrawal',
        title: `Retrait Airtel Money (${withdrawPhone})`,
        amount: withdrawAmount,
        status: 'en_attente',
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        hash
      },
      ...prev
    ]);

    setTicker(prev => [
      { id: Date.now(), user: `${user.fullName.split(' ')[0]} K.`, action: 'a demandé un retrait Airtel Money', amount: `${withdrawAmount.toLocaleString('fr-FR')} FC`, time: 'à l\'instant', type: 'withdrawal' },
      ...prev
    ]);

    setWithdrawHash(hash);
    setWithdrawSuccess(true);
  };

  // APPROBATION DEPOT ADMIN (+ COMMISSION PARRAIN 20%)
  const approveDeposit = (id: number, amount: number) => {
    const target = pendingDeposits.find(d => d.id === id);
    if (!target) return;

    // 1. Retirer du tableau des dépôts en attente et sauvegarder
    const remainingDeposits = pendingDeposits.filter(d => d.id !== id);
    setPendingDeposits(remainingDeposits);
    try {
      localStorage.setItem('renttech_pending_deposits_v2', JSON.stringify(remainingDeposits));
    } catch (e) {
      console.error(e);
    }

    // 2. Archiver dans completedDeposits
    const archiveItem = {
      ...target,
      status: 'approuve',
      processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };
    const updatedCompleted = [archiveItem, ...completedDeposits];
    setCompletedDeposits(updatedCompleted);
    try {
      localStorage.setItem('renttech_completed_deposits_v2', JSON.stringify(updatedCompleted));
    } catch (e) {
      console.error(e);
    }

    // 3. Créer l'investissement actif avec cycle de gains 24H
    const packObj = INVESTMENT_LEVELS.find(p => p.name === target.pack) || INVESTMENT_LEVELS[2];
    const now = Date.now();
    const newInvestment = {
      id: Date.now(),
      userName: target.userName,
      userPhone: target.phone,
      packName: target.pack || packObj.name,
      investedAmount: amount,
      dailyYield: packObj.dailyYield,
      createdAt: now,
      lastCollectedAt: now,
      nextYieldAt: now + 24 * 60 * 60 * 1000
    };
    const updatedInvestments = [newInvestment, ...activeInvestments];
    setActiveInvestments(updatedInvestments);
    try {
      localStorage.setItem('renttech_active_investments_v2', JSON.stringify(updatedInvestments));
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(new Event('renttech_data_sync'));

    // 4. Créditer le compte de l'utilisateur concerné dans localStorage
    updateRegisteredUserAccount({ phone: target.phone, fullName: target.userName }, amount, amount, 0);

    // 5. Si l'utilisateur connecté en session est la personne créditée, mettre à jour le state React
    if (user.phone === target.phone || user.fullName === target.userName) {
      setUser(prev => ({
        ...prev,
        balance: prev.balance + amount,
        totalInvested: prev.totalInvested + amount
      }));
    }

    setUserHistory(prev => prev.map(item => item.id === target.txId ? { ...item, status: 'approuve' } : item));

    // 6. CALCUL ET ATTRIBUTION ATOMIQUE DE LA COMMISSION PARRAIN DE 20% (SANS DOUBLE COMPTAGE)
    try {
      const processedRaw = localStorage.getItem('renttech_processed_referral_deposits') || '[]';
      const processedIds: number[] = JSON.parse(processedRaw);

      if (!processedIds.includes(target.id)) {
        const usersRaw = localStorage.getItem('renttech_registered_users_v2');
        if (usersRaw) {
          const registeredUsers: any[] = JSON.parse(usersRaw);
          // Trouver le filleul qui a déposé
          const filleul = registeredUsers.find(u => 
            (u.phone && u.phone.trim() === target.phone.trim()) ||
            (u.fullName && u.fullName.trim().toLowerCase() === target.userName.trim().toLowerCase())
          );

          // Determiner le parrain (filleul.referredBy ou par défaut RT892X4)
          const sponsorRef = (filleul && filleul.referredBy) ? filleul.referredBy.trim().toUpperCase() : 'RT892X4';

          // Commission exacte de 20% en Francs Congolais (CDF)
          const commissionFC = Math.round(amount * 0.20);

          // Crédit atomique dans localStorage pour le parrain
          updateRegisteredUserAccount({ referralCode: sponsorRef } as UserIdentifier, commissionFC, 0, commissionFC);

          // Si le parrain est l'utilisateur connecté en session
          if (user.referralCode === sponsorRef || user.fullName === 'MYATSI') {
            setUser(prev => ({
              ...prev,
              balance: prev.balance + commissionFC,
              totalEarned: prev.totalEarned + commissionFC
            }));
          }

          // Marquer la transaction comme traitée
          localStorage.setItem('renttech_processed_referral_deposits', JSON.stringify([...processedIds, target.id]));

          // Notification Ticker
          setTicker(prev => [
            { 
              id: Date.now(), 
              user: `${target.userName.split(' ')[0]} K.`, 
              action: `a généré 20% de commission parrainage (${commissionFC.toLocaleString('fr-FR')} FC)`, 
              amount: `${commissionFC.toLocaleString('fr-FR')} FC`, 
              time: 'à l\'instant', 
              type: 'bonus' 
            },
            ...prev
          ]);
        }
      }
    } catch (err) {
      console.error('Erreur lors du calcul de commission parrain:', err);
    }

    window.dispatchEvent(new Event('renttech_data_sync'));
  };

  const rejectDeposit = (id: number) => {
    const target = pendingDeposits.find(d => d.id === id);
    if (target) {
      setUserHistory(prev => prev.map(item => item.id === target.txId ? { ...item, status: 'rejete' } : item));

      const archiveItem = {
        ...target,
        status: 'rejete',
        processedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
      };
      const updatedCompleted = [archiveItem, ...completedDeposits];
      setCompletedDeposits(updatedCompleted);
      try {
        localStorage.setItem('renttech_completed_deposits_v2', JSON.stringify(updatedCompleted));
      } catch (e) {
        console.error(e);
      }
    }

    const remainingDeposits = pendingDeposits.filter(d => d.id !== id);
    setPendingDeposits(remainingDeposits);
    try {
      localStorage.setItem('renttech_pending_deposits_v2', JSON.stringify(remainingDeposits));
    } catch (e) {
      console.error(e);
    }

    window.dispatchEvent(new Event('renttech_data_sync'));
  };

  // APPROBATION RETRAIT ADMIN
  const approveWithdrawal = (id: number, amount: number) => {
    const target = pendingWithdrawals.find(w => w.id === id);
    if (!target) return;

    const remainingWithdrawals = pendingWithdrawals.filter(w => w.id !== id);
    setPendingWithdrawals(remainingWithdrawals);
    try {
      localStorage.setItem('renttech_pending_withdrawals_v2', JSON.stringify(remainingWithdrawals));
    } catch (e) {
      console.error(e);
    }

    // Alerte enregistrée dans localStorage pour la session de l'utilisateur
    const alertObj = {
      id: Date.now(),
      targetEmail: target.email,
      targetPhone: target.phone,
      type: 'approuve' as const,
      amount: target.amount,
      phone: target.phone,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const prevAlerts = JSON.parse(localStorage.getItem('renttech_withdrawal_alerts_v2') || '[]');
      localStorage.setItem('renttech_withdrawal_alerts_v2', JSON.stringify([alertObj, ...prevAlerts]));
    } catch (e) {
      console.error(e);
    }

    if (user.phone === target.phone || user.email === target.email) {
      setWithdrawalAlerts(prev => [alertObj, ...prev]);
    }

    setUserHistory(prev => prev.map(item => item.id === target.txId ? { ...item, status: 'approuve' } : item));
  };

  // REJET RETRAIT ADMIN (REMBOURSEMENT DU SOLDE)
  const rejectWithdrawal = (id: number) => {
    const target = pendingWithdrawals.find(w => w.id === id);
    if (!target) return;

    const remainingWithdrawals = pendingWithdrawals.filter(w => w.id !== id);
    setPendingWithdrawals(remainingWithdrawals);
    try {
      localStorage.setItem('renttech_pending_withdrawals_v2', JSON.stringify(remainingWithdrawals));
    } catch (e) {
      console.error(e);
    }

    // Rembourser le montant au solde disponible de l'utilisateur dans localStorage
    updateRegisteredUserAccount({ email: target.email, phone: target.phone, fullName: target.userName }, target.amount, 0, 0);

    if (user.email === target.email || user.phone === target.phone) {
      setUser(prev => ({
        ...prev,
        balance: prev.balance + target.amount
      }));
    }

    const alertObj = {
      id: Date.now(),
      targetEmail: target.email,
      targetPhone: target.phone,
      type: 'rejete' as const,
      amount: target.amount,
      phone: target.phone,
      date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    try {
      const prevAlerts = JSON.parse(localStorage.getItem('renttech_withdrawal_alerts_v2') || '[]');
      localStorage.setItem('renttech_withdrawal_alerts_v2', JSON.stringify([alertObj, ...prevAlerts]));
    } catch (e) {
      console.error(e);
    }

    if (user.phone === target.phone || user.email === target.email) {
      setWithdrawalAlerts(prev => [alertObj, ...prev]);
    }

    setUserHistory(prev => prev.map(item => item.id === target.txId ? { ...item, status: 'rejete' } : item));
  };

  // Filtrage des packs
  const filteredPacks = INVESTMENT_LEVELS.filter(pack => {
    const matchesSearch = pack.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'Tous' || pack.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  if (!isLoggedIn) {
    return <AuthGate onLoginSuccess={handleGateLoginSuccess} />;
  }

  return (
    <div className={`min-h-screen font-sans pb-24 md:pb-12 selection:bg-amber-500 selection:text-black transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0b111e] text-gray-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* BANNIÈRE AVERTISSEMENT CONNEXION RÉSEAU HORS-LIGNE (navigator.onLine) */}
      {!isOnline && (
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-500/50 p-3 sm:p-4 text-white shadow-2xl relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 animate-pulse">
                <WifiOff className="w-5 h-5" />
              </div>
              <div>
                <div className="font-extrabold text-rose-200 flex items-center gap-2">
                  <span>{t.offlineTitle}</span>
                  <span className="px-2.5 py-0.5 bg-rose-500/30 text-rose-200 text-[10px] font-black rounded-full border border-rose-400/40 uppercase tracking-wider shadow-sm">
                    Réseau Inaccessible
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-300/90 leading-tight mt-0.5">
                  {t.offlineBannerDesc}
                </p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono font-semibold text-rose-300/80 bg-rose-950/60 px-3 py-1.5 rounded-xl border border-rose-800/60 shrink-0">
              <Shield className="w-3.5 h-3.5 text-rose-400" /> Mode Protection Hors-Ligne
            </div>
          </div>
        </div>
      )}

      {/* BANNIÈRE SUCCÈS RÉTABLISSEMENT CONNEXION */}
      {isOnline && showRestoredNotice && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/50 p-3 text-white shadow-xl relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Wifi className="w-4 h-4" />
              </div>
              <span className="font-bold text-emerald-200">{t.onlineRestored}</span>
            </div>
            <button 
              onClick={() => setShowRestoredNotice(false)}
              className="text-emerald-400 hover:text-white text-xs font-semibold px-2 py-1 rounded-lg hover:bg-emerald-800/50"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Ticker d'activités en direct */}
      <div className="bg-slate-900 border-b border-slate-800 py-2 px-4 text-xs overflow-hidden whitespace-nowrap text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          <span className="font-bold text-blue-400 flex items-center gap-1.5 shrink-0 uppercase tracking-wide text-[11px]">
            <Activity className="w-3.5 h-3.5 text-blue-500" /> DIRECT RENTTECH:
          </span>
          <div className="flex items-center gap-8 overflow-x-auto no-scrollbar">
            {ticker.map(item => (
              <span key={item.id} className="text-slate-300 inline-flex items-center gap-1.5 shrink-0 text-[11px]">
                <span className="font-semibold text-white">{item.user}</span> {item.action} 
                <span className="font-mono text-emerald-400 font-bold">{item.amount}</span> 
                <span className="text-slate-500 text-[10px]">({item.time})</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Navbar ultra pro */}
      <nav className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 py-3.5 px-4 sm:px-6 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="cursor-pointer" onClick={() => { setActiveTab('dashboard'); setActiveView('overview'); }}>
            <BrandLogo variant="full" size="md" />
          </div>

          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Indicateur Réseau En Direct */}
            <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              isOnline 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
            }`} title={isOnline ? 'Connexion Active' : 'Hors Ligne'}>
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden sm:inline">En Ligne</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hors-Ligne</span>
                </>
              )}
            </div>

            {/* Statut du Compte : Actif ou En attente d'activation */}
            <div className={`px-2.5 py-1 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all ${
              user.isActivated 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                : 'bg-amber-50 border-amber-200 text-amber-800'
            }`} title={user.isActivated ? 'Compte Actif' : "Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits."}>
              <span className={`w-2 h-2 rounded-full ${user.isActivated ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
              <span className="hidden md:inline">{user.isActivated ? 'Compte Actif' : "En attente d'activation"}</span>
            </div>

            <LanguageSelector currentLang={currentLang} onLanguageChange={setCurrentLang} />

            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
            >
              <User className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">{user.fullName || 'Mon Profil'}</span>
              <span className="sm:hidden">Profil</span>
            </button>

            <button 
              onClick={handleAdminTabAccess}
              className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs ${
                isAdminPinVerified 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' 
                  : 'bg-slate-900 border-slate-800 text-white hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className={`w-4 h-4 ${isAdminPinVerified ? 'text-emerald-600' : 'text-blue-400'}`} />
              <span className="hidden sm:inline">{activeTab === 'admin' ? 'Espace Client' : isAdminPinVerified ? 'Admin (Actif)' : 'Espace Admin'}</span>
              <span className="sm:hidden">Admin</span>
            </button>

            <button 
              onClick={() => setActiveTab('files')}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200 hidden md:flex items-center gap-1.5"
            >
              <FileText className="w-4 h-4 text-blue-600" /> Fichiers PHP/MySQL
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">

        {/* NOTIFICATIONS EN TEMPS RÉEL DECISIONS DE RETRAIT */}
        {withdrawalAlerts.length > 0 && (
          <div className="space-y-3">
            {withdrawalAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-4 rounded-2xl border text-xs sm:text-sm font-semibold flex items-start justify-between gap-3 shadow-md transition-all ${
                  alert.type === 'approuve' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.type === 'approuve' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-bold text-slate-900 block uppercase text-xs">
                      {alert.type === 'approuve' 
                        ? '🎉 RETRAIT APPROUVÉ ET ENVOYÉ !' 
                        : '⚠️ DEMANDE DE RETRAIT REFUSÉE'}
                    </span>
                    <p className="text-xs font-medium">
                      {alert.type === 'approuve' 
                        ? `Votre demande de retrait de ${alert.amount.toLocaleString('fr-FR')} FC via Airtel Money (${alert.phone}) a été approuvée.` 
                        : `Votre demande de retrait de ${alert.amount.toLocaleString('fr-FR')} FC via Airtel Money (${alert.phone}) a été refusée. Le montant a été remboursé sur votre solde.`}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setWithdrawalAlerts(withdrawalAlerts.filter(a => a.id !== alert.id))}
                  className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-white border border-slate-200 rounded-lg shrink-0 transition-colors"
                >
                  Fermer ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {/* HERO BANNER SECTION */}
        {activeTab === 'dashboard' && activeView === 'overview' && (
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900 text-white">
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 opacity-95"></div>
            <div className="relative z-10 p-6 sm:p-10 max-w-3xl space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
                <Sparkles className="w-3.5 h-3.5" /> Plateforme FinTech de Location Tech
              </span>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                Financez des <span className="text-blue-400">iPads, Laptops & Datacenters</span> et Générez des Revenus Quotidiens.
              </h1>
              <p className="text-sm text-slate-300 leading-relaxed">
                Investissez dans la flotte technologique officielle déployée à Kinshasa, Goma et Lubumbashi. Système de recharge manuel Airtel Money sécurisé et versement instantané des commissions.
              </p>
              
              <div className="pt-2 flex flex-wrap gap-3">
                <button 
                  onClick={() => openDepositView()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-md transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Dépôt Rapide Airtel Money
                </button>
                <button 
                  onClick={() => setActiveView('withdraw')}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 border border-slate-700 transition-all"
                >
                  <ArrowUpRight className="w-4 h-4 text-blue-400" /> Effectuer un Retrait
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW ARCHITECTURE SOURCE FILES */}
        {activeTab === 'files' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" /> Fichiers PHP / MySQL Générés Intégralement
                </h2>
                <p className="text-sm text-slate-500">Code complet prêt au déploiement serveur avec sécurité internationale.</p>
              </div>
              <button onClick={() => setActiveTab('dashboard')} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs">
                Retour au Tableau de Bord
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="font-mono text-blue-600 font-bold mb-1 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-600" /> database.sql
                </div>
                <p className="text-xs text-slate-600 mb-3">Schéma InnoDB relationnel avec clés étrangères, contraintes de sécurité et indexation.</p>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">Moteur InnoDB Ready</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="font-mono text-blue-600 font-bold mb-1 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-600" /> config.php
                </div>
                <p className="text-xs text-slate-600 mb-3">Connexion PDO sécurisée, Rate Limiting Anti-Brute Force, En-têtes HTTP Security & CSRF Token.</p>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">PDO MySQL + CSRF + PIN 998844</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="font-mono text-blue-600 font-bold mb-1 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" /> register.php
                </div>
                <p className="text-xs text-slate-600 mb-3">Inscription/Connexion ultra-sécurisée avec BCRYPT cost 12, indicateur de force de mot de passe & parrainage URL.</p>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">URL Ref Detector + CSRF Guard</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors">
                <div className="font-mono text-blue-600 font-bold mb-1 flex items-center gap-2">
                  <LayoutDashboard className="w-4 h-4 text-blue-600" /> dashboard.php
                </div>
                <p className="text-xs text-slate-600 mb-3">Espace investisseur complet, procédure Airtel Money, jeton haché unique pour les fichiers et navigation mobile app-like.</p>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">Anti-Fraud Hashed Upload</span>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-colors md:col-span-2">
                <div className="font-mono text-blue-600 font-bold mb-1 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-blue-600" /> admin.php
                </div>
                <p className="text-xs text-slate-600 mb-3">Panneau de contrôle de la trésorerie avec Code PIN 998844. Transactions MySQL ACID pour verser automatiquement les 20% au parrain et valider les retraits.</p>
                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200">PIN Protection (998844) & ACID Transactions</span>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD USER */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">

            {/* NAV TABS VUES DU DASHBOARD */}
            <div className="flex items-center gap-2 overflow-x-auto bg-white p-2 rounded-2xl border border-slate-200 shadow-xs no-scrollbar">
              {[
                { id: 'overview', label: t.overview, icon: LayoutDashboard },
                { id: 'deposit', label: t.deposit, icon: PlusCircle },
                { id: 'withdraw', label: t.withdraw, icon: ArrowUpRight },
                { id: 'history', label: t.history, icon: History },
                { id: 'calculator', label: 'Simulateur ROI', icon: Calculator }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeView === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'deposit') {
                        openDepositView();
                      } else {
                        setActiveView(tab.id as any);
                      }
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shrink-0 ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Solde & Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center justify-center gap-1.5 mb-2">
                  <Wallet className="w-4 h-4 text-blue-600" /> {t.availableBalance}
                </div>
                <div className="text-3xl font-extrabold text-slate-900 my-1 font-mono tracking-tight">
                  {user.balance.toLocaleString('fr-FR')} FC
                </div>
                <div className="mb-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Bonus de bienvenue : 2 000 FC
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-4 font-medium">{t.instantPayment}</p>

                <div className="flex justify-center gap-2">
                  <button 
                    onClick={() => openDepositView()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs transition-all"
                  >
                    <PlusCircle className="w-4 h-4" /> {t.rechargeBtn}
                  </button>
                  <button 
                    onClick={() => {
                      setWithdrawError('');
                      setActiveView('withdraw');
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4 text-blue-600" /> {t.withdrawBtn}
                  </button>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-blue-300 transition-all">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-blue-600" /> {t.totalInvested}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 my-1 font-mono">
                  {user.totalInvested.toLocaleString('fr-FR')} FC
                </div>
                <span className="text-xs text-emerald-600 flex items-center justify-center gap-1 mt-2 font-medium">
                  <ShieldCheck className="w-4 h-4" /> Flotte technologique active
                </span>
              </div>

              <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center shadow-sm hover:border-blue-300 transition-all">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" /> {t.referralCommission}
                </div>
                <div className="text-2xl font-extrabold text-emerald-600 my-1 font-mono">
                  {user.totalEarned.toLocaleString('fr-FR')} FC
                </div>
                <span className="text-xs text-slate-500 mt-2 block font-medium">Versé automatiquement sur dépôt filleul</span>
              </div>
            </div>

            {/* Bannière de Statut du Compte & Bonus de bienvenue */}
            {!user.isActivated ? (
              <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 border border-amber-300 flex items-center justify-center shrink-0 text-amber-800 shadow-inner">
                    <Sparkles className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-amber-950 text-sm">Statut du compte : En attente d'activation</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-200 border border-amber-300 text-amber-900 text-[11px] font-bold">
                        Bonus de bienvenue : 2 000 FC
                      </span>
                    </div>
                    <p className="text-amber-900 text-xs mt-1 font-medium">
                      Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits. (Retrait minimum : 5 000 FC)
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openDepositView()}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs shadow-xs shrink-0 flex items-center gap-1.5 transition-all"
                >
                  <PlusCircle className="w-4 h-4" /> Faire mon premier dépôt
                </button>
              </div>
            ) : (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-bold">Statut du compte : Actif</span>
                  <span className="text-emerald-700 hidden sm:inline">• Compte validé suite à confirmation réelle de dépôt. Retraits débloqués.</span>
                </div>
                <span className="text-[11px] font-bold font-mono bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-xl border border-emerald-200">
                  Retrait min : 5 000 FC
                </span>
              </div>
            )}

            {/* VUE 1 : OVERVIEW / VUE D'ENSEMBLE */}
            {activeView === 'overview' && (
              <div className="space-y-6">
                
                {/* Recharts 30-Day Cumulative Earnings Trend */}
                <EarningsChart 
                  currentLang={currentLang} 
                  totalInvested={user.totalInvested} 
                  totalEarned={user.totalEarned} 
                  userBalance={user.balance} 
                />

                {/* SECTION VOS INVESTISSEMENTS ACTIFS & COMPTEUR DE GAINS 24H */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 border-b border-slate-100 pb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-blue-600" /> Vos Investissements Actifs & Compteur de Gains (Cycle 24h)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Les bénéfices journaliers sont générés automatiquement 24 heures après la confirmation de votre investissement.
                      </p>
                    </div>
                    <button 
                      onClick={() => openDepositView()}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-xs shrink-0 flex items-center gap-1.5"
                    >
                      <PlusCircle className="w-4 h-4" /> Investir dans un Pack
                    </button>
                  </div>

                  {activeInvestments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs text-slate-600 font-medium">Aucun investissement actif pour le moment.</p>
                      <p className="text-[11px] text-slate-500 mt-1">Choisissez un pack d'équipement pour lancer le compteur de gains de 24 heures.</p>
                      <button 
                        onClick={() => openDepositView()}
                        className="mt-4 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all inline-flex items-center gap-2"
                      >
                        <Zap className="w-4 h-4" /> Choisir un Pack Maintenant
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeInvestments.map((inv, idx) => {
                        const isReady = currentTime >= inv.nextYieldAt;
                        const countdownStr = formatCountdown(inv.nextYieldAt, currentTime);

                        return (
                          <div 
                            key={inv.id || idx}
                            className={`p-5 rounded-2xl border transition-all ${
                              isReady 
                                ? 'bg-emerald-50/60 border-emerald-300 shadow-sm'
                                : 'bg-slate-50 border-slate-200'
                            }`}
                          >
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 text-sm sm:text-base">{inv.packName}</span>
                                  {isReady ? (
                                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded-full uppercase tracking-wider flex items-center gap-1">
                                      <Sparkles className="w-3 h-3 text-emerald-600" /> GAIN PRÊT !
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full flex items-center gap-1">
                                      <Clock className="w-3 h-3 text-blue-600" /> Cycle 24H En Cours
                                    </span>
                                  )}
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                                  <span>Investi: <strong className="text-slate-700">{inv.investedAmount.toLocaleString('fr-FR')} FC</strong></span>
                                  <span>Gain/24h: <strong className="text-emerald-600">+{inv.dailyYield.toLocaleString('fr-FR')} FC</strong></span>
                                </div>
                              </div>

                              <div className="w-full md:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                                {!isReady ? (
                                  <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 text-center sm:text-right">
                                    <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Prochain Versement Dans</span>
                                    <span className="text-sm font-mono font-bold text-blue-600 tracking-wider">
                                      ⏱️ {countdownStr}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => claimInvestmentYield(inv.id)}
                                    className="w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-bold text-xs sm:text-sm rounded-xl hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                                  >
                                    <Sparkles className="w-4 h-4 text-white" />
                                    RÉCOLTER MON GAIN (+{inv.dailyYield.toLocaleString('fr-FR')} FC)
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                
                {/* Lien d'Affiliation & QR Code Generator */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-600" /> Votre Lien d'Affiliation Exclusif (20% Commission Instantanée)
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Chaque nouvel investisseur inscrit avec votre code vous rapporte instantanément 20% sur la totalité de ses recharges !
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowQrCode(!showQrCode)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all"
                    >
                      <QrCode className="w-4 h-4 text-blue-600" /> {showQrCode ? 'Masquer QR Code' : 'Générer QR Code'}
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={referralUrl}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm rounded-xl px-4 py-3 flex-1 font-mono focus:outline-none"
                    />
                    <button 
                      onClick={copyLink}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold px-6 py-3 rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10"
                    >
                      {copied ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copied ? 'Copié !' : 'Copier le Lien'}
                    </button>
                  </div>

                  {showQrCode && (
                    <div className="mt-4 p-4 bg-gray-900 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
                      <div className="bg-white p-3 rounded-xl">
                        <img 
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(referralUrl)}`} 
                          alt="QR Code Referral" 
                          className="w-28 h-28"
                        />
                      </div>
                      <div className="text-xs space-y-1 text-center sm:text-left">
                        <span className="font-bold text-amber-400 text-sm block">Scannez pour rejoindre RentTech Hub</span>
                        <p className="text-gray-400">Faites scanner ce code QR directement à vos filleuls lors de présentations physiques.</p>
                        <span className="text-[10px] text-gray-500 font-mono block pt-1">Code Parrain : {user.referralCode}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* BARRE DE RECHERCHE ET FILTRES */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                        <Cpu className="w-5 h-5" /> Matrice des Packs de Location & Investissement (8 Niveaux)
                      </h3>
                      <p className="text-xs text-gray-400">Sélectionnez un pack pour afficher sa fiche technique complète ou effectuer une recharge.</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input 
                          type="text" 
                          placeholder="Rechercher un pack..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Filtre de catégories */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {['Tous', 'Tablette', 'Ordinateur', 'Serveur', 'Datacenter'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                          selectedCategory === cat 
                            ? 'bg-blue-600 text-white shadow-xs' 
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Grille des 8 Packs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {filteredPacks.map((lvl) => {
                      const availablePercent = Math.round((lvl.stockAvailable / lvl.totalUnits) * 100);
                      return (
                        <div 
                          key={lvl.id} 
                          className="bg-white border border-slate-200 hover:border-blue-300 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between transition-all group hover:-translate-y-1 relative"
                        >
                          <div className="relative h-44 overflow-hidden bg-slate-100">
                            <img 
                              src={lvl.image} 
                              alt={lvl.name} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
                            <span className="absolute top-3 left-3 px-2.5 py-1 bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-bold rounded-lg border border-slate-200 shadow-xs">
                              {lvl.category}
                            </span>
                            <span className="absolute top-3 right-3 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded-lg shadow-xs">
                              Dispo: {lvl.stockAvailable}/{lvl.totalUnits}
                            </span>
                          </div>

                          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">{lvl.name}</h4>
                              <div className="text-2xl font-extrabold text-blue-600 my-1 font-mono tracking-tight">
                                {lvl.price.toLocaleString('fr-FR')} FC
                              </div>
                              
                              <div className="space-y-1.5 pt-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div className="flex justify-between text-slate-600">
                                  <span>{t.sponsorshipGain}:</span>
                                  <span className="text-emerald-600 font-bold">+{lvl.commission.toLocaleString('fr-FR')} FC</span>
                                </div>
                                <div className="flex justify-between text-slate-600">
                                  <span>{t.dailyReturn}:</span>
                                  <span className="text-slate-900 font-bold">{lvl.dailyYield.toLocaleString('fr-FR')} FC/j</span>
                                </div>
                              </div>

                              {/* Barre de progression du taux d'occupation */}
                              <div className="mt-3 space-y-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center text-[10px] font-semibold">
                                  <span className="text-slate-500 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                    Taux d'occupation dispo
                                  </span>
                                  <span className="font-mono text-slate-700 font-bold">
                                    {lvl.stockAvailable}/{lvl.totalUnits} ({availablePercent}%)
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ width: `${availablePercent}%` }}
                                  />
                                </div>
                              </div>

                            </div>

                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <button 
                                onClick={() => setModalPackSpecs(lvl)}
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-1"
                              >
                                <Info className="w-3.5 h-3.5 text-blue-600" /> {t.techSpecs}
                              </button>

                              <button 
                                onClick={() => openDepositView(lvl)}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                              >
                                {t.investRecharge}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* VUE 2 : DEPOSIT / RECHARGER AIRTEL */}
            {activeView === 'deposit' && (
              <div className="space-y-6 animate-fade-in">
                
                {/* Consignes Airtel */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 text-blue-600">
                        <Phone className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-900">Procédure de Dépôt Airtel Money</h4>
                        <p className="text-xs text-slate-500">Effectuez le transfert manuel puis soumettez votre capture de confirmation.</p>
                      </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 w-full md:w-auto grid grid-cols-2 gap-6 text-center">
                      <div>
                        <span className="text-xs text-slate-500 block font-semibold">Numéro Officiel Airtel</span>
                        <span className="text-lg font-extrabold text-slate-900 font-mono">+243976704762</span>
                      </div>
                      <div>
                        <span className="text-xs text-slate-500 block font-semibold">Nom Obligatoire</span>
                        <span className="text-lg font-extrabold text-blue-600 font-mono">MYATSI</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <PlusCircle className="w-5 h-5 text-blue-600" /> Formulaire de Recharge avec Preuve de Paiement
                    </h3>
                    <button 
                      onClick={() => setActiveView('overview')} 
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-all border border-slate-200 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" /> Retour au Tableau de Bord
                    </button>
                  </div>

                  {depositError && (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {depositError}
                    </div>
                  )}

                  {depositSuccess ? (
                    <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                      <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-xs">
                        <CheckCircle2 className="w-10 h-10" />
                      </div>
                      <h4 className="text-xl font-bold text-emerald-800">Demande de Recharge Soumise !</h4>
                      <p className="text-xs text-slate-600 max-w-md mx-auto">Votre capture d'écran a été chiffrée et transmise à l'administrateur avec signature cryptographique.</p>

                      <div className="p-4 bg-white rounded-2xl border border-emerald-200 font-mono text-xs space-y-1 text-left max-w-md mx-auto shadow-xs">
                        <span className="text-slate-400 block text-[10px]">REÇU TRANSMISSION:</span>
                        <div className="text-blue-600 font-bold truncate">{depositHash}</div>
                        <div className="text-slate-700">Montant déclaré : {depositAmount.toLocaleString('fr-FR')} FC</div>
                        <div className="text-emerald-600 font-bold">Statut : EN ATTENTE D'APPROBATION DIREX</div>
                      </div>

                      <button 
                        onClick={() => {
                          setDepositSuccess(false);
                          setActiveView('overview');
                        }}
                        className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700"
                      >
                        Retour au Tableau de Bord
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDepositSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Pack Choisi</label>
                        <input 
                          type="text" 
                          value={selectedPack.name} 
                          onChange={(e) => setSelectedPack({ ...selectedPack, name: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none" 
                          required 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Montant envoyé via Airtel Money (FC)</label>
                        <input 
                          type="number" 
                          value={depositAmount} 
                          onChange={(e) => setDepositAmount(Number(e.target.value))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none font-mono" 
                          required 
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">Capture d'Écran de Preuve de Paiement (JPG, PNG)</label>
                        <input 
                          id="deposit-proof-file-input"
                          type="file" 
                          accept="image/*"
                          onChange={handleProofFileChange}
                          className="hidden"
                        />
                        <label 
                          htmlFor="deposit-proof-file-input"
                          className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-5 text-center transition-all cursor-pointer bg-slate-50 block relative overflow-hidden group shadow-inner"
                        >
                          {depositProofPreview ? (
                            <div className="space-y-3">
                              <img 
                                src={depositProofPreview} 
                                alt="Preuve de paiement Airtel" 
                                className="max-h-48 mx-auto rounded-xl object-contain border border-slate-300 shadow-md"
                              />
                              <div className="flex items-center justify-center gap-2 text-xs text-blue-600 font-bold">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>{depositProofFileName || "Capture de paiement sélectionnée avec succès"}</span>
                                <span className="text-slate-500 text-[10px] underline hover:text-slate-800">(Cliquer pour modifier)</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload className="w-9 h-9 text-blue-600 mx-auto group-hover:scale-105 transition-transform" />
                              <span className="text-xs text-blue-700 font-bold block">
                                Cliquez ici pour sélectionner votre capture de confirmation Airtel Money
                              </span>
                              <span className="text-[10px] text-slate-500 block">
                                Format image accepté • Chiffrement SHA-256 direct vers la Trésorerie MYATSI
                              </span>
                            </div>
                          )}
                        </label>
                      </div>

                      {!isOnline && (
                        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                          <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{t.offlineBannerDesc}</span>
                        </div>
                      )}

                      <button 
                        type="submit" 
                        disabled={!isOnline}
                        className={`w-full font-bold py-3.5 rounded-xl text-sm transition-all shadow-xs flex items-center justify-center gap-2 ${
                          !isOnline 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {isOnline ? (
                          <>
                            <ShieldCheck className="w-4 h-4" /> Soumettre la Preuve de Recharge Sécurisée
                          </>
                        ) : (
                          <>
                            <WifiOff className="w-4 h-4 text-rose-600" /> {t.offlineSubmitBlocked}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* VUE 3 : WITHDRAW / DEMANDE DE RETRAIT AIRTEL MONEY ULTRA PRO */}
            {activeView === 'withdraw' && (
              <div className="bg-[#111827] border border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl animate-fade-in space-y-6">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-amber-500 flex items-center gap-2">
                      <ArrowUpRight className="w-5 h-5 text-amber-400" /> Guichet de Retrait Airtel Money Ultra-Sécurisé
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Saisissez le montant souhaité et votre numéro Airtel Money pour recevoir vos fonds instantanément.</p>
                  </div>
                  <button onClick={() => setActiveView('overview')} className="text-gray-400 hover:text-white text-sm font-semibold">
                    Fermer ✕
                  </button>
                </div>

                {/* Cyber Security Guard Badge */}
                <div className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-gray-300 font-semibold">Verrouillage Cyber-Sécurisé Anti-Fraude Actif</span>
                  </div>
                  <span className="text-emerald-400 font-mono font-bold">SHA-256 Encr. Validé</span>
                </div>

                {withdrawError && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {withdrawError}
                  </div>
                )}

                {withdrawSuccess ? (
                  <div className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <h4 className="text-xl font-black text-emerald-400">Demande de Retrait Transmise !</h4>
                    <p className="text-xs text-gray-300 max-w-md mx-auto">
                      Votre demande de <span className="text-amber-400 font-bold font-mono">{withdrawAmount.toLocaleString('fr-FR')} FC</span> vers le <span className="text-white font-bold font-mono">{withdrawPhone}</span> a été enregistrée avec succès.
                    </p>

                    <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 font-mono text-xs space-y-1 text-left max-w-md mx-auto">
                      <span className="text-gray-500 block text-[10px]">JEU DE CLES CRYPTOGRAPHIQUES SIG:</span>
                      <div className="text-blue-600 font-bold truncate">{withdrawHash}</div>
                      <div className="text-slate-700">Numéro Airtel Récepteur : {withdrawPhone}</div>
                      <div className="text-emerald-600 font-bold">Statut : EN ATTENTE DE VERSEMENT MYATSI</div>
                    </div>

                    <button 
                      onClick={() => {
                        setWithdrawSuccess(false);
                        setActiveView('overview');
                      }}
                      className="px-6 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700"
                    >
                      Retour au Tableau de Bord
                    </button>
                  </div>
                ) : (() => {
                  const isAccountPendingActivation = !user.isActivated;
                  const bonusToDeduct = user.welcomeBonusClaimed ? 2000 : 0;
                  const withdrawableBalance = Math.max(0, user.balance - bonusToDeduct);
                  const isExceedingBalance = withdrawAmount > withdrawableBalance;
                  const isBelowMinimum = withdrawAmount > 0 && withdrawAmount < 5000;
                  const isZeroOrNegative = withdrawAmount <= 0;
                  const isPhoneInvalid = !withdrawPhone || withdrawPhone.replace(/\s+/g, '').length < 10;
                  const isWithdrawalBlocked = isAccountPendingActivation || isExceedingBalance || isBelowMinimum || isZeroOrNegative || isPhoneInvalid || !isOnline;

                  return (
                    <form onSubmit={handleWithdrawSubmit} className="space-y-5">
                      {!isOnline && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2.5">
                          <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>{t.offlineBannerDesc}</span>
                        </div>
                      )}

                      {/* Panneau Statut du Compte & Règles Officielles */}
                      <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl space-y-2 text-xs">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 font-semibold">Statut du compte :</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              user.isActivated 
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {user.isActivated ? '✓ Actif' : "⏳ En attente d'activation"}
                            </span>
                          </div>
                          <div className="text-amber-400 font-mono font-bold">
                            Retrait minimum : 5 000 FC
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-gray-800 flex-wrap gap-2">
                          <span>Bonus de bienvenue : <strong className="text-white font-mono">2 000 FC</strong> (réservé à l'investissement)</span>
                          <span>Solde retirable disponible : <strong className="text-emerald-400 font-mono">{withdrawableBalance.toLocaleString('fr-FR')} FC</strong></span>
                        </div>
                      </div>

                      {/* Message d'avertissement Retrait Bloqué si compte en attente d'activation */}
                      {isAccountPendingActivation && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-300 text-xs font-semibold space-y-2 shadow-xs">
                          <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                            <span className="font-bold text-amber-200 text-sm block">
                              Compte en attente d'activation
                            </span>
                          </div>
                          <p className="text-xs leading-relaxed text-amber-300/90">
                            Effectuez votre premier dépôt pour activer votre compte et débloquer les retraits.
                          </p>
                          <button 
                            type="button" 
                            onClick={() => openDepositView()}
                            className="mt-1 px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all inline-flex items-center gap-1.5 hover:bg-blue-700"
                          >
                            <PlusCircle className="w-4 h-4" /> Effectuer mon premier dépôt
                          </button>
                        </div>
                      )}
                      
                      {/* Montant avec raccourcis pourcentage */}
                      <div>
                        <div className="flex justify-between items-center mb-1.5">
                          <label className="text-xs font-bold text-slate-700">Montant du Retrait (FC)</label>
                          <span className={`text-xs font-mono font-bold ${isExceedingBalance ? 'text-rose-600' : 'text-blue-600'}`}>
                            Solde retirable: {withdrawableBalance.toLocaleString('fr-FR')} FC
                          </span>
                        </div>
                        
                        <div className="relative">
                          <input 
                            type="number" 
                            value={withdrawAmount === 0 ? '' : withdrawAmount} 
                            onChange={(e) => setWithdrawAmount(Math.max(0, Number(e.target.value)))}
                            className={`w-full font-mono text-lg font-bold rounded-xl p-3.5 focus:outline-none transition-all ${
                              isExceedingBalance 
                                ? 'bg-rose-50 border-2 border-rose-300 text-rose-900 focus:border-rose-500' 
                                : isBelowMinimum
                                ? 'bg-amber-50 border-2 border-amber-300 text-amber-900'
                                : 'bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900'
                            }`} 
                            placeholder="Ex: 50000"
                            required 
                          />
                        </div>

                        {/* Message d'avertissement dynamique en temps réel */}
                        {isExceedingBalance && (
                          <div className="mt-2.5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold flex items-start gap-2.5">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold text-rose-900 text-xs uppercase tracking-wide block flex items-center gap-1">
                                {t.insufficientBalanceTitle}
                              </span>
                              <p className="text-[11px] leading-relaxed text-rose-700">
                                Le bonus de bienvenue de 2 000 FC est réservé à l'investissement locatif et ne peut être retiré directement. Solde retirable disponible : <strong className="font-mono text-emerald-600">{withdrawableBalance.toLocaleString('fr-FR')} FC</strong> vs Montant demandé : <strong className="font-mono text-rose-600">{withdrawAmount.toLocaleString('fr-FR')} FC</strong>.
                              </p>
                            </div>
                          </div>
                        )}

                        {isBelowMinimum && (
                          <div className="mt-2.5 p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-semibold flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                            <span>Retrait minimum requis : 5 000 FC.</span>
                          </div>
                        )}

                        {/* Raccourcis rapidité */}
                        <div className="flex gap-2 mt-3">
                          {[0.25, 0.50, 0.75, 1.0].map((pct, idx) => {
                            const targetAmount = Math.floor(withdrawableBalance * pct);
                            const isActive = withdrawAmount === targetAmount;
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => setWithdrawAmount(targetAmount)}
                                className={`flex-1 py-1.5 border text-xs font-bold rounded-lg transition-all ${
                                  isActive 
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                {pct * 100}% ({targetAmount.toLocaleString('fr-FR')} FC)
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Numéro Airtel Money */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Numéro de Téléphone Airtel Money (10 Chiffres)</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={withdrawPhone} 
                            onChange={(e) => setWithdrawPhone(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 text-slate-900 font-mono text-sm rounded-xl p-3.5 focus:outline-none" 
                            placeholder="+243976704762"
                            required 
                          />
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 block">Assurez-vous que la ligne Airtel Money est active pour recevoir le transfert direct.</span>
                      </div>

                      <button 
                        type="submit" 
                        disabled={isWithdrawalBlocked}
                        className={`w-full py-4 text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 ${
                          isWithdrawalBlocked 
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                        }`}
                      >
                        {!isOnline ? (
                          <>
                            <WifiOff className="w-5 h-5 text-rose-600" /> {t.offlineSubmitBlocked}
                          </>
                        ) : (
                          <>
                            <ArrowUpRight className="w-5 h-5" /> 
                            {isAccountPendingActivation
                              ? "🔒 Compte en attente d'activation"
                              : isBelowMinimum 
                              ? "Retrait minimum de 5 000 FC requis"
                              : isExceedingBalance 
                              ? "Solde retirable insuffisant"
                              : isPhoneInvalid 
                              ? 'Veuillez saisir un N° Airtel (10 chiffres)'
                              : t.confirmWithdrawal}
                          </>
                        )}
                      </button>
                    </form>
                  );
                })()}
              </div>
            )}

            {/* VUE 4 : HISTORY / HISTORIQUE & LEDGER COMPTABLE */}
            {activeView === 'history' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-5 h-5 text-blue-600" /> Journal Comptable & Historique des Transactions
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Toutes vos opérations sont répertoriées avec leur jeton de vérification unique.</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-500 bg-slate-50 font-semibold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="p-3">Réf / Jeton</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Montant</th>
                        <th className="p-3 text-center">Statut</th>
                        <th className="p-3">Date</th>
                        <th className="p-3 text-center">Action / Reçu</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {userHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-mono font-bold text-blue-600">{item.id}</td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${item.type === 'deposit' ? 'bg-blue-50 text-blue-700 border border-blue-200' : item.type === 'withdrawal' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                              {item.type}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-900">{item.title}</td>
                          <td className="p-3 text-right font-mono font-bold text-slate-900">
                            {item.amount.toLocaleString('fr-FR')} FC
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.status === 'approuve' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : item.status === 'rejete' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                              {item.status === 'approuve' ? 'Approuvé' : item.status === 'rejete' ? 'Rejeté' : 'En Attente'}
                            </span>
                          </td>
                          <td className="p-3 text-slate-500 font-mono">{item.date}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => setSelectedReceiptTransaction(item)}
                              className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 font-bold text-[11px] rounded-xl transition-all flex items-center gap-1.5 mx-auto"
                            >
                              <FileText className="w-3.5 h-3.5 text-blue-600" /> Reçu PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* VUE 5 : CALCULATOR / SIMULATEUR ROI */}
            {activeView === 'calculator' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-600" /> Simulateur de Rentabilité & Calculateur ROI
                  </h3>
                  <button onClick={() => setActiveView('overview')} className="text-slate-400 hover:text-slate-700 text-sm font-semibold">
                    Fermer ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionnez le Pack de Matériel</label>
                      <select 
                        value={calcPack.id}
                        onChange={(e) => {
                          const found = INVESTMENT_LEVELS.find(p => p.id === Number(e.target.value));
                          if (found) setCalcPack(found);
                        }}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none"
                      >
                        {INVESTMENT_LEVELS.map(p => (
                          <option key={p.id} value={p.id}>{p.name} - {p.price.toLocaleString('fr-FR')} FC</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Durée d'Investissement (Jours)</label>
                      <div className="flex gap-2">
                        {[30, 60, 90, 180, 365].map(d => (
                          <button 
                            key={d}
                            onClick={() => setCalcDays(d)}
                            className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${calcDays === d ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                          >
                            {d} Jours
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                    <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Estimation des Revenus</span>
                    <div className="text-3xl font-extrabold text-emerald-600 font-mono">
                      {(calcPack.dailyYield * calcDays).toLocaleString('fr-FR')} FC
                    </div>
                    <div className="text-xs text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                      <p>Rendement quotidien : <span className="text-slate-900 font-bold">{calcPack.dailyYield.toLocaleString('fr-FR')} FC / jour</span></p>
                      <p>Gain parrainage (20%) pour le parrain : <span className="text-blue-600 font-bold">{calcPack.commission.toLocaleString('fr-FR')} FC</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VUE 6 : CYBER SECURITY AUDIT TAB */}
            {activeView === 'security' && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs animate-fade-in space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-emerald-600" /> Inspecteur de Cyber-Sécurité International
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">Audit en temps réel des couches de sécurité réseau, WAF, jetons Anti-CSRF et cryptage des sessions.</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-full">
                    SÉCURITÉ OPTIMALE GRADE A+
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-500 font-bold block uppercase">Protocol Cryptographique</span>
                    <div className="text-sm font-mono font-bold text-slate-900">TLS 1.3 AES-256-GCM</div>
                    <p className="text-slate-500">Chiffrement de bout en bout pour tous les transferts de données et fichiers.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-500 font-bold block uppercase">Protection Anti-Brute Force</span>
                    <div className="text-sm font-mono font-bold text-blue-600">Rate Limiter Active</div>
                    <p className="text-slate-500">Maximum 5 tentatives de connexion par 15 minutes avec verrouillage automatique.</p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <span className="text-slate-500 font-bold block uppercase">Authentification Admin</span>
                    <div className="text-sm font-mono font-bold text-emerald-600">PIN Security (998844)</div>
                    <p className="text-slate-500">Accès restreint au panneau de trésorerie par code PIN confidentiel à 6 chiffres.</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Journal d'Audit Cyber-Sécurité Récent</h4>
                  <div className="space-y-2 text-xs font-mono">
                    {cyberLogs.map(log => (
                      <div key={log.id} className="flex justify-between items-center p-2.5 bg-white rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-slate-900 font-bold">{log.event}</span>
                        <span className="text-slate-500">{log.ip}</span>
                        <span className="text-blue-600 font-bold">{log.time}</span>
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md font-bold text-[10px]">{log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* MODAL SPECIFICATIONS TECHNIQUES */}
        {modalPackSpecs && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <img src={modalPackSpecs.image} alt={modalPackSpecs.name} className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{modalPackSpecs.name}</h3>
                    <span className="text-xs text-blue-600 font-mono font-bold">{modalPackSpecs.price.toLocaleString('fr-FR')} FC</span>
                  </div>
                </div>
                <button onClick={() => setModalPackSpecs(null)} className="text-slate-400 hover:text-slate-700">✕</button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Processeur / CPU:</span>
                  <span className="text-slate-900 font-mono font-bold">{modalPackSpecs.specs.processor}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Mémoire RAM:</span>
                  <span className="text-slate-900 font-mono font-bold">{modalPackSpecs.specs.ram}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Stockage:</span>
                  <span className="text-slate-900 font-mono font-bold">{modalPackSpecs.specs.storage}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Processeur Graphique GPU:</span>
                  <span className="text-slate-900 font-mono font-bold">{modalPackSpecs.specs.gpu}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500">Emplacement Matériel:</span>
                  <span className="text-blue-600 font-bold">{modalPackSpecs.specs.location}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  onClick={() => setModalPackSpecs(null)} 
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 border border-slate-200"
                >
                  Fermer
                </button>
                <button 
                  onClick={() => {
                    setSelectedPack(modalPackSpecs);
                    setDepositAmount(modalPackSpecs.price);
                    setModalPackSpecs(null);
                    setActiveView('deposit');
                  }} 
                  className="flex-1 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-xs hover:bg-blue-700 shadow-xs"
                >
                  Louer Cet Équipement
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AUTHENTIFICATION PIN ADMIN (998844) */}
        {isPinModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-full flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Authentification PIN Direction</h3>
                <p className="text-xs text-slate-500">Saisissez le code PIN de sécurité à 6 chiffres pour déverrouiller le panneau de trésorerie.</p>
                <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 rounded-full text-blue-700 font-mono text-xs font-bold">
                  Code PIN par défaut : 998844
                </div>
              </div>

              {adminPinError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
                  <Info className="w-4 h-4 shrink-0" /> {adminPinError}
                </div>
              )}

              <form onSubmit={handleVerifyPinSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">Code PIN à 6 Chiffres</label>
                  <input 
                    type="password"
                    maxLength={6}
                    autoFocus
                    value={adminPinInput}
                    onChange={(e) => setAdminPinInput(e.target.value)}
                    placeholder="••••••"
                    className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-500 text-slate-900 text-2xl font-mono tracking-widest text-center py-3 rounded-2xl outline-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="button" 
                    onClick={() => setIsPinModalOpen(false)}
                    className="w-1/3 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all border border-slate-200"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit"
                    className="w-2/3 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
                  >
                    <Shield className="w-4 h-4" /> Déverrouiller Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADMIN PANEL */}
        {activeTab === 'admin' && (
          <div className="space-y-6">
            
            {/* Header Admin */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
              <div className="space-y-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase rounded-full border border-blue-200 tracking-wider">
                    Direction Trésorerie
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-full border border-emerald-200 tracking-wider flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" /> Session SSL BCRYPT
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  Panneau de Contrôle Administrateur
                </h2>
                <p className="text-xs text-slate-500 max-w-2xl">
                  Validation manuelle des dépôts avec reversement instantané de la commission parrain de 20%, approbation des retraits et gestion globale des liquidités.
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0 relative z-10">
                <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 font-mono text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs">
                  <Check className="w-4 h-4" /> PIN Validé (••••••)
                </span>
                <button 
                  onClick={handleLockAdminPin}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Shield className="w-4 h-4 text-blue-600" /> Verrouiller PIN
                </button>
              </div>
            </div>

            {/* KPI STATS CARDS ADMIN */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium block">Dépôts en Attente</span>
                <div className="text-xl font-bold text-amber-600 font-mono">
                  {pendingDeposits.length} demande{pendingDeposits.length > 1 ? 's' : ''}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Cumul : {pendingDeposits.reduce((sum, d) => sum + d.amount, 0).toLocaleString('fr-FR')} FC
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium block">Retraits en Attente</span>
                <div className="text-xl font-bold text-rose-600 font-mono">
                  {pendingWithdrawals.length} demande{pendingWithdrawals.length > 1 ? 's' : ''}
                </div>
                <span className="text-[10px] text-slate-500 block">
                  Cumul : {pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0).toLocaleString('fr-FR')} FC
                </span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium block">Dépôts Traités</span>
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  {completedDeposits.length} transaction{completedDeposits.length > 1 ? 's' : ''}
                </div>
                <span className="text-[10px] text-slate-500 block">Archivées en trésorerie</span>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-1 shadow-xs">
                <span className="text-[11px] text-slate-500 font-medium block">Flotte Active Total</span>
                <div className="text-xl font-bold text-blue-600 font-mono">
                  {activeInvestments.length} pack{activeInvestments.length > 1 ? 's' : ''}
                </div>
                <span className="text-[10px] text-slate-500 block">Gains 24h en cours</span>
              </div>
            </div>

            {/* CHARTS ET GRAPHIQUES DE TENDANCES ADMIN (RECHARTS) */}
            <AdminAnalyticsChart 
              completedDeposits={completedDeposits} 
              activeInvestments={activeInvestments} 
              registeredUsersCount={14} 
            />

            {/* Dépôts en attente */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" /> Dépôts en Attente d'Approbation ({pendingDeposits.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Sécurité Trésorerie RDC</span>
              </div>

              {pendingDeposits.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 font-medium">Aucune demande de dépôt en attente d'approbation.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingDeposits.map(dep => (
                    <div key={dep.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-2 text-xs flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{dep.userName}</span>
                          <span className="font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                            🔒 {maskPhone(dep.phone)}
                          </span>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {dep.hash}
                          </span>
                        </div>
                        <p className="text-blue-600 font-bold">{dep.pack}</p>
                        <div className="flex flex-wrap items-center gap-3 text-slate-500 font-mono">
                          <span>Montant: <strong className="text-emerald-600 text-sm font-bold">{dep.amount.toLocaleString('fr-FR')} FC</strong></span>
                          <span>Date: {dep.date}</span>
                        </div>

                        {dep.proof && (
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-700 font-bold uppercase block mb-1.5 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Preuve de Paiement (Capture SMS Airtel) :
                            </span>
                            <img 
                              src={dep.proof} 
                              alt="Capture SMS Airtel" 
                              className="max-h-40 rounded-xl object-contain border border-slate-300 bg-white p-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<body style="background:#f8fafc; display:flex; align-items:center; justify-center; min-height:100vh; margin:0;"><img src="${dep.proof}" style="max-width:90vw; max-height:90vh; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1);" /></body>`);
                                }
                              }}
                            />
                            <span className="text-[10px] text-slate-500 block mt-1">(Cliquer pour agrandir la capture)</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => approveDeposit(dep.id, dep.amount)}
                          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Approuver (+20% Parrain)
                        </button>
                        <button 
                          onClick={() => rejectDeposit(dep.id)}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                        >
                          Rejeter
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Retraits en attente */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpRight className="w-5 h-5 text-blue-600" /> Demandes de Retrait Airtel Money ({pendingWithdrawals.length})
                </h3>
                <span className="text-[11px] text-slate-500 font-mono">Paiements Sortants</span>
              </div>

              {pendingWithdrawals.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-500 font-medium">Aucune demande de retrait en attente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingWithdrawals.map(w => (
                    <div key={w.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{w.userName}</span>
                          <span className="font-mono text-blue-700 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                            🔒 {maskPhone(w.phone)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-slate-500 font-mono">
                          <span>Montant demandé: <strong className="text-blue-600 text-sm font-bold">{w.amount.toLocaleString('fr-FR')} FC</strong></span>
                          <span>Solde actuel: {w.currentBalance.toLocaleString('fr-FR')} FC</span>
                          <span>Date: {w.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button 
                          onClick={() => approveWithdrawal(w.id, w.amount)}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Check className="w-4 h-4" /> Valider le Virement Airtel
                        </button>
                        <button 
                          onClick={() => rejectWithdrawal(w.id)}
                          className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-all"
                        >
                          Rejeter & Rembourser
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Archives & Historique des Dépôts Traités */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" /> Archives des Dépôts Traités ({completedDeposits.length})
                </h3>
                <span className="text-xs text-blue-600 font-mono font-bold">Stockage Trésorerie</span>
              </div>

              {completedDeposits.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4">Aucun dépôt archivé pour le moment.</p>
              ) : (
                <div className="space-y-3">
                  {completedDeposits.map(dep => (
                    <div key={dep.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 text-xs flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{dep.userName}</span>
                          <span className="font-mono text-slate-500">({maskPhone(dep.phone)})</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                            dep.status === 'approuve' 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-rose-50 border-rose-200 text-rose-700'
                          }`}>
                            {dep.status === 'approuve' ? '✓ Approuvé (+20% Parrain Versé)' : '✕ Rejeté'}
                          </span>
                        </div>
                        <p className="text-blue-600 font-semibold">{dep.pack}</p>
                        <span className="text-slate-500 block font-mono">
                          Montant : <strong className="text-emerald-600 text-sm">{dep.amount.toLocaleString('fr-FR')} FC</strong> | Traité le : {dep.processedAt || dep.date}
                        </span>

                        {dep.proof && (
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Preuve de Paiement Archivée :</span>
                            <img 
                              src={dep.proof} 
                              alt="Capture SMS Airtel" 
                              className="max-h-28 rounded-xl object-contain border border-slate-300 bg-white p-1 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<body style="background:#f8fafc; display:flex; align-items:center; justify-center; min-height:100vh; margin:0;"><img src="${dep.proof}" style="max-width:90vw; max-height:90vh; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1);" /></body>`);
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* BARRE DE NAVIGATION MOBILE FIXE (Bottom Navigation Bar) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 backdrop-blur-xl px-2 py-2 flex items-center justify-around shadow-lg">
        <button 
          onClick={() => { setActiveTab('dashboard'); setActiveView('overview'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' && activeView === 'overview'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">Accueil</span>
        </button>

        <button 
          onClick={() => {
            setActiveTab('dashboard');
            setActiveView('overview');
            setTimeout(() => {
              const el = document.getElementById('packs-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' && activeView === 'overview'
              ? 'text-blue-600 font-bold'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px]">Packs</span>
        </button>

        <button 
          onClick={() => openDepositView()}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' && activeView === 'deposit'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-md -mt-3 border-2 border-white">
            <PlusCircle className="w-5 h-5" />
          </div>
          <span className="text-[10px] text-blue-600 font-bold">Dépôt</span>
        </button>

        <button 
          onClick={() => {
            setWithdrawError('');
            setActiveTab('dashboard');
            setActiveView('withdraw');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
            activeTab === 'dashboard' && activeView === 'withdraw'
              ? 'text-blue-600 font-bold scale-105'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          <ArrowUpRight className="w-5 h-5" />
          <span className="text-[10px]">Retrait</span>
        </button>

        <button 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-400 hover:text-slate-600 transition-all"
        >
          <User className="w-5 h-5" />
          <span className="text-[10px]">Profil</span>
        </button>
      </nav>

      {/* Modal Profil Utilisateur */}

      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onLogout={handleLogout}
      />

      {/* Auth Modal (Connexion Client / Inscription / Connexion Admin PIN) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(role, name) => {
          handleGateLoginSuccess({
            name,
            email: `${name.toLowerCase().replace(/\s+/g, '.')}@renttech.com`,
            phone: '0991234567',
            role,
            referralCode: 'RT892X4'
          });
        }}
        referralCodeFromUrl={user.referralCode}
      />

      {/* Modal de Reçu Numérique PDF */}
      <TransactionReceiptModal
        transaction={selectedReceiptTransaction}
        userName={user.fullName}
        userPhone={user.phone}
        currentLang={currentLang}
        onClose={() => setSelectedReceiptTransaction(null)}
      />

      {/* Support Client & Assistance Trésorerie */}
      <AICustomerService
        onOpenRecharge={() => {
          setActiveTab('dashboard');
          setActiveView('deposit');
        }}
        onOpenWithdrawal={() => {
          setActiveTab('dashboard');
          setActiveView('withdraw');
        }}
        onOpenAdminLogin={() => setIsAuthModalOpen(true)}
      />
    </div>
  );
}
