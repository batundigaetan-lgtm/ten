import React, { useState, useRef, useEffect } from 'react';
import { 
  Headphones, 
  Send, 
  X, 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Copy, 
  Check, 
  ShieldCheck, 
  Zap, 
  Phone, 
  ThumbsUp, 
  ThumbsDown,
  Sparkles
} from 'lucide-react';

interface Message {
  id: string;
  sender: 'user' | 'support';
  text: string;
  timestamp: string;
  actionType?: 'recharge' | 'withdraw' | 'admin' | 'packs';
}

interface AICustomerServiceProps {
  onOpenRecharge?: () => void;
  onOpenWithdrawal?: () => void;
  onOpenAdminLogin?: () => void;
}

export const AICustomerService: React.FC<AICustomerServiceProps> = ({
  onOpenRecharge,
  onOpenWithdrawal,
  onOpenAdminLogin,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'support',
      text: "👋 **Bonjour et bienvenue chez RentTech Hub !**\n\nBienvenue sur l'espace d'assistance officielle de RentTech Hub. Notre équipe est à votre disposition pour vous guider concernant :\n\n- 📲 **Recharges & Approvisionnements Airtel Money**\n- 🎁 **Vos 20% de commission de parrainage instantanée**\n- 💻 **Les 8 Niveaux de Packs de location informatique**\n- 💸 **Les demandes de retrait de vos gains** (seuil min : 5 000 FC)\n- 🔐 **La sécurité de votre compte et de vos données**\n\nComment pouvons-nous vous assister aujourd'hui ?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const [hasUnread, setHasUnread] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "Comment recharger mon solde par Airtel Money ?",
    "Comment fonctionne la commission de parrainage 20% ?",
    "Quels sont les 8 Niveaux de Packs disponibles ?",
    "Comment effectuer un retrait (seuil 5 000 FC) ?",
    "Comment mes fonds et données sont-ils protégés ?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasUnread(false);
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsgId = Date.now().toString();
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error('Erreur de serveur');
      }

      const data = await response.json();
      
      // Determine action triggers based on keywords
      let actionType: 'recharge' | 'withdraw' | 'admin' | 'packs' | undefined;
      const lowerQuery = query.toLowerCase();
      if (lowerQuery.includes('recharg') || lowerQuery.includes('dépôt') || lowerQuery.includes('payer')) {
        actionType = 'recharge';
      } else if (lowerQuery.includes('retrait') || lowerQuery.includes('retirer')) {
        actionType = 'withdraw';
      }

      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        text: data.reply || "Bonjour, nous traitons votre requête. Vous pouvez également consulter notre foire aux questions ou réitérer votre demande.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionType,
      };

      setMessages((prev) => [...prev, supportMsg]);
    } catch {
      // Local fallback in case server endpoint has network delay
      const fallbackText = "Bonjour, voici les informations directes du Support RentTech Hub :\n\n- **Numéro officiel Airtel Money** : `+243976704762` (**MYATSI**)\n- **Recharge min** : 5 000 FC\n- **Parrainage** : 20% de commission instantanée sur tous les dépôts de vos filleuls\n- **Retraits** : Traitement par Airtel Money à partir de 5 000 FC\n- **Sécurité** : Transactions cryptées SSL 256-bit et protection renforcée.";
      
      const supportMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, supportMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeak = (id: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/`/g, '')
      .replace(/#/g, '')
      .replace(/\[/g, '')
      .replace(/\]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);

    setSpeakingId(id);
    window.speechSynthesis.speak(utterance);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'up' | 'down') => {
    setFeedback((prev) => ({ ...prev, [id]: type }));
  };

  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith('-');
      const formattedLine = isBullet ? line.trim().substring(1).trim() : line;

      const parts = formattedLine.split(/(\*\*.*?\*\*|`.*?`)/g);
      const renderedParts = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={pIdx} className="text-blue-900 font-bold">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={pIdx} className="bg-slate-100 text-blue-700 px-1.5 py-0.5 rounded border border-slate-200 text-xs font-mono font-semibold">{part.slice(1, -1)}</code>;
        }
        return part;
      });

      return (
        <div key={idx} className={`${isBullet ? 'flex items-start gap-2 my-1 ml-1' : 'my-0.5'}`}>
          {isBullet && <span className="text-blue-600 font-bold mt-0.5">•</span>}
          <div>{renderedParts}</div>
        </div>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group bg-slate-900 hover:bg-slate-800 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-700/80 transition-all duration-300 hover:scale-105 active:scale-95 flex items-center gap-3 font-semibold"
          aria-label="Support Client RentTech"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Headphones className="w-4 h-4" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-bold tracking-tight text-white">Support Client</span>
            <span className="block text-[10px] text-emerald-400 font-medium">Disponible 24/7</span>
          </div>

          {hasUnread && !isOpen && (
            <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md border-2 border-slate-900">
              Direct
            </span>
          )}
        </button>
      </div>

      {/* Chat Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[420px] max-h-[620px] h-[82vh] bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-300">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-blue-950 p-4 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-sm">
                <Headphones className="w-5 h-5 text-blue-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-white text-sm tracking-wide">Support Client RentTech</h3>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Direct
                  </span>
                </div>
                <p className="text-slate-300 text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Trésorerie & Assistance RDC
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition"
              aria-label="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-2xl ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-sm'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-tl-none shadow-xs'
                  }`}
                >
                  <div className="leading-relaxed text-xs text-slate-800">
                    {renderFormattedText(msg.text)}
                  </div>

                  {/* Contextual Action Button */}
                  {msg.actionType === 'recharge' && onOpenRecharge && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenRecharge();
                      }}
                      className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Effectuer une Recharge
                    </button>
                  )}

                  {msg.actionType === 'withdraw' && onOpenWithdrawal && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenWithdrawal();
                      }}
                      className="mt-3 w-full bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs border border-slate-300 transition"
                    >
                      <Zap className="w-3.5 h-3.5 text-blue-600" /> Demande de Retrait
                    </button>
                  )}

                  {msg.actionType === 'admin' && onOpenAdminLogin && (
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        onOpenAdminLogin();
                      }}
                      className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-xl flex items-center justify-center gap-2 text-xs transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Connexion Direction
                    </button>
                  )}

                  {/* Controls footer for support messages */}
                  {msg.sender === 'support' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-400">
                      <span>{msg.timestamp}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => toggleSpeak(msg.id, msg.text)}
                          className={`p-1 rounded hover:bg-slate-100 transition ${
                            speakingId === msg.id ? 'text-blue-600 animate-pulse' : 'text-slate-400'
                          }`}
                          title="Écouter la réponse"
                        >
                          {speakingId === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        </button>

                        <button
                          onClick={() => copyToClipboard(msg.id, msg.text)}
                          className="p-1 rounded hover:bg-slate-100 text-slate-400 transition"
                          title="Copier le texte"
                        >
                          {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>

                        <div className="h-3 w-[1px] bg-slate-200 mx-0.5"></div>

                        <button
                          onClick={() => handleFeedback(msg.id, 'up')}
                          className={`p-1 rounded hover:bg-slate-100 transition ${
                            feedback[msg.id] === 'up' ? 'text-emerald-600' : 'text-slate-400'
                          }`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'down')}
                          className={`p-1 rounded hover:bg-slate-100 transition ${
                            feedback[msg.id] === 'down' ? 'text-rose-600' : 'text-slate-400'
                          }`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-slate-700 bg-white p-3 rounded-2xl w-fit border border-slate-200 shadow-xs">
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs font-medium text-slate-600">Un conseiller prépare votre réponse...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          <div className="p-2.5 bg-white border-t border-slate-150 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            <MessageSquare className="w-3.5 h-3.5 text-blue-600 flex-shrink-0 ml-1" />
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 hover:border-blue-300 px-3 py-1 rounded-full transition text-[11px] font-medium shadow-2xs"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question à notre assistance..."
                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-blue-600 focus:bg-white placeholder-slate-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl font-bold transition disabled:opacity-40 shadow-sm flex-shrink-0"
                aria-label="Envoyer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="mt-1.5 text-center text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-600" /> Support Client & Trésorerie • RentTech Hub RDC
            </div>
          </div>

        </div>
      )}
    </>
  );
};
