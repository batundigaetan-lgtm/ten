import React, { useState, useEffect } from 'react';
import { BrandLogo } from './BrandLogo';
import { authService } from '../services/authService';
import { 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Users, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles,
  DollarSign
} from 'lucide-react';

export interface StoredUser {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  referralCode: string;
  referredBy?: string;
  balance: number;
  totalInvested: number;
  totalEarned: number;
  role: 'user' | 'admin';
}

interface AuthGateProps {
  onLoginSuccess: (user: { name: string; email: string; phone: string; role: 'user' | 'admin'; referralCode: string; balance?: number }) => void;
}

export const AuthGate: React.FC<AuthGateProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');

  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Register state
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPass, setShowRegPass] = useState(false);
  const [regReferral, setRegReferral] = useState('RT892X4');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');
  const [referralDetectedNotice, setReferralDetectedNotice] = useState('');

  // Auto-detect referral code from URL search/hash params (e.g. ?ref=RT892X4 or #ref=RT892X4) & session storage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let refCodeFromUrl = '';
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('ref')) {
      refCodeFromUrl = searchParams.get('ref') || '';
    } else if (searchParams.has('referral')) {
      refCodeFromUrl = searchParams.get('referral') || '';
    } else if (window.location.hash.includes('ref=')) {
      const match = window.location.hash.match(/ref=([A-Za-z0-9_-]+)/);
      if (match && match[1]) refCodeFromUrl = match[1];
    }

    // Fallback on stored session code if page refreshed
    if (!refCodeFromUrl) {
      refCodeFromUrl = sessionStorage.getItem('renttech_sponsor_ref') || localStorage.getItem('renttech_sponsor_ref') || '';
    }

    if (refCodeFromUrl) {
      const cleanRef = refCodeFromUrl.trim().toUpperCase();
      setRegReferral(cleanRef);
      try {
        sessionStorage.setItem('renttech_sponsor_ref', cleanRef);
        localStorage.setItem('renttech_sponsor_ref', cleanRef);
      } catch (e) {
        console.error(e);
      }
      setReferralDetectedNotice(`Parrain détecté via lien : ${cleanRef} (+3 000 FC Bonus de bienvenue)`);
      setActiveTab('register');
    }
  }, []);

  // Helper local storage database
  const getStoredUsers = (): StoredUser[] => {
    try {
      const data = localStorage.getItem('renttech_registered_users_v2');
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    // Default seed users
    return [
      {
        fullName: 'MYATSI',
        email: 'myatsi@gmail.com',
        phone: '+243976704762',
        password: 'myatsi123',
        referralCode: 'RT892X4',
        balance: 3000,
        totalInvested: 0,
        totalEarned: 0,
        role: 'user'
      }
    ];
  };

  const saveUserToStorage = (newUser: StoredUser) => {
    const existing = getStoredUsers();
    const updated = [newUser, ...existing.filter(u => u.email.toLowerCase() !== newUser.email.toLowerCase())];
    localStorage.setItem('renttech_registered_users_v2', JSON.stringify(updated));
  };

  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 4) score += 30;
    if (/[A-Z]/.test(pass)) score += 30;
    if (/[0-9]/.test(pass)) score += 20;
    if (/[^A-Za-z0-9]/.test(pass)) score += 20;
    return score;
  };

  const strengthScore = getPasswordStrength(regPassword);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginEmail || !loginPassword) {
      setLoginError('Veuillez saisir votre email et votre mot de passe.');
      return;
    }

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPass = loginPassword.trim();

    if (cleanPass.length < 4) {
      setLoginError('Le mot de passe doit contenir au moins 4 chiffres ou caractères.');
      return;
    }

    // Authentification Administrateur Direction
    if ((cleanEmail === 'admin' || cleanEmail === 'admin@renttech.com') && cleanPass === '998844') {
      onLoginSuccess({
        name: 'MYATSI Direction',
        email: 'admin@renttech.com',
        phone: '+243976704762',
        role: 'admin',
        referralCode: 'ADMIN01',
        balance: 0
      });
      return;
    }

    if (cleanEmail === 'admin' || cleanEmail === 'admin@renttech.com') {
      setLoginError('Mot de passe administrateur incorrect.');
      return;
    }

    // Si Supabase est configuré, authentification via Supabase Auth & table profiles
    if (authService.isOnlineBackend()) {
      const res = await authService.signIn(cleanEmail, cleanPass);
      if (res.success && res.user) {
        onLoginSuccess({
          name: res.user.fullName,
          email: res.user.email,
          phone: res.user.phone,
          role: res.user.role,
          referralCode: res.user.referralCode,
          balance: res.user.balance,
        });
        return;
      } else {
        setLoginError(res.error || 'Identifiants invalides ou compte introuvable.');
        return;
      }
    }

    // Mode secours local (si clés Supabase en attente d'injection)
    const allUsers = getStoredUsers();
    const foundUser = allUsers.find(u => u.email.trim().toLowerCase() === cleanEmail);

    if (!foundUser) {
      setLoginError('Aucun compte trouvé avec cet e-mail. Veuillez vérifier l\'adresse ou créer un compte.');
      return;
    }

    if (foundUser.password !== cleanPass) {
      setLoginError('Mot de passe ou code d\'accès incorrect. Veuillez vérifier vos identifiants.');
      return;
    }

    onLoginSuccess({
      name: foundUser.fullName,
      email: foundUser.email,
      phone: foundUser.phone,
      role: 'user',
      referralCode: foundUser.referralCode,
      balance: foundUser.balance !== undefined ? foundUser.balance : 3000
    });
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    if (!regFullName || !regEmail || !regPhone || !regPassword) {
      setRegError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim();
    const cleanPassword = regPassword.trim();

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setRegError('Veuillez fournir une adresse email valide.');
      return;
    }

    if (cleanPassword.length < 4) {
      setRegError('Le mot de passe doit contenir au moins 4 chiffres ou caractères.');
      return;
    }

    if (cleanPassword !== regConfirmPassword.trim()) {
      setRegError('Les mots de passe ne correspondent pas.');
      return;
    }

    const generatedRefCode = 'RT' + Math.floor(100000 + Math.random() * 900000);
    const sponsorCode = regReferral ? regReferral.trim().toUpperCase() : 'RT892X4';

    if (sponsorCode === generatedRefCode) {
      setRegError('Vous ne pouvez pas utiliser votre propre code de parrainage.');
      return;
    }

    // Inscription officielle via Supabase Auth + profiles + wallets
    if (authService.isOnlineBackend()) {
      const res = await authService.signUp({
        fullName: regFullName.trim(),
        email: cleanEmail,
        phone: cleanPhone,
        password: cleanPassword,
        referralCode: generatedRefCode,
        referredBy: sponsorCode,
      });

      if (!res.success) {
        setRegError(res.error || "Erreur lors de l'inscription Supabase.");
        return;
      }

      setRegSuccess('🎉 Compte créé avec succès dans Supabase ! Connexion en cours...');
      setTimeout(() => {
        if (res.user) {
          onLoginSuccess({
            name: res.user.fullName,
            email: res.user.email,
            phone: res.user.phone,
            role: res.user.role,
            referralCode: res.user.referralCode,
            balance: res.user.balance,
          });
        }
      }, 1200);
      return;
    }

    // Mode secours local
    const allUsers = getStoredUsers();
    if (allUsers.some(u => u.email.trim().toLowerCase() === cleanEmail)) {
      setRegError('Un compte existe déjà avec cette adresse e-mail ! Veuillez vous connecter avec votre mot de passe.');
      return;
    }

    const welcomeBonus = 3000;
    const newUserData: StoredUser = {
      fullName: regFullName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      password: cleanPassword,
      referralCode: generatedRefCode,
      referredBy: sponsorCode,
      balance: welcomeBonus,
      totalInvested: 0,
      totalEarned: 0,
      role: 'user'
    };

    saveUserToStorage(newUserData);
    setRegSuccess('🎉 Compte créé avec succès ! Votre espace investisseur est activé.');

    setTimeout(() => {
      onLoginSuccess({
        name: newUserData.fullName,
        email: newUserData.email,
        phone: newUserData.phone,
        role: 'user',
        referralCode: newUserData.referralCode,
        balance: newUserData.balance
      });
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between relative selection:bg-blue-600 selection:text-white">
      
      {/* Header bar */}
      <header className="border-b border-slate-200 bg-white px-6 py-4 flex items-center justify-between shadow-xs z-10">
        <BrandLogo variant="full" size="md" />

        <div className="hidden md:flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Sécurité SSL 256-bit</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 my-auto z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Pitch */}
          <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Fintech Technologique • RDC</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight">
              Investissez dans la technologie. Développez votre potentiel.
            </h2>

            <p className="text-slate-600 text-sm leading-relaxed max-w-xl mx-auto lg:mx-0">
              RentTech Hub RDC vous permet de louer du matériel informatique à haute valeur ajoutée (Core i7, Serveurs Cloud, Datacenters) et d'accumuler des revenus quotidiens en Francs Congolais (CDF). Recevez <strong className="text-blue-600 font-bold">20% de commission parrainage instantanée</strong> sur chaque recharge.
            </p>

            {/* Quick Benefits */}
            <div className="grid grid-cols-2 gap-3 pt-2 text-left">
              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Rendement Journalier</h4>
                  <p className="text-[11px] text-slate-500">Versé sur Airtel Money</p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Parrainage 20%</h4>
                  <p className="text-[11px] text-slate-500">Commission immédiate</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Auth Card */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-slate-200 rounded-3xl shadow-lg overflow-hidden">
              
              {/* Header inside card */}
              <div className="p-6 border-b border-slate-100 text-center bg-slate-50/70 flex flex-col items-center">
                <div className="mb-2">
                  <BrandLogo variant="symbol" size="lg" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Bienvenue sur RentTech Hub</h3>
                <p className="text-xs text-slate-500 mt-0.5">Espace officiel d'investissement & gestion locative</p>
              </div>

              {/* Tabs navigation */}
              <div className="grid grid-cols-2 bg-slate-100 p-1.5 text-xs font-bold border-b border-slate-200">
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setLoginError('');
                  }}
                  className={`py-3 px-2 rounded-xl transition flex items-center justify-center gap-2 ${
                    activeTab === 'login'
                      ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <User className="w-4 h-4" /> Se connecter
                </button>

                <button
                  onClick={() => {
                    setActiveTab('register');
                    setRegError('');
                  }}
                  className={`py-3 px-2 rounded-xl transition flex items-center justify-center gap-2 ${
                    activeTab === 'register'
                      ? 'bg-white text-blue-600 shadow-sm font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4" /> Créer un compte
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6 space-y-4">
                
                {/* 1. CONNEXION */}
                {activeTab === 'login' && (
                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {loginError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> {loginError}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" /> Email ou Identifiant
                      </label>
                      <input
                        type="text"
                        required
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        placeholder="votre.email@exemple.com"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" /> Mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showLoginPass ? 'text' : 'password'}
                          required
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPass(!showLoginPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showLoginPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition"
                    >
                      <ShieldCheck className="w-4 h-4" /> Se connecter
                    </button>

                    <div className="text-center text-xs text-slate-500 pt-2">
                      Vous n'avez pas encore de compte ?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('register')}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        Créer un compte
                      </button>
                    </div>
                  </form>
                )}

                {/* 2. INSCRIPTION */}
                {activeTab === 'register' && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    {referralDetectedNotice && (
                      <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 text-xs rounded-xl flex items-center gap-2 font-medium">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0" /> {referralDetectedNotice}
                      </div>
                    )}

                    {regError && (
                      <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> {regError}
                      </div>
                    )}

                    {regSuccess && (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> {regSuccess}
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-blue-600" /> Nom & Prénom
                      </label>
                      <input
                        type="text"
                        required
                        value={regFullName}
                        onChange={(e) => setRegFullName(e.target.value)}
                        placeholder="MYATSI"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-blue-600" /> Email
                        </label>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="myatsi@gmail.com"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-blue-600" /> Tél Airtel
                        </label>
                        <input
                          type="text"
                          required
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="+243976704762"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-blue-600" /> Mot de passe
                      </label>
                      <div className="relative">
                        <input
                          type={showRegPass ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegPass(!showRegPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showRegPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {regPassword && (
                        <div className="mt-1">
                          <div className="h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${
                                strengthScore < 40 ? 'bg-rose-500 w-1/3' : strengthScore < 70 ? 'bg-amber-500 w-2/3' : 'bg-emerald-500 w-full'
                              }`}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Confirmer le mot de passe</label>
                      <input
                        type="password"
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:bg-white transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Code Parrain (Bonus 20% sur recharges)
                      </label>
                      <input
                        type="text"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value)}
                        placeholder="RT892X4"
                        className="w-full bg-blue-50 border border-blue-200 rounded-xl px-3.5 py-2 text-xs text-blue-900 font-mono font-bold focus:outline-none focus:border-blue-600"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition mt-2"
                    >
                      <Users className="w-4 h-4" /> S'inscrire & Accéder à la Plateforme
                    </button>
                  </form>
                )}

              </div>

              {/* Footer inside card */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 text-center text-[11px] text-slate-500">
                Protégé par cryptage SSL 256-bit • RDC
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Footer bar */}
      <footer className="border-t border-slate-200 bg-white p-4 text-center text-xs text-slate-500 z-10">
        RentTech Hub © 2026 RDC • Plateforme sécurisée • Tous droits réservés
      </footer>

    </div>
  );
};
