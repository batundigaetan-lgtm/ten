import React, { useState, useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { TrendingUp, Sparkles, Calendar, DollarSign, ArrowUpRight } from 'lucide-react';
import { translations, SupportedLanguage } from '../i18n';

interface EarningsChartProps {
  currentLang: SupportedLanguage;
  totalInvested: number;
  totalEarned: number;
  userBalance: number;
}

export const EarningsChart: React.FC<EarningsChartProps> = ({
  currentLang,
  totalInvested,
  totalEarned,
  userBalance,
}) => {
  const [timeRange, setTimeRange] = useState<'7' | '15' | '30'>('30');
  const t = translations[currentLang] || translations.fr;

  // Generate 30 days of data based on current balance and investment
  const chartData = useMemo(() => {
    const days = 30;
    const data = [];
    const baseDailyYield = Math.max(1200, Math.round(totalInvested * 0.08) || 3500);
    const today = new Date();

    let accumulated = Math.max(5000, userBalance - (baseDailyYield * 15));
    if (accumulated < 0) accumulated = 5000;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      const dayName = date.toLocaleDateString(currentLang === 'en' ? 'en-US' : 'fr-FR', {
        day: '2-digit',
        month: 'short',
      });

      // Variance simulating real daily activity & referral bumps
      const randomMultiplier = 0.85 + Math.random() * 0.35;
      const isReferralDay = i % 4 === 0 && i > 0;
      const referralBonus = isReferralDay ? Math.round(totalEarned * 0.1) : 0;
      
      const dailyYield = Math.round(baseDailyYield * randomMultiplier) + referralBonus;
      accumulated += dailyYield;

      data.push({
        dateStr: dayName,
        dayNumber: 30 - i,
        dailyYield: dailyYield,
        cumulativeEarnings: accumulated,
      });
    }

    return data;
  }, [totalInvested, userBalance, totalEarned, currentLang]);

  // Filtered data based on selected time range
  const filteredData = useMemo(() => {
    const range = parseInt(timeRange, 10);
    return chartData.slice(-range);
  }, [chartData, timeRange]);

  const lastItem = filteredData[filteredData.length - 1] || { cumulativeEarnings: 0, dailyYield: 0 };
  const firstItem = filteredData[0] || { cumulativeEarnings: 0 };
  const periodGrowth = lastItem.cumulativeEarnings - firstItem.cumulativeEarnings;
  const growthPercentage = firstItem.cumulativeEarnings > 0 
    ? ((periodGrowth / firstItem.cumulativeEarnings) * 100).toFixed(1) 
    : '100';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-300 relative overflow-hidden group">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-[11px] font-bold mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Analyse en temps réel</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            {t.chartTitle}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">{t.chartSubtitle}</p>
        </div>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1.5 hidden sm:inline" />
          {(['7', '15', '30'] as const).map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                timeRange === days
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {days} Jours
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-blue-600" /> {t.chartCumulativeTotal}
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-blue-600 font-mono mt-0.5">
            {lastItem.cumulativeEarnings.toLocaleString('fr-FR')} FC
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-600" /> {t.chartDailyYield} Moy.
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono mt-0.5">
            {lastItem.dailyYield.toLocaleString('fr-FR')} FC/j
          </div>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[11px] text-slate-500 font-medium">Croissance Période</div>
            <div className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono mt-0.5 flex items-center gap-1">
              +{growthPercentage}% <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Recharts Area Chart */}
      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="colorDaily" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis 
              dataKey="dateStr" 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
            />
            <YAxis 
              stroke="#64748b" 
              tick={{ fill: '#64748b', fontSize: 10 }}
              axisLine={{ stroke: '#cbd5e1' }}
              tickLine={false}
              tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#2563eb',
                borderRadius: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                color: '#fff',
                fontSize: '12px',
                padding: '12px'
              }}
              formatter={(value: any, name: any) => [
                `${Number(value).toLocaleString('fr-FR')} FC`,
                name === 'cumulativeEarnings' ? t.chartCumulativeTotal : t.chartDailyYield
              ]}
              labelFormatter={(label) => `📅 Date: ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="cumulativeEarnings" 
              name="cumulativeEarnings"
              stroke="#2563eb" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorCumulative)" 
            />
            <Area 
              type="monotone" 
              dataKey="dailyYield" 
              name="dailyYield"
              stroke="#10b981" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorDaily)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block shadow-sm"></span>
            {t.chartCumulativeTotal}
          </span>
          <span className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm"></span>
            {t.chartDailyYield}
          </span>
        </div>
        <div className="text-slate-400">
          Mise à jour automatique • RentTech Hub RDC
        </div>
      </div>

    </div>
  );
};
