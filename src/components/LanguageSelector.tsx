import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { LANGUAGES, SupportedLanguage, LanguageOption } from '../i18n';

interface LanguageSelectorProps {
  currentLang: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLang,
  onLanguageChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeOption = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-2 shadow-sm transition-all duration-200"
      >
        <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
        <span className="text-base leading-none">{activeOption.flag}</span>
        <span className="hidden sm:inline font-mono">{activeOption.code.toUpperCase()}</span>
        <span className="sm:hidden font-medium">{activeOption.nativeName}</span>
        <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          <div className="p-2.5 bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-blue-700 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" /> Langues RDC & Intl
            </span>
            <span className="text-[10px] text-slate-500 font-normal">6 Langues</span>
          </div>

          <div className="p-1.5 max-h-72 overflow-y-auto space-y-1">
            {LANGUAGES.map((lang: LanguageOption) => {
              const isSelected = lang.code === currentLang;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 font-extrabold border border-blue-200'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg leading-none">{lang.flag}</span>
                    <div className="text-left">
                      <div className="font-bold leading-tight">{lang.nativeName}</div>
                      <div className="text-[10px] text-slate-500">{lang.region}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="p-2 bg-slate-50 border-t border-slate-100 text-[10px] text-center text-slate-500">
            🇨🇩 Traduction automatique des 4 langues nationales RDC
          </div>
        </div>
      )}
    </div>
  );
};
