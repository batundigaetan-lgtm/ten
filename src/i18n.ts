export type SupportedLanguage = 'fr' | 'ln' | 'sw' | 'ts' | 'kg' | 'en';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  region: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'fr', name: 'Français', nativeName: 'Français', flag: '🇫🇷', region: 'RDC (Officiel)' },
  { code: 'ln', name: 'Lingala', nativeName: 'Lingála', flag: '🇨🇩', region: 'Kinshasa & Ouest' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', flag: '🇨🇩', region: 'Est & Katanga' },
  { code: 'ts', name: 'Tshiluba', nativeName: 'Cilubà', flag: '🇨🇩', region: 'Espace Kasaï' },
  { code: 'kg', name: 'Kikongo', nativeName: 'Kikongo ya Leta', flag: '🇨🇩', region: 'Kongo Central & Bandundu' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'International' },
];

export const translations: Record<SupportedLanguage, Record<string, string>> = {
  fr: {
    // Navigation
    overview: "Vue d'ensemble",
    deposit: "Recharger Airtel",
    withdraw: "Retirer Solde",
    myPacks: "Mes Packs Actifs",
    history: "Historique",
    team: "Mon Équipe & Parrainage",
    
    // Header & Badges
    onlineProtection: "Cryptage SSL 256-bit",
    airtelNumber: "N° Officiel Airtel Money",
    login: "Connexion",
    logout: "Déconnexion",
    myAccount: "Mon Compte",
    adminSpace: "Espace Admin",
    selectLanguage: "Langue",

    // Solde Cards
    availableBalance: "Solde Disponible",
    totalInvested: "Total Investi en Matériel",
    referralCommission: "Commission Parrainage (20%)",
    rechargeBtn: "Recharger",
    withdrawBtn: "Retirer",
    instantPayment: "Paiement Mobile Airtel Money Instantané",

    // Chart Section
    chartTitle: "Tendance des Gains Cumulés (30 Derniers Jours)",
    chartSubtitle: "Évolution quotidienne de votre rendement locatif + commissions de parrainage",
    chartDailyYield: "Gain Quotidien",
    chartCumulativeTotal: "Cumul Total",
    chartDate: "Date",
    chartAmount: "Montant (FC)",

    // Packs section
    investmentPacks: "Packs de Location Informatique High-Tech",
    packsSubtitle: "Louez des équipements serveurs et ordinateurs de pointe et percevez un rendement journalier automatisé.",
    allCategories: "Toutes Catégories",
    investRecharge: "Investir / Recharger",
    techSpecs: "Spécifications Tech",
    dailyReturn: "Rendement estimé",
    sponsorshipGain: "Gain Parrainage (20%)",
    stockAvailable: "Dispo",

    // Customer Service & Modals
    customerService: "Support Client RentTech",
    referralBonusAlert: "Bonus de 20% sur chaque dépôt effectué par votre filleul !",

    // Withdrawal validation
    insufficientBalanceTitle: "Solde insuffisant !",
    insufficientBalanceDesc: "Le montant saisi dépasse votre solde disponible.",
    minWithdrawalAlert: "Le montant minimum de retrait est de 5 000 FC.",
    blockedBtnInsufficient: "Bouton Bloqué : Solde Insuffisant",
    blockedBtnMinAmount: "Bouton Bloqué : Min 5 000 FC",
    confirmWithdrawal: "Confirmer la Demande de Retrait",

    // Network connectivity status
    offlineTitle: "Connexion Internet Interrompue (Hors-Ligne)",
    offlineBannerDesc: "Vos opérations et soumissions de formulaires sont temporairement sécurisées et bloquées jusqu'au rétablissement du réseau.",
    offlineSubmitBlocked: "Formulaire Désactivé : Vous êtes hors-ligne",
    onlineRestored: "Connexion rétablie ! Vous êtes de nouveau connecté au réseau."
  },
  ln: {
    // Lingala
    overview: "Kotala Nsango",
    deposit: "Bakisa Mbongo Airtel",
    withdraw: "Bimisa Mbongo",
    myPacks: "Ba Packs na Nga",
    history: "Makambo eleki",
    team: "Ekipi & Parrainage",

    onlineProtection: "Bateli makasi SSL 256-bit",
    airtelNumber: "Nombro Airtel Money",
    login: "Kótá na Compte",
    logout: "Bima",
    myAccount: "Compte na nga",
    adminSpace: "Esika ya Admin",
    selectLanguage: "Lokóta",

    availableBalance: "Mbongo Etikali na Koti",
    totalInvested: "Mbongo Otyi na Ba Appareils",
    referralCommission: "Komiṣó ya Parrainage (20%)",
    rechargeBtn: "Bakisa Mbongo",
    withdrawBtn: "Bimisa",
    instantPayment: "Kofuta Pambala na Airtel Money",

    chartTitle: "Tendance ya Mbongo Ozwi (Mibeko 30 ya Suka)",
    chartSubtitle: "Koliya ya mbongo mokolo na mokolo na ba commissions ya ekipi",
    chartDailyYield: "Gain ya Mokolo",
    chartCumulativeTotal: "Total ya Mbongo",
    chartDate: "Mokolo",
    chartAmount: "Montant (FC)",

    investmentPacks: "Ba Packs ya Location ya Ba Ordinateurs",
    packsSubtitle: "Luta ba ordinatɛrɛ mpe ba serveurs ya makasi pona kozwa mbongo mokolo na mokolo.",
    allCategories: "Ba Katégories Nyonso",
    investRecharge: "Kotya Mbongo / Bakisa",
    techSpecs: "Détails ya Appareil",
    dailyReturn: "Mbongo ya Mokolo",
    sponsorshipGain: "Bonus Parrainage (20%)",
    stockAvailable: "Ezali",

    customerService: "Lisungi ya Client RentTech",
    referralBonusAlert: "Zwa bonus ya 20% tango moto osepeli akoti mbongo !",

    insufficientBalanceTitle: "Mbongo ekoki te !",
    insufficientBalanceDesc: "Mbongo otyi eleki mbongo ezali na koti na yo.",
    minWithdrawalAlert: "Mbongo ya moke koleka mpo na kobimisa ezali 5 000 FC.",
    blockedBtnInsufficient: "Bouton ekangami : Mbongo Ekoki Te",
    blockedBtnMinAmount: "Bouton ekangami : Minimum 5 000 FC",
    confirmWithdrawal: "Kondima Kobimisa Mbongo",

    // Network connectivity status
    offlineTitle: "Reseau ya Internet Ekatanami (Hors-Ligne)",
    offlineBannerDesc: "Makambo na yo ezali na libateli. Baza kokengela te mbongo okota to obimisa soki reseau ezongi te.",
    offlineSubmitBlocked: "Formulaire Ekangami : Ozali hors-ligne",
    onlineRestored: "Reseau ezongi ! Ozali lisusu na internet."
  },
  sw: {
    // Kiswahili
    overview: "Muhtasari wa Akunti",
    deposit: "Weka Pesa Airtel",
    withdraw: "Toa Pesa",
    myPacks: "Packs Zangu",
    history: "Kumbukumbu",
    team: "Timu Yangu & Rufaa",

    onlineProtection: "Ulinzi Thabiti SSL 256-bit",
    airtelNumber: "Namba Rasmi Airtel Money",
    login: "Ingia Akunti",
    logout: "Toka",
    myAccount: "Akunti Yangu",
    adminSpace: "Eneo la Admin",
    selectLanguage: "Lugha",

    availableBalance: "Salio Lililopo",
    totalInvested: "Jumla Iliyowekwa Vifaa",
    referralCommission: "Komisheni ya Rufaa (20%)",
    rechargeBtn: "Weka Pesa",
    withdrawBtn: "Toa Pesa",
    instantPayment: "Malipo ya Papo Hapo Airtel Money",

    chartTitle: "Mwenendo wa Mapato (Siku 30 Zilizopita)",
    chartSubtitle: "Kukua kwa mapato ya kila siku pamoja na komisheni za mialiko",
    chartDailyYield: "Pato la Siku",
    chartCumulativeTotal: "Jumla Yote",
    chartDate: "Tarehe",
    chartAmount: "Kiasi (FC)",

    investmentPacks: "Packs za Kukodisha Vifaa vya Teknolojia",
    packsSubtitle: "Kodi kompyuta na ma-server ya kisasa upate faida kila siku kwa urahisi.",
    allCategories: "Aina Zote",
    investRecharge: "Weka Pesa / Kodisha",
    techSpecs: "Maelezo ya Kifaa",
    dailyReturn: "Faida kwa Siku",
    sponsorshipGain: "Bonus ya Rufaa (20%)",
    stockAvailable: "Zilizopo",

    customerService: "Huduma kwa Wateja RentTech",
    referralBonusAlert: "Pata komisheni ya 20% wakati wowote rafiki yako anapoweka pesa!",

    insufficientBalanceTitle: "Salio halitoshi!",
    insufficientBalanceDesc: "Kiasi ulichoweka kinazidi salio lako lililopo.",
    minWithdrawalAlert: "Kiasi cha chini cha kutoa ni 5 000 FC.",
    blockedBtnInsufficient: "Kitufe Kimefungwa : Salio Halitoshi",
    blockedBtnMinAmount: "Kitufe Kimefungwa : Kiwango cha Chini 5 000 FC",
    confirmWithdrawal: "Thibitisha Ombi la Kutoa Pesa",

    // Network connectivity status
    offlineTitle: "Muunganisho wa Intaneti Umekatika (Nje ya Mtandao)",
    offlineBannerDesc: "Fomu zote zimefungwa kwa muda ili kulinda data yako hadi mtandao urudi.",
    offlineSubmitBlocked: "Fomu Imefungwa : Uko Nje ya Mtandao",
    onlineRestored: "Mtandao Umerudi! Umeunganishwa tena."
  },
  ts: {
    // Tshiluba
    overview: "Kumenya Dîba",
    deposit: "Kuela Makuta Airtel",
    withdraw: "Kupatula Makuta",
    myPacks: "Ma Packs Manyi",
    history: "Bualu Bualu",
    team: "Tshisumbu & Kupāna Code",

    onlineProtection: "Bukole bua SSL 256-bit",
    airtelNumber: "Numba ya Airtel Money",
    login: "Kubuela na Akunti",
    logout: "Kupatuka",
    myAccount: "Akunti Wanyi",
    adminSpace: "Muaba wa Admin",
    selectLanguage: "Muakulu",

    availableBalance: "Makuta Adi mu Akunti",
    totalInvested: "Makuta Matele mu Bintu",
    referralCommission: "Difutu diabu ya Code (20%)",
    rechargeBtn: "Kuela Makuta",
    withdrawBtn: "Kupatula",
    instantPayment: "Kufuta Mutshi Airtel Money Lukasa",

    chartTitle: "Didunda dia Makuta (Matuku 30 Makole)",
    chartSubtitle: "Didiundulu dia makuta a matuku onso ne diambuluisha dia bantu bebe",
    chartDailyYield: "Difutu dia Dituku",
    chartCumulativeTotal: "Bionso mu Tshisumbu",
    chartDate: "Dituku",
    chartAmount: "Bungi (FC)",

    investmentPacks: "Ma Packs a Kukodisha Biwoma biampianyi",
    packsSubtitle: "Sumba ma ordinatɛrɛ ne ma serveurs bua kupeta makuta matuku onso.",
    allCategories: "Mishindu Yonso",
    investRecharge: "Kuela Makuta / Kusumba",
    techSpecs: "Bualu bua Ciwoma",
    dailyReturn: "Makuta a Dituku",
    sponsorshipGain: "Difutu ya Parrainage (20%)",
    stockAvailable: "Bidi mu Tshibutelu",

    customerService: "Bwambuluishi Bua Bangenda RentTech",
    referralBonusAlert: "Peta 20% ya bupite pa muanda wa muntu uwudi mubikile !",

    insufficientBalanceTitle: "Makuta ki makumbane te!",
    insufficientBalanceDesc: "Bungi budi bufunda budi buvite makuta adi mu akunti.",
    minWithdrawalAlert: "Bungi buakese bua kupatula buideshi 5 000 FC.",
    blockedBtnInsufficient: "Tshifungi Ntshikanga : Makuta Ki Makumbane",
    blockedBtnMinAmount: "Tshifungi Ntshikanga : Minimum 5 000 FC",
    confirmWithdrawal: "Jadika Dilomba dia Kupatula Makuta",

    // Network connectivity status
    offlineTitle: "Tshilonda tshianga Internet Ntshikosoke (Hors-Ligne)",
    offlineBannerDesc: "Malomba ne mifundu mionso njikanga mpo na kukuba makuta mebe to ne bimane bionso bitangila internet bipingane.",
    offlineSubmitBlocked: "Mufundu Mutshikosoke : Udi Hors-Ligne",
    onlineRestored: "Internet Wapinganyi! Udi kabidi mu tshisumbu."
  },
  kg: {
    // Kikongo ya Leta
    overview: "Monisa Mambu",
    deposit: "Tulula Mbongo Airtel",
    withdraw: "Bimisa Mbongo",
    myPacks: "Ba Packs ya Mono",
    history: "Mambu ya Ntuama",
    team: "Kimvuka & Kupana Code",

    onlineProtection: "Lutaninu SSL 256-bit",
    airtelNumber: "Numero ya Airtel Money",
    login: "Kota na Compte",
    logout: "Basika",
    myAccount: "Compte ya Mono",
    adminSpace: "Kisika ya Admin",
    selectLanguage: "Ndinga",

    availableBalance: "Mbongo ya Me Bikana",
    totalInvested: "Mbongo ya Tulamaka",
    referralCommission: "Matabisi ya Parrainage (20%)",
    rechargeBtn: "Tulula Mbongo",
    withdrawBtn: "Bimisa",
    instantPayment: "Kufuta Na Airtel Money Kukonda Nsuka",

    chartTitle: "Lugilu ya Mbongo (Bubu na Bilumbu 30)",
    chartSubtitle: "Ntombono ya mbongo konso kilumbu na matabisi ya banduku",
    chartDailyYield: "Mbongo ya Kilumbu",
    chartCumulativeTotal: "Mbongo Yonsono",
    chartDate: "Kilumbu",
    chartAmount: "Ntalu (FC)",

    investmentPacks: "Ba Packs ya Location ya Ba Ordinatere",
    packsSubtitle: "Luta baserveurs na bamashini Sambu na kubaka mbongo konso kilumbu.",
    allCategories: "Mutindu Yonsono",
    investRecharge: "Tulula Mbongo / Luta",
    techSpecs: "Mambu ya Kimashini",
    dailyReturn: "Mbongo ya Kilumbu",
    sponsorshipGain: "Matabisi Parrainage (20%)",
    stockAvailable: "Kele Vana",

    customerService: "Lusadisu lwa Basumbi RentTech",
    referralBonusAlert: "Baka 20% ya mbongo Ntangu nduku na nge ta tulula mbongo !",

    insufficientBalanceTitle: "Mbongo me fwana ve!",
    insufficientBalanceDesc: "Mbongo ya nge me sonika me luta mbongo ya kele na compte.",
    minWithdrawalAlert: "Mbongo ya fioti mpenza ya kubimisa kele 5 000 FC.",
    blockedBtnInsufficient: "Bouton me kangama : Mbongo me fwana ve",
    blockedBtnMinAmount: "Bouton me kangama : Minimum 5 000 FC",
    confirmWithdrawal: "Ndimisa Nsiku ya Kubimisa Mbongo",

    // Network connectivity status
    offlineTitle: "Internet Me Zenga (Hors-Ligne)",
    offlineBannerDesc: "Bonsono ya nge kele na lutaninu. Mafomu me kangama tii kuna internet ta vutuka.",
    offlineSubmitBlocked: "Formulaire Me Kangama : Nge kele Hors-Ligne",
    onlineRestored: "Internet Me Vutuka! Nge kele diaka na reseau."
  },
  en: {
    // English
    overview: "Overview",
    deposit: "Recharge Airtel",
    withdraw: "Withdraw Balance",
    myPacks: "My Active Packs",
    history: "History",
    team: "My Team & Referral",

    onlineProtection: "SSL 256-bit Encryption",
    airtelNumber: "Official Airtel Money No.",
    login: "Login",
    logout: "Logout",
    myAccount: "My Account",
    adminSpace: "Admin Panel",
    selectLanguage: "Language",

    availableBalance: "Available Balance",
    totalInvested: "Total Invested in Hardware",
    referralCommission: "Referral Commission (20%)",
    rechargeBtn: "Recharge",
    withdrawBtn: "Withdraw",
    instantPayment: "Instant Airtel Mobile Money Payment",

    chartTitle: "Cumulative Earnings Trend (Last 30 Days)",
    chartSubtitle: "Daily rental yields evolution combined with referral bonuses",
    chartDailyYield: "Daily Earnings",
    chartCumulativeTotal: "Cumulative Total",
    chartDate: "Date",
    chartAmount: "Amount (FC)",

    investmentPacks: "High-Tech Hardware Rental Packs",
    packsSubtitle: "Rent high-performance computer servers and hardware to receive daily automated yields.",
    allCategories: "All Categories",
    investRecharge: "Invest / Recharge",
    techSpecs: "Tech Specs",
    dailyReturn: "Estimated Daily Return",
    sponsorshipGain: "Referral Bonus (20%)",
    stockAvailable: "Stock",

    customerService: "RentTech Customer Support",
    referralBonusAlert: "Get 20% instant bonus on every deposit made by your referrals!",

    insufficientBalanceTitle: "Insufficient Balance!",
    insufficientBalanceDesc: "The entered amount exceeds your available balance.",
    minWithdrawalAlert: "Minimum withdrawal amount is 5,000 FC.",
    blockedBtnInsufficient: "Button Blocked: Insufficient Balance",
    blockedBtnMinAmount: "Button Blocked: Min 5,000 FC",
    confirmWithdrawal: "Confirm Withdrawal Request",

    // Network connectivity status
    offlineTitle: "Internet Connection Lost (Offline)",
    offlineBannerDesc: "Form submissions and operations are temporarily locked to protect your data until connectivity is restored.",
    offlineSubmitBlocked: "Form Disabled: You are offline",
    onlineRestored: "Connection Restored! You are back online."
  }
};
