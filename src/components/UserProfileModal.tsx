import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Copy, 
  Check, 
  LogOut, 
  Award, 
  Sparkles, 
  Wallet, 
  TrendingUp, 
  Users,
  QrCode,
  ShieldAlert
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: {
    fullName?: string;
    email?: string;
    phone?: string;
    role?: 'user' | 'admin';
    balance?: number;
    totalEarned?: number;
    referralCode?: string;
  };
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userRole?: 'user' | 'admin';
  balance?: number;
  totalEarned?: number;
  referralCode?: string;
  onLogout: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  userName: propUserName,
  userEmail: propUserEmail,
  userPhone: propUserPhone,
  userRole: propUserRole,
  balance: propBalance,
  totalEarned: propTotalEarned,
  referralCode: propReferralCode,
  onLogout
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const name = user?.fullName || propUserName || 'Investisseur RentTech';
  const email = user?.email || propUserEmail || 'investisseur@renttech.com';
  const phone = user?.phone || propUserPhone || '+243976704762';
  const role = user?.role || propUserRole || 'user';
  const walletBalance = user?.balance !== undefined ? user.balance : (propBalance !== undefined ? propBalance : 3000);
  const earnedTotal = user?.totalEarned !== undefined ? user.totalEarned : (propTotalEarned !== undefined ? propTotalEarned : 0);
  const refCode = user?.referralCode || propReferralCode || 'RT892X4';

  const referralUrl = `https://renttech-hub.com/register.php?ref=${refCode}`;

  const copyCode = () => {
    navigator.clipboard.writeText(refCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col">
        
        {/* Header avec Avatar */}
        <div className="relative bg-slate-50 p-6 border-b border-slate-100 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-100 rounded-full transition border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative inline-block mb-3">
            <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-blue-500/20">
              {name.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow border-2 border-white">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>

          <h2 className="text-lg font-bold text-slate-900">{name}</h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">{email}</p>

          <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[11px] font-bold">
            <Award className="w-3.5 h-3.5 text-blue-600" />
            {role === 'admin' ? 'Administrateur Trésorerie' : 'Investisseur VIP'}
          </div>
        </div>

        {/* Dynamic Financial Overview Cards */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-blue-600" /> Solde Disponible
              </span>
              <p className="text-base font-extrabold text-blue-600 mt-1">
                {walletBalance.toLocaleString('fr-FR')} FC
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Gains Totaux
              </span>
              <p className="text-base font-extrabold text-emerald-600 mt-1">
                {earnedTotal.toLocaleString('fr-FR')} FC
              </p>
            </div>
          </div>

          {/* User Information Grid */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Coordonnées du Compte</h4>
            
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> Adresse Email :
              </span>
              <span className="text-slate-900 font-medium">{email}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Airtel Money :
              </span>
              <span className="text-slate-900 font-mono font-bold">{phone}</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Sécurité :
              </span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                SSL BCRYPT 256-bit
              </span>
            </div>
          </div>

          {/* Referral Link Box (Commission 20%) */}
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Mon Code Parrain (Bonus 20%)
              </span>
              <span className="text-[10px] bg-blue-600 text-white font-mono px-2 py-0.5 rounded font-bold">
                {refCode}
              </span>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed">
              Partagez votre lien. Dès qu'un filleul s'inscrit et recharge son compte, vous recevez <strong className="text-blue-700 font-bold">20% de commission instantanée</strong> !
            </p>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-[11px] text-slate-700 font-mono focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0 shadow-sm"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-sm"
          >
            <LogOut className="w-4 h-4 text-rose-600" /> Déconnecter mon compte
          </button>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 p-3.5 border-t border-slate-100 text-center text-[10px] text-slate-500">
          Session sécurisée : SSL-{phone || '+243976704762'}
        </div>

      </div>
    </div>
  );
};
