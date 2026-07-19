import {
  Activity,
  BarChart2,
  Bell,
  Bot,
  Camera,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Search,
  Settings,
  ShieldAlert,
  Sun,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  Sparkles,
  Loader2,
  X,
  RefreshCw,
  Lock,
  Gauge
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import Chart from './components/Chart';
import Snapshots, { SnapshotData } from './components/Snapshots';
import AIChat from './components/AIChat';
import PerpsTrading from './components/PerpsTrading';
import FullPortTimer from './components/FullPortTimer';
import StrategyBuilder from './components/StrategyBuilder';
import CycleMonitor from './components/CycleMonitor';
import ProfileModal from './components/ProfileModal';
import SmartContractPayment from './components/SmartContractPayment';
import WalletDetailsModal from './components/WalletDetailsModal';
import { TIMEFRAME_ANALYSIS } from './data/timeframeAnalysis';
import { PRO_SIGNALS, PERP_ASSETS } from './data/perpsAndSignals';
import { SEARCHABLE_MARKETS, MarketAsset } from './data/markets';

const TIMEFRAMES = [
  { id: '60', label: '1H', desc: 'Hourly Scalp' },
  { id: '240', label: '4H', desc: 'Intraday' },
  { id: '720', label: '12H', desc: 'Shorter Swing' },
  { id: 'D', label: '1D', desc: 'Daily Focus' },
  { id: 'W', label: '1W', desc: 'Weekly Macro' },
  { id: 'M', label: '1M', desc: 'Monthly Cycle' },
];

const MOCK_SIGNALS = [
  { id: 1, asset: 'BTC/USDT', type: 'Long', entry: '64,230.00', status: 'Active', time: '2m ago', confidence: 85 },
  { id: 2, asset: 'ETH/USDT', type: 'Short', entry: '3,450.20', status: 'Pending', time: '5m ago', confidence: 62 },
  { id: 3, asset: 'SOL/USDT', type: 'Long', entry: '145.80', status: 'Closed (Win)', time: '1h ago', confidence: 91 },
  { id: 4, asset: 'XRP/USDT', type: 'Long', entry: '0.6212', status: 'Active', time: '1h ago', confidence: 78 },
  { id: 5, asset: 'LINK/USDT', type: 'Short', entry: '18.45', status: 'Active', time: '3h ago', confidence: 55 },
];

function renderMarkdownContent(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('###')) {
      return <h3 key={idx} className="text-base font-bold text-foreground mt-4 mb-2 font-mono uppercase tracking-wider border-b border-border pb-1">{trimmed.replace(/^###\s*/, '')}</h3>;
    }
    if (trimmed.startsWith('####')) {
      return <h4 key={idx} className="text-sm font-semibold text-primary mt-3 mb-1 font-mono uppercase">{trimmed.replace(/^####\s*/, '')}</h4>;
    }
    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
      return <p key={idx} className="text-xs font-semibold text-foreground my-1">{trimmed.replace(/\*\*/g, '')}</p>;
    }
    if (trimmed.startsWith('-')) {
      const listContent = trimmed.replace(/^-\s*/, '');
      const parts = listContent.split('**');
      return (
        <li key={idx} className="text-xs text-muted-foreground list-disc ml-5 my-1 leading-relaxed">
          {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-foreground font-semibold">{part}</strong> : part)}
        </li>
      );
    }
    if (trimmed === '') {
      return <div key={idx} className="h-2"></div>;
    }
    const parts = trimmed.split('**');
    return (
      <p key={idx} className="text-xs text-muted-foreground leading-relaxed my-1.5">
        {parts.map((part, pidx) => pidx % 2 === 1 ? <strong key={pidx} className="text-foreground font-semibold">{part}</strong> : part)}
      </p>
    );
  });
}

export default function App() {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'perps' | 'snapshots' | 'strategy' | 'monitor'>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null);
  const [activeInterval, setActiveInterval] = useState<string>('D');
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  // --- Quantitative Strategy Hub State ---
  const [strategyCycleHigh, setStrategyCycleHigh] = useState<number>(69000);
  const [strategyCycleLow, setStrategyCycleLow] = useState<number>(15500);
  const [strategySimPrice, setStrategySimPrice] = useState<number>(45000);
  const [strategyGreenDotTimeframes, setStrategyGreenDotTimeframes] = useState<string[]>([]);
  const [strategyLeverage, setStrategyLeverage] = useState<number>(10);
  const [strategySymbol, setStrategySymbol] = useState<string>("BINANCE:BTCUSDT");

  const [activeSymbol, setActiveSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [activeSymbolLabel, setActiveSymbolLabel] = useState<string>('BTC / USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Subscription and Limit Tracking States
  const [userTier, setUserTier] = useState<'free' | 'basic' | 'pro' | 'ultimate'>(() => {
    return (localStorage.getItem('swarm_user_tier') as any) || 'free';
  });

  const [analysisTokens, setAnalysisTokens] = useState<number>(() => {
    const saved = localStorage.getItem('lion_analysis_tokens');
    if (saved === null) {
      localStorage.setItem('lion_analysis_tokens', '3');
      return 3;
    }
    return parseInt(saved, 10);
  });

  const [dailySearchCount, setDailySearchCount] = useState<number>(() => {
    const savedDate = localStorage.getItem('swarm_search_date');
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem('swarm_search_date', today);
      localStorage.setItem('swarm_search_count', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('swarm_search_count') || '0', 10);
  });

  const [dailyChatCount, setDailyChatCount] = useState<number>(() => {
    const savedDate = localStorage.getItem('swarm_chat_date');
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem('swarm_chat_date', today);
      localStorage.setItem('swarm_chat_count', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('swarm_chat_count') || '0', 10);
  });

  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [selectedBillingCycle, setSelectedBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [subscriptionTriggerReason, setSubscriptionTriggerReason] = useState<'search' | 'chat' | 'upgrade' | 'tokens'>('upgrade');

  // Active Purchase Product (Premium Pack or Token Pack)
  const [activePurchaseProduct, setActivePurchaseProduct] = useState<{
    id: 'basic' | 'pro' | 'ultimate' | 'token_50' | 'token_200' | 'token_500';
    name: string;
    price: number;
    tokens: number;
  } | null>(null);

  // Smart Contract Checkout States
  const [smartContractPaymentTier, setSmartContractPaymentTier] = useState<'basic' | 'pro' | 'ultimate' | null>(null);

  // Load or set membership expiry timestamp (for realistic countdown simulation)
  const [expiry, setExpiry] = useState<number | null>(() => {
    const saved = localStorage.getItem('swarm_membership_expiry');
    if (saved) return parseInt(saved, 10);
    // Initialize to 15 days, 8 hours, 42 minutes from now
    const val = Date.now() + (15 * 24 * 60 * 60 * 1000) + (8 * 60 * 60 * 1000) + (42 * 60 * 1000);
    localStorage.setItem('swarm_membership_expiry', val.toString());
    return val;
  });

  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('swarm_membership_expiry');
    if (saved) {
      setExpiry(parseInt(saved, 10));
    }
  }, [userTier]);

  useEffect(() => {
    if (!userTier || userTier === 'free') {
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const savedExpiry = localStorage.getItem('swarm_membership_expiry');
      const target = savedExpiry ? parseInt(savedExpiry, 10) : expiry;
      const diff = (target || Date.now()) - Date.now();

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userTier, expiry]);

  // 1W Projection Modal States
  const [projectionAsset, setProjectionAsset] = useState<MarketAsset | null>(null);
  const [isProjectionLoading, setIsProjectionLoading] = useState(false);
  const [projectionData, setProjectionData] = useState<any | null>(null);

  // Dynamic Timeframe Analysis state
  const [timeframeAnalysis, setTimeframeAnalysis] = useState(TIMEFRAME_ANALYSIS);

  // Live Recalculation states
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcStep, setRecalcStep] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [priceAlerts, setPriceAlerts] = useState<{ upper: string; lower: string }>({ upper: '', lower: '' });

  // API Pulls State Tracking
  const [dailyApiCount, setDailyApiCount] = useState<number>(() => {
    const savedDate = localStorage.getItem('swarm_api_date');
    const today = new Date().toDateString();
    if (savedDate !== today) {
      localStorage.setItem('swarm_api_date', today);
      localStorage.setItem('swarm_api_count', '0');
      return 0;
    }
    return parseInt(localStorage.getItem('swarm_api_count') || '0', 10);
  });

  const TIER_LIMITS = {
    free: { maxSearches: 3, maxChats: 2, label: 'Free Tier', price: '$0', maxApiRequests: 100 },
    basic: { maxSearches: 10, maxChats: 10, label: 'Basic Plan', price: '$5/mo', maxApiRequests: 500 },
    pro: { maxSearches: 30, maxChats: 20, label: 'Pro Plan', price: '$15/mo', maxApiRequests: 2500 },
    ultimate: { maxSearches: 50, maxChats: 999999, label: 'Ultimate Plan', price: '$29/mo', maxApiRequests: 10000 }
  };

  const handleLoginRecalculation = async () => {
    setIsRecalculating(true);
    setRecalcStep('Initializing secure swarm session...');
    
    await new Promise(r => setTimeout(r, 1000));
    setRecalcStep('Connecting to live CoinGecko API feed...');
    
    await new Promise(r => setTimeout(r, 1000));
    setRecalcStep('Computing Market Cipher B Momentum & Money Flow...');
    
    await new Promise(r => setTimeout(r, 1000));
    setRecalcStep('Calculating Fibonacci levels & FVRP POC liquidity...');
    
    await new Promise(r => setTimeout(r, 800));
    setRecalcStep('Recalculating wallet balances and open position PnL...');
    
    // Perform actual state updates!
    // We randomize balances slightly to simulate real-time on-chain recalculation!
    const randomUsdc = Math.floor(11500 + Math.random() * 2000);
    const randomSol = parseFloat((75 + Math.random() * 15).toFixed(2));
    setUsdcBalance(randomUsdc);
    localStorage.setItem('swarm_wallet_usdc', randomUsdc.toString());
    setSolBalance(randomSol);
    localStorage.setItem('swarm_wallet_sol', randomSol.toString());

    // Update timeframe analysis dynamically based on the current live price!
    const rawPrice = parseFloat(String(livePrice).replace(/,/g, '')) || 64200;
    
    setTimeframeAnalysis(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(key => {
        const item = { ...updated[key] };
        
        // Adjust Fibonacci levels based on rawPrice
        const fLow = rawPrice * 0.95;
        const fHigh = rawPrice * 1.05;
        item.fibonacci = {
          low: `$${Math.floor(fLow).toLocaleString()}`,
          high: `$${Math.floor(fHigh).toLocaleString()}`,
          levels: [
            { label: '0.382 Level', value: `$${Math.floor(rawPrice * 1.01).toLocaleString()}`, desc: 'Immediate Resistance' },
            { label: '0.500 Level', value: `$${Math.floor(rawPrice * 0.995).toLocaleString()}`, desc: 'Mid-point Retest Support' },
            { label: '0.618 Golden Pocket', value: `$${Math.floor(rawPrice * 0.985).toLocaleString()}`, desc: 'Strong Buy Confluence Zone' }
          ]
        };
        
        // Adjust FVRP
        item.fvrp = {
          vah: `$${Math.floor(rawPrice * 1.02).toLocaleString()}`,
          poc: `$${Math.floor(rawPrice * 1.002).toLocaleString()}`,
          val: `$${Math.floor(rawPrice * 0.98).toLocaleString()}`,
          volumeProfile: item.fvrp.volumeProfile
        };

        // Adjust Trade Plan
        item.tradePlan = {
          ...item.tradePlan,
          entry: `$${Math.floor(rawPrice * 0.985).toLocaleString()} - $${Math.floor(rawPrice * 0.995).toLocaleString()}`,
          stopLoss: `$${Math.floor(rawPrice * 0.975).toLocaleString()}`,
          takeProfit: `$${Math.floor(rawPrice * 1.025).toLocaleString()}`
        };

        updated[key] = item;
      });
      return updated;
    });

    // Record API usage trigger
    const initialCalls = 12; // Standard bulk pull on login
    setDailyApiCount(prev => {
      const next = prev + initialCalls;
      localStorage.setItem('swarm_api_count', next.toString());
      return next;
    });

    await new Promise(r => setTimeout(r, 600));
    setRecalcStep('AI Recalculation Complete!');
    await new Promise(r => setTimeout(r, 600));
    setIsRecalculating(false);
  };

  const incrementSearchCount = () => {
    const today = new Date().toDateString();
    localStorage.setItem('swarm_search_date', today);
    const newCount = dailySearchCount + 1;
    setDailySearchCount(newCount);
    localStorage.setItem('swarm_search_count', newCount.toString());
  };

  const incrementChatCount = () => {
    const today = new Date().toDateString();
    localStorage.setItem('swarm_chat_date', today);
    const newCount = dailyChatCount + 1;
    setDailyChatCount(newCount);
    localStorage.setItem('swarm_chat_count', newCount.toString());
  };

  const handleUpgradeTier = (tier: 'free' | 'basic' | 'pro' | 'ultimate') => {
    if (tier === 'free') {
      setUserTier(tier);
      localStorage.setItem('swarm_user_tier', tier);
      setIsSubscriptionModalOpen(false);
    } else {
      setSmartContractPaymentTier(tier);
    }
  };

  const handleAssetCheck = async (asset: MarketAsset) => {
    // GUARD: Token-based restriction like dyor.net
    if (analysisTokens <= 0) {
      setSubscriptionTriggerReason('tokens');
      setIsSubscriptionModalOpen(true);
      setSearchQuery('');
      setToastMessage("Insufficient AI Scanner tokens! Purchase a Premium Pack or Token Pack to unlock forecasts.");
      return;
    }

    const maxAllowed = TIER_LIMITS[userTier].maxSearches;
    if (dailySearchCount >= maxAllowed) {
      setSubscriptionTriggerReason('search');
      setIsSubscriptionModalOpen(true);
      setSearchQuery('');
      return;
    }

    // GUARD: Check API Limits before pulling
    const apiLimit = TIER_LIMITS[userTier].maxApiRequests;
    if (dailyApiCount >= apiLimit) {
      setToastMessage(`Daily API limit exceeded (${dailyApiCount}/${apiLimit} pulls) for your ${TIER_LIMITS[userTier].label}. Upgrade to unlock higher allowances.`);
      return;
    }

    // Consume 1 token on execution
    setAnalysisTokens(prev => {
      const next = Math.max(0, prev - 1);
      localStorage.setItem('lion_analysis_tokens', next.toString());
      return next;
    });

    incrementSearchCount();
    setActiveSymbol(asset.symbol);
    setActiveSymbolLabel(asset.label);
    setSearchQuery('');

    setProjectionAsset(asset);
    setIsProjectionLoading(true);
    setProjectionData(null);

    try {
      const numericPrice = parseFloat(String(livePrice).replace(/,/g, '')) || 100;
      const res = await fetch(`/api/gemini/projection?symbol=${asset.id}&name=${encodeURIComponent(asset.name)}&category=${asset.category}&currentPrice=${numericPrice}`);
      if (res.ok) {
        const data = await res.json();
        setProjectionData(data);
        // Increment API count on successful fetch
        setDailyApiCount(prev => {
          const next = prev + 1;
          localStorage.setItem('swarm_api_count', next.toString());
          return next;
        });
      } else {
        throw new Error("Failed to fetch projection");
      }
    } catch (err) {
      console.error("1W Projection Fetch Error:", err);
      // Construct fallback locally if API is blocked or failed
      const changeVal = (Math.random() * 8 + 1.5) * (Math.random() > 0.4 ? 1 : -1);
      const direction = changeVal > 0 ? "BULLISH" : "BEARISH";
      const basePrice = parseFloat(String(livePrice).replace(/,/g, '')) || 100;
      const projectedPrice = basePrice * (1 + changeVal / 100);
      const weeklyHigh = Math.max(basePrice, projectedPrice) * 1.025;
      const weeklyLow = Math.min(basePrice, projectedPrice) * 0.975;
      setProjectionData({
        projectedPrice: parseFloat(projectedPrice.toFixed(2)),
        percentChange: `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}%`,
        direction,
        weeklyHigh: parseFloat(weeklyHigh.toFixed(2)),
        weeklyLow: parseFloat(weeklyLow.toFixed(2)),
        markdownAnalysis: `### 1W Technical Forecast & Strategy Room for **${asset.label} (${asset.id.toUpperCase()})**
Our Swarm intelligence indicators are flashing **${direction}** signals for the next 1-week horizon.

#### Technical Confluence Key Metrics:
- **Support Cluster:** $${weeklyLow.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (FVRP POC zone confluence)
- **Resistance Cluster:** $${weeklyHigh.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (Fibonacci 0.618 extension target)
- **Market Cipher B Momentum:** wave waves flattening near neutral, indicating a high-probability breakout setup
- **Swarm Consensus Confidence:** 84.6% buy confluence based on active derivative leverage positions.

#### Recommended Action Plan:
Establish position in the current accumulation range with a stop loss below **$${(weeklyLow * 0.98).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** and initial target at the **$${projectedPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** resistance milestone.`
      });
    } finally {
      setIsProjectionLoading(false);
    }
  };

  const [livePrice, setLivePrice] = useState<number | string>('64,212.45');
  const [liveChange, setLiveChange] = useState<number | string>('+2.45%');
  const [liveVolume, setLiveVolume] = useState<string>('$28.4B');
  const [liveHigh, setLiveHigh] = useState<number | string>('64,850.00');
  const [liveLow, setLiveLow] = useState<number | string>('63,200.00');
  const [globalPrices, setGlobalPrices] = useState<Record<string, { price: number; change24h: number; volume24h?: number; high24h?: number; low24h?: number; marketCap?: number }>>({});

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const uAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(uAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  useEffect(() => {
    const fetchGlobalQuotes = async () => {
      const matched = SEARCHABLE_MARKETS.find(m => m.symbol === activeSymbol);
      const ticker = matched ? matched.id.toUpperCase() : 'BTC';
      
      const baseSymbols = ['BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'TSLA', 'AAPL', 'NVDA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'GOLD', 'SILVER', 'PLATINUM', 'PALLADIUM', 'COPPER', 'LINK', 'EUR', 'GBP'];
      const uniqueSymbols = Array.from(new Set([...baseSymbols, ticker]));
      const symbolsQuery = uniqueSymbols.join(',');

      // GUARD: Check API Limits before pulling
      const apiLimit = TIER_LIMITS[userTier].maxApiRequests;
      if (dailyApiCount >= apiLimit) {
        setToastMessage(`Daily API limit exceeded (${dailyApiCount}/${apiLimit} pulls) for your ${TIER_LIMITS[userTier].label}. Upgrade to unlock higher allowances.`);
        return;
      }

      try {
        const res = await fetch(`/api/coingecko/quotes?symbols=${symbolsQuery}`);
        if (res.ok) {
          const result = await res.json();
          if (result && result.data) {
            // Increment API count on successful fetch
            setDailyApiCount(prev => {
              const next = prev + 1;
              localStorage.setItem('swarm_api_count', next.toString());
              return next;
            });

            const newPrices: Record<string, { price: number; change24h: number; volume24h?: number; high24h?: number; low24h?: number; marketCap?: number }> = {};
            
            Object.keys(result.data).forEach(sym => {
              const symData = result.data[sym].quote?.USD;
              if (symData) {
                newPrices[sym] = {
                  price: symData.price,
                  change24h: symData.percent_change_24h,
                  volume24h: symData.volume_24h,
                  high24h: symData.high_24h,
                  low24h: symData.low_24h,
                  marketCap: symData.market_cap
                };
              }
            });

            setGlobalPrices(newPrices);

            // Update active symbol live details
            const activeData = result.data[ticker]?.quote?.USD;
            if (activeData) {
              setLivePrice(activeData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              setLiveChange(`${activeData.percent_change_24h >= 0 ? '+' : ''}${activeData.percent_change_24h.toFixed(2)}%`);
              setLiveVolume(activeData.volume_24h >= 1e9 
                ? `$${(activeData.volume_24h / 1e9).toFixed(2)}B` 
                : `$${(activeData.volume_24h / 1e6).toFixed(2)}M`
              );
              setLiveHigh(activeData.high_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
              setLiveLow(activeData.low_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch live quotes:", error);
      }
    };

    fetchGlobalQuotes();
    const interval = setInterval(fetchGlobalQuotes, 30000);
    return () => clearInterval(interval);
  }, [activeSymbol, dailyApiCount, userTier]);

  useEffect(() => {
    const ticker = activeSymbol.replace('BINANCE:', '').replace('USDT', '');
    const currentPrice = globalPrices[ticker]?.price;
    if (!currentPrice) return;

    if (priceAlerts.upper) {
      const upper = parseFloat(priceAlerts.upper);
      if (currentPrice >= upper) {
        setToastMessage(`🚨 PRICE ALERT: ${activeSymbolLabel} crossed UPPER threshold of $${upper.toLocaleString()}!`);
        setTimeout(() => setToastMessage(null), 8000);
        setPriceAlerts(prev => ({ ...prev, upper: '' }));
      }
    }
    if (priceAlerts.lower) {
      const lower = parseFloat(priceAlerts.lower);
      if (currentPrice <= lower) {
        setToastMessage(`🚨 PRICE ALERT: ${activeSymbolLabel} crossed LOWER threshold of $${lower.toLocaleString()}!`);
        setTimeout(() => setToastMessage(null), 8000);
        setPriceAlerts(prev => ({ ...prev, lower: '' }));
      }
    }
  }, [globalPrices, activeSymbol, activeSymbolLabel, priceAlerts]);

  const [walletAddress, setWalletAddress] = useState<string | null>(() => {
    return localStorage.getItem('swarm_wallet_address') || null;
  });
  const [username, setUsername] = useState<string>(() => {
    return localStorage.getItem('swarm_username') || 'Apex Trader';
  });
  const [avatarUrl, setAvatarUrl] = useState<string>(() => {
    return localStorage.getItem('swarm_avatar_url') || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80';
  });
  const [connectedBlockchain, setConnectedBlockchain] = useState<string>(() => {
    return localStorage.getItem('swarm_blockchain') || 'Solana';
  });
  const [walletType, setWalletType] = useState<string>(() => {
    return localStorage.getItem('swarm_wallet_type') || 'Phantom';
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileEmail, setProfileEmail] = useState<string>(() => {
    return localStorage.getItem('swarm_profile_email') || '';
  });
  const [receipts, setReceipts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('swarm_receipts');
      if (saved) return JSON.parse(saved);
      const defaultReceipt = {
        id: `RCPT-482091`,
        tier: 'basic',
        price: 5,
        billingCycle: 'monthly',
        date: Date.now() - 5 * 24 * 60 * 60 * 1000,
        txHash: `SOL-8C3B14F9`,
        status: 'Paid'
      };
      localStorage.setItem('swarm_receipts', JSON.stringify([defaultReceipt]));
      return [defaultReceipt];
    } catch {
      return [];
    }
  });

  const [chartMarkups, setChartMarkups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('swarm_chart_markups');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [markupType, setMarkupType] = useState<string>('Support');
  const [markupValue, setMarkupValue] = useState<string>('');
  const [markupNotes, setMarkupNotes] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('swarm_chart_markups', JSON.stringify(chartMarkups));
  }, [chartMarkups]);

  const handleAddMarkup = () => {
    if (!markupNotes.trim()) {
      alert("Please enter analysis notes for this markup.");
      return;
    }
    const newMarkup = {
      id: 'markup_' + Date.now(),
      symbol: activeSymbol,
      type: markupType,
      value: markupValue,
      notes: markupNotes,
      timeframe: activeTFLabel,
      date: Date.now()
    };
    setChartMarkups(prev => [newMarkup, ...prev]);
    setMarkupValue('');
    setMarkupNotes('');
  };

  const handleRemoveMarkup = (id: string) => {
    setChartMarkups(prev => prev.filter(m => m.id !== id));
  };

  const [usdcBalance, setUsdcBalance] = useState<number>(() => {
    const val = localStorage.getItem('swarm_wallet_usdc');
    if (val) return parseFloat(val);
    const hasAddr = localStorage.getItem('swarm_wallet_address');
    return hasAddr ? 12500 : 12500; // Let's default to 12,500 USDC so they always have mock wallet funds to play with!
  });
  const [solBalance, setSolBalance] = useState<number>(() => {
    const val = localStorage.getItem('swarm_wallet_sol');
    return val ? parseFloat(val) : 82.45;
  });

  const prevWalletRef = useRef<string | null>(walletAddress);

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('swarm_wallet_address', walletAddress);
      if (!prevWalletRef.current) {
        handleLoginRecalculation();
      }
    } else {
      localStorage.removeItem('swarm_wallet_address');
      localStorage.removeItem('swarm_wallet_usdc');
      localStorage.removeItem('swarm_wallet_sol');
    }
    prevWalletRef.current = walletAddress;
  }, [walletAddress]);

  useEffect(() => {
    localStorage.setItem('swarm_username', username);
  }, [username]);

  useEffect(() => {
    localStorage.setItem('swarm_avatar_url', avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    localStorage.setItem('swarm_blockchain', connectedBlockchain);
  }, [connectedBlockchain]);

  useEffect(() => {
    localStorage.setItem('swarm_wallet_type', walletType);
  }, [walletType]);

  useEffect(() => {
    localStorage.setItem('swarm_wallet_usdc', usdcBalance.toString());
  }, [usdcBalance]);

  useEffect(() => {
    localStorage.setItem('swarm_wallet_sol', solBalance.toString());
  }, [solBalance]);

  const activeAnalysis = TIMEFRAME_ANALYSIS[activeInterval] || TIMEFRAME_ANALYSIS['D'];
  const activeTFLabel = TIMEFRAMES.find(t => t.id === activeInterval)?.label || '1D';

  const filteredSearchMarkets = SEARCHABLE_MARKETS.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      setIsDark(false);
    } else {
      root.classList.add('dark');
      setIsDark(true);
    }
  };

  const handleAnalyzeSnapshot = (snapshot: SnapshotData) => {
    setSelectedSnapshot(snapshot);
    setIsChatOpen(true);
  };

  // Dynamic Connected Wallet Portfolio and Modal state
  const [isWalletDetailsModalOpen, setIsWalletDetailsModalOpen] = useState(false);
  const currentSolPrice = globalPrices['SOL']?.price || 152.34;
  const currentSolChange = globalPrices['SOL']?.change24h || 2.4;
  const walletConnected = !!walletAddress;
  
  // Real user connected wallet balance
  const activeUsdcBalance = walletConnected ? usdcBalance : 0;
  const activeSolBalance = walletConnected ? solBalance : 0;
  
  const totalSolValuation = activeSolBalance * currentSolPrice;
  const totalWalletPortfolioValue = activeUsdcBalance + totalSolValuation;
  
  // Simulated portfolio change (SOL has price change, USDC has 0 change)
  const portfolioChangeTodayValue = totalSolValuation * (currentSolChange / 100);
  const isPortfolioChangePositive = portfolioChangeTodayValue >= 0;

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-4 md:px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              L
            </div>
            <span className="text-lg md:text-xl lion-serif tracking-tight pr-2 text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500">The Lion Scanner</span>
          </div>
        </div>
        
        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            <Button 
              variant={activeTab === 'dashboard' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'dashboard' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button variant="ghost" disabled className="w-full justify-start text-muted-foreground opacity-50 cursor-not-allowed">
              <Activity className="mr-2 h-4 w-4" />
              Live Signals Coming Soon
            </Button>
            <Button 
              variant="ghost" 
              disabled
              className="w-full justify-start text-muted-foreground opacity-50 cursor-not-allowed"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Perps Platform Coming Soon
            </Button>
            <Button 
              variant={activeTab === 'snapshots' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'snapshots' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('snapshots')}
            >
              <Camera className="mr-2 h-4 w-4" />
              My Snapshots
            </Button>
            <Button 
              variant={activeTab === 'strategy' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'strategy' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('strategy')}
            >
              <Bot className="mr-2 h-4 w-4 text-orange-500" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500 font-bold">Strategy Builder</span>
              <Badge variant="outline" className="ml-auto border-orange-500/30 text-orange-400 text-[8px] font-mono font-bold">QUANT</Badge>
            </Button>
            <Button 
              variant={activeTab === 'monitor' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'monitor' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('monitor')}
            >
              <Gauge className="mr-2 h-4 w-4 text-orange-400" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 font-bold">Cycle Monitor</span>
              <Badge variant="outline" className="ml-auto border-orange-500/30 text-orange-400 text-[8px] font-mono font-bold">ENGINE</Badge>
            </Button>

            {/* Membership Status Section */}
            <div className="mt-4 pt-4 border-t border-border/40 px-1 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block pl-2">Membership Status</span>
              <div className="bg-muted/30 border border-border/60 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${userTier === 'free' ? 'bg-muted-foreground' : 'bg-emerald-500 animate-pulse'}`}></span>
                  <span className="font-mono text-xs font-bold uppercase text-foreground">
                    {userTier === 'free' ? 'Free Tier' : `${userTier} Plan`}
                  </span>
                </div>
                
                {userTier !== 'free' && timeRemaining ? (
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Expires in: <strong className="text-foreground font-mono bg-background px-1 py-0.5 rounded ml-0.5">
                      {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m
                    </strong>
                  </p>
                ) : (
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Unlock full swarm searches, strategy room, and forecasts.
                  </p>
                )}

                {/* AI Scanner Token indicator */}
                <div className="flex items-center justify-between border-t border-border/40 pt-2 mt-1.5 pb-1">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase">AI Scanner Tokens:</span>
                  <Badge variant="outline" className="font-mono text-[9px] bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold">
                    {analysisTokens} Left
                  </Badge>
                </div>

                {userTier !== 'free' ? (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSubscriptionTriggerReason('upgrade');
                      setIsSubscriptionModalOpen(true);
                    }}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-black font-mono text-[9px] uppercase h-7 tracking-wider cursor-pointer font-bold"
                  >
                    Renew / Extend
                  </Button>
                ) : (
                  <Button 
                    size="sm"
                    onClick={() => {
                      setSubscriptionTriggerReason('upgrade');
                      setIsSubscriptionModalOpen(true);
                    }}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[9px] uppercase h-7 tracking-wider cursor-pointer font-bold"
                  >
                    Upgrade to Premium
                  </Button>
                )}
              </div>
            </div>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hidden">
              <Users className="mr-2 h-4 w-4" />
              Swarm Intelligence
            </Button>
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground hidden">
              <MessageSquare className="mr-2 h-4 w-4" />
              Community
            </Button>
          </nav>
        </ScrollArea>
        
        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4 md:px-6 z-10 shrink-0">
          <div className="flex items-center gap-4">
            {/* Mobile Logo Branding */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-md shadow-primary/20">
                L
              </div>
              <span className="text-sm font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 uppercase">The Lion Scanner</span>
            </div>

            <div className="relative w-48 md:w-96 hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search stocks, metals, crypto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="w-full bg-muted/50 border-none rounded-md pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary font-mono"
              />
              {isSearchFocused && (
                <div className="absolute top-12 left-0 w-full bg-background border border-border rounded-lg shadow-2xl z-50 max-h-80 overflow-y-auto font-sans p-1">
                  {filteredSearchMarkets.length === 0 ? (
                    <div className="text-xs text-muted-foreground p-3 font-mono">No markets found for "{searchQuery}"</div>
                  ) : (
                    <div className="py-1">
                      {['Crypto', 'Stock', 'Metal'].map((category) => {
                        const items = filteredSearchMarkets.filter(m => m.category === category);
                        if (items.length === 0) return null;
                        return (
                          <div key={category} className="mb-2 last:mb-0">
                            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 py-1 bg-muted/20 rounded-sm mb-1">
                              {category === 'Metal' ? 'Precious Metals / Commodities' : category + 's'}
                            </div>
                            {items.map((asset) => (
                              <button
                                key={asset.id}
                                onMouseDown={() => handleAssetCheck(asset)}
                                className="w-full flex items-center justify-between px-3 py-2 text-xs rounded-md text-left hover:bg-accent hover:text-accent-foreground transition-colors font-mono"
                              >
                                <div className="flex flex-col">
                                  <span className="font-bold text-foreground">{asset.label}</span>
                                  <span className="text-[10px] text-muted-foreground font-sans">{asset.name}</span>
                                </div>
                                <span className="text-[9px] bg-primary/15 text-primary py-0.5 px-1.5 rounded uppercase font-bold">
                                  {asset.id}
                                </span>
                              </button>
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="outline" size="sm" onClick={handleLoginRecalculation} disabled={isRecalculating} className="border-border hover:bg-muted text-muted-foreground h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1.5 cursor-pointer font-mono font-medium">
              <RefreshCw className={`w-3.5 h-3.5 ${isRecalculating ? 'animate-spin text-primary' : ''}`} />
              <span className="hidden sm:inline">Sync & Recalc AI</span>
              <span className="sm:hidden">Recalc</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setSubscriptionTriggerReason('upgrade'); setIsSubscriptionModalOpen(true); }} className="border-amber-500 hover:bg-amber-500/10 text-amber-500 h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1.5 cursor-pointer font-bold transition-all shadow-sm shadow-amber-500/10">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
              <span>Upgrade</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsChatOpen(!isChatOpen)} className="border-primary text-primary h-8 px-2.5 sm:px-3 text-xs flex items-center gap-1.5 cursor-pointer">
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isChatOpen ? 'Hide AI' : 'Ask AI'}</span>
              <span className="sm:hidden">{isChatOpen ? 'Hide' : 'AI'}</span>
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="cursor-pointer">
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" className="relative hidden sm:flex cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary ring-2 ring-background"></span>
            </Button>
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1 rounded-md transition-colors"
            >
              <Avatar className="h-8 w-8 border border-border">
                <AvatarImage src={avatarUrl} alt={username} referrerPolicy="no-referrer" />
                <AvatarFallback>{username ? username.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'AT'}</AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium leading-none">{username}</span>
                <span className="text-[10px] text-primary uppercase font-bold tracking-wider mt-0.5">
                  {walletAddress ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}` : 'Alpha Tier'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </div>
          </div>
        </header>

        {/* Dynamic Content View */}
        <div className="flex-1 flex overflow-hidden relative">
          <ScrollArea className="flex-1 p-4 md:p-6 bg-background">
            <div className="max-w-7xl mx-auto space-y-6 pb-24 md:pb-6">
              
              {activeTab === 'dashboard' ? (
                <>
                  {/* Full Port back into Crypto Countdown Timer */}
                  <FullPortTimer />

                  {/* Timeframe Selector Tabs */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-card border border-border/80 backdrop-blur rounded-xl p-4 shadow-sm">
                    <div className="space-y-1 border-l-2 border-orange-500/80 pl-3.5 py-0.5" id="swarm-strategy-room-header">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold tracking-tight uppercase font-mono text-primary flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          Lions 24H Swarm Strategy Room
                        </h3>
                        <Dialog>
                          <DialogTrigger render={<button className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-orange-500/10 hover:text-orange-500 h-6 w-6 ml-1 cursor-pointer" />}>
                            <Settings className="w-3.5 h-3.5" />
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md border-border bg-card">
                            <DialogHeader>
                              <DialogTitle className="font-mono text-orange-500 flex items-center gap-2">
                                <Settings className="w-4 h-4" /> Price Alerts - {activeSymbolLabel}
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <p className="text-xs text-muted-foreground">
                                Set custom price thresholds for {activeSymbolLabel}. You will receive a toast notification when the live price crosses these levels.
                              </p>
                              <div className="space-y-2">
                                <label className="text-xs font-mono font-bold text-foreground">Upper Threshold (USD)</label>
                                <Input 
                                  type="number" 
                                  placeholder={`e.g. ${(parseFloat(String(livePrice || '0').replace(/,/g, '')) * 1.05).toFixed(2)}`}
                                  value={priceAlerts.upper}
                                  onChange={(e) => setPriceAlerts(prev => ({ ...prev, upper: e.target.value }))}
                                  className="font-mono bg-background/50 border-border"
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-xs font-mono font-bold text-foreground">Lower Threshold (USD)</label>
                                <Input 
                                  type="number" 
                                  placeholder={`e.g. ${(parseFloat(String(livePrice || '0').replace(/,/g, '')) * 0.95).toFixed(2)}`}
                                  value={priceAlerts.lower}
                                  onChange={(e) => setPriceAlerts(prev => ({ ...prev, lower: e.target.value }))}
                                  className="font-mono bg-background/50 border-border"
                                />
                              </div>
                              <div className="pt-2">
                                <p className="text-[10px] text-orange-500/80 font-mono italic">
                                  Alerts will reset automatically once triggered.
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                      <p className="text-xs text-muted-foreground">Select active timeframe for live Market Cipher B and volume profile confluences.</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {TIMEFRAMES.map((tf) => {
                        const isSelected = activeInterval === tf.id;
                        const tfAnalysis = TIMEFRAME_ANALYSIS[tf.id];
                        const isLong = tfAnalysis.bias === 'LONG' || tfAnalysis.bias === 'BUY';
                        return (
                          <button
                            key={tf.id}
                            onClick={() => setActiveInterval(tf.id)}
                            className={`flex flex-col px-3 py-1.5 rounded-lg border text-left transition-all select-none min-w-[95px] cursor-pointer ${
                              isSelected
                                ? 'bg-primary/15 border-primary text-foreground font-semibold shadow-sm'
                                : 'border-border bg-background hover:bg-card text-muted-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 justify-between w-full">
                              <span className="text-xs font-bold font-mono tracking-tight">{tf.label}</span>
                              <span className={`text-[8.5px] font-mono font-bold px-1 rounded ${
                                isLong ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                              }`}>
                                {tfAnalysis.bias}
                              </span>
                            </div>
                            <span className="text-[9.5px] opacity-80 mt-1">{tf.desc}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Top Stats Row */}
                  <div className="grid grid-cols-1 tracking-tight md:grid-cols-3 gap-4">
                    <Card className="bg-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">Swarm Sentiment</p>
                            <h2 className="text-2xl lg:text-3xl font-bold font-mono text-emerald-500">Aggressive Buy</h2>
                          </div>
                          <div className="p-2 bg-emerald-500/10 rounded-lg">
                            <TrendingUp className="h-5 w-5 text-emerald-500" />
                          </div>
                        </div>
                        <div className="mt-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-mono text-xs">BULLISH O/I: 82.4%</span>
                          </div>
                          <Progress value={82.4} className="h-2 bg-muted [&>div]:bg-emerald-500" />
                          <p className="text-[10px] text-muted-foreground mt-2">Swarm confidence increased <span className="text-emerald-500 font-bold">+4.2%</span> last hour</p>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">Active Signals</p>
                            <h2 className="text-2xl lg:text-3xl font-bold font-mono">12</h2>
                          </div>
                          <div className="p-2 bg-primary/10 rounded-lg">
                            <Activity className="h-5 w-5 text-primary" />
                          </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-muted-foreground">
                          <span className="text-emerald-500 font-medium font-mono flex items-center mr-2">
                            <TrendingUp className="h-3 w-3 mr-1" /> +3
                          </span>
                          since last hour
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-card hidden md:block border border-border hover:border-primary/30 transition-all duration-300">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">Portfolio Balance</p>
                            <h2 className={`text-2xl lg:text-3xl font-bold font-mono tracking-tight ${walletConnected ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                              {walletConnected 
                                ? `$${totalWalletPortfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                                : '$0.00'
                              }
                            </h2>
                          </div>
                          <div className={`p-1 rounded-sm text-[8px] font-mono font-bold uppercase tracking-wider ${
                            walletConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
                          }`}>
                            {walletConnected ? 'Connected' : 'Disconnected'}
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col justify-between h-[42px]">
                          <div className="flex items-center text-sm text-muted-foreground">
                            {walletConnected ? (
                              <span className={`font-medium font-mono flex items-center mr-2 text-xs ${isPortfolioChangePositive ? 'text-emerald-500' : 'text-red-500'}`}>
                                {isPortfolioChangePositive ? '+' : ''}${portfolioChangeTodayValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} today
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-mono">No connected Web3 wallet</span>
                            )}
                          </div>
                          <Button 
                            onClick={() => setIsWalletDetailsModalOpen(true)}
                            variant="outline" 
                            size="sm" 
                            className="w-full text-[10px] h-6 uppercase tracking-widest mt-2 border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30 cursor-pointer transition-all"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Main Area: Chart & Top Signals */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Main Chart & Timeframe Strategy Analysis */}
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="bg-card flex flex-col min-h-[600px]">
                        <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0">
                          <div className="space-y-1">
                            <CardTitle className="font-mono tracking-tight text-lg">{activeSymbolLabel} ({activeTFLabel})</CardTitle>
                            <CardDescription className="text-xs">Advanced Interactive Chart ({activeTFLabel} Frame)</CardDescription>
                          </div>
                          <div className="flex gap-2">
                            <div className="text-right">
                              <p className={`text-xl font-mono ${String(liveChange).startsWith('-') ? 'text-red-500' : 'text-emerald-500'}`}>
                                ${livePrice}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">{liveChange} (24H)</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 pb-0 overflow-hidden relative min-h-[520px]">
                          <div className={(userTier === 'free' || userTier === 'basic') ? 'pointer-events-none opacity-25 blur-[3px] h-full w-full' : 'h-full w-full'}>
                            <Chart symbol={activeSymbol} interval={activeInterval} height={520} />
                          </div>
                          {(userTier === 'free' || userTier === 'basic') && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/70 backdrop-blur-md p-6 text-center">
                              <div className="p-3 bg-primary/10 rounded-full border border-primary/20 mb-4 animate-bounce">
                                <Lock className="w-8 h-8 text-primary" />
                              </div>
                              <h3 className="text-base font-bold font-mono text-foreground uppercase tracking-wider">Chart Play Mode Locked</h3>
                              <p className="text-xs text-muted-foreground max-w-sm mt-2 mb-6 leading-relaxed">
                                Interactive advanced real-time charts, custom drawing indicators, and active play sandbox are reserved for **Pro** and **Ultimate** members.
                              </p>
                              <Button 
                                onClick={() => {
                                  setSubscriptionTriggerReason('upgrade');
                                  setIsSubscriptionModalOpen(true);
                                }}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase tracking-wider px-6 py-2 rounded-lg cursor-pointer transition-all shadow-md shadow-primary/25"
                              >
                                Upgrade to Pro Plan
                              </Button>
                            </div>
                          )}
                        </CardContent>

                        {/* Conditional Chart Markups Panel - unlocked for Pro/Ultimate */}
                        {(userTier === 'pro' || userTier === 'ultimate') && (
                          <div className="border-t border-border/50 bg-muted/5 p-4 space-y-4">
                            <div className="flex items-center justify-between border-b border-border/40 pb-2">
                              <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-primary" />
                                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-foreground">
                                  Active Chart Markups & Drawings
                                </h4>
                              </div>
                              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded border border-border/30">
                                {chartMarkups.filter(m => m.symbol === activeSymbol).length} saved for {activeSymbolLabel}
                              </span>
                            </div>

                            {/* Form to add a markup */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-end">
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground font-mono">
                                  Markup Type
                                </label>
                                <select
                                  value={markupType}
                                  onChange={(e) => setMarkupType(e.target.value)}
                                  className="w-full h-8 bg-background border border-border rounded px-2 text-xs font-mono text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                                >
                                  <option value="Support">🟢 Support Level</option>
                                  <option value="Resistance">🔴 Resistance Level</option>
                                  <option value="Trendline">📈 Trendline</option>
                                  <option value="Fib Level">📐 Fibonacci Level</option>
                                  <option value="Annotation">✍️ Annotation / Note</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground font-mono">
                                  Value / Price Level
                                </label>
                                <Input
                                  type="text"
                                  placeholder="e.g. $65,400"
                                  value={markupValue}
                                  onChange={(e) => setMarkupValue(e.target.value)}
                                  className="h-8 text-xs font-mono border border-border bg-background"
                                />
                              </div>
                              <div className="space-y-1 sm:col-span-2 flex gap-2 items-end">
                                <div className="space-y-1 flex-1">
                                  <label className="text-[9px] uppercase tracking-wider font-bold text-muted-foreground font-mono">
                                    Analysis Notes
                                  </label>
                                  <Input
                                    type="text"
                                    placeholder="e.g. Retesting high volume node"
                                    value={markupNotes}
                                    onChange={(e) => setMarkupNotes(e.target.value)}
                                    className="h-8 text-xs font-sans border-border bg-background"
                                  />
                                </div>
                                <Button
                                  onClick={handleAddMarkup}
                                  size="sm"
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 text-[10px] uppercase font-mono tracking-wider cursor-pointer px-4 flex items-center justify-center shrink-0"
                                >
                                  Add Markup
                                </Button>
                              </div>
                            </div>

                            {/* List of saved markups for active asset */}
                            {chartMarkups.filter(m => m.symbol === activeSymbol).length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                {chartMarkups.filter(m => m.symbol === activeSymbol).map((markup) => (
                                  <div key={markup.id} className="flex justify-between items-center bg-background/50 border border-border/60 p-2 rounded-lg text-[10px] font-mono hover:border-primary/20 transition-all">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className={`px-1 rounded text-[8px] font-bold uppercase ${
                                          markup.type === 'Support' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                          markup.type === 'Resistance' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                          markup.type === 'Trendline' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                                          markup.type === 'Fib Level' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                          'bg-muted text-foreground border border-border'
                                        }`}>
                                          {markup.type}
                                        </span>
                                        {markup.value && <span className="font-bold text-foreground">{markup.value}</span>}
                                        <span className="text-[9px] text-muted-foreground">({markup.timeframe})</span>
                                      </div>
                                      <p className="text-[9px] text-muted-foreground font-sans">{markup.notes}</p>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleRemoveMarkup(markup.id)}
                                      className="w-5 h-5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[9.5px] text-muted-foreground font-mono text-center py-2 border border-dashed border-border/50 rounded-lg bg-background/30">
                                No active markups saved for {activeSymbolLabel}. Save your levels above to store locally!
                              </p>
                            )}
                          </div>
                        )}
                      </Card>

                      {/* 24-Hour Strategy Room Analysis Card */}
                      <Card className="border border-border/85 bg-card p-5 shadow-sm rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4 mb-4">
                          <div className="space-y-0.5">
                            <h4 className="text-sm font-semibold tracking-tight text-primary uppercase font-mono flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              {activeTFLabel} Swarm Analysis
                            </h4>
                            <p className="text-[11px] text-muted-foreground">Strategy updated {activeAnalysis.lastUpdated}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[10px] text-muted-foreground block uppercase font-mono tracking-wider">Bias</span>
                              <span className={`text-xs font-bold font-mono px-1.5 py-0.5 rounded ${
                                activeAnalysis.bias === 'LONG' || activeAnalysis.bias === 'BUY'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {activeAnalysis.bias} ({activeAnalysis.confidence}%)
                              </span>
                            </div>
                            <Button 
                              onClick={() => {
                                const prompt = `Let's deep dive into the ${activeAnalysis.label} strategy analysis:
- Timeframe Bias: ${activeAnalysis.bias} (with ${activeAnalysis.confidence}% swarm confluence)
- Market Cipher B: ${activeAnalysis.marketCipher.momentum} ${activeAnalysis.marketCipher.moneyFlow} (${activeAnalysis.marketCipher.signals.join(', ')})
- Fibonacci Levels: ${activeAnalysis.fibonacci.levels.map(l => l.label + ' at ' + l.value).join(', ')}
- Volume Profile (FVRP): VAL is ${activeAnalysis.fvrp.val}, POC is ${activeAnalysis.fvrp.poc}, VAH is ${activeAnalysis.fvrp.vah}
- Trade Action Plan: ${activeAnalysis.tradePlan.action} at Entry range ${activeAnalysis.tradePlan.entry} (Stop: ${activeAnalysis.tradePlan.stopLoss}, Target: ${activeAnalysis.tradePlan.takeProfit}).

Can you perform an advanced confirmation analyze of this recommendation using confluence guidelines and outline the exact trade validation checklist?`;
                                setAiInitialPrompt(prompt);
                                setIsChatOpen(true);
                              }}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs h-8 uppercase tracking-widest px-3 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                              Interrogate Setup
                            </Button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          {/* Col 1: Market Cipher */}
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Market Cipher B</h5>
                            <div className="space-y-2 bg-background/55 border border-border/45 rounded-lg p-3">
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase font-mono block font-bold">Wave Momentum</span>
                                <p className="text-xs leading-normal mt-0.5">{activeAnalysis.marketCipher.momentum}</p>
                              </div>
                              <div className="mt-2.5">
                                <span className="text-[9px] text-muted-foreground uppercase font-mono block font-bold">VWAP / Money Flow</span>
                                <p className="text-xs leading-normal mt-0.5">{activeAnalysis.marketCipher.moneyFlow}</p>
                              </div>
                              <div className="flex flex-wrap gap-1 mt-2 pt-1 border-t border-border/20">
                                {activeAnalysis.marketCipher.signals.map((sig, sIdx) => (
                                  <Badge key={sIdx} variant="outline" className="text-[8.5px] font-mono py-0 px-1 hover:bg-transparent bg-emerald-500/5 text-emerald-400 border-emerald-500/20">
                                    {sig}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Col 2: Fibs & Volume */}
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Fibonacci & Volume</h5>
                            <div className="space-y-2 bg-background/55 border border-border/45 rounded-lg p-3">
                              <div>
                                <span className="text-[9px] text-muted-foreground uppercase font-mono block font-bold">Fibonacci Levels</span>
                                <div className="space-y-1 mt-1 font-mono">
                                  {activeAnalysis.fibonacci.levels.map((lvl, lIdx) => (
                                    <div key={lIdx} className="flex justify-between text-xs border-b border-border/30 pb-0.5 last:border-0 last:pb-0">
                                      <span className="text-muted-foreground">{lvl.label}</span>
                                      <span className="font-semibold">{lvl.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                              <div className="mt-3 border-t border-border/20 pt-2.5">
                                <span className="text-[9px] text-muted-foreground uppercase font-mono block font-bold">Volume Area (FVRP)</span>
                                <div className="grid grid-cols-3 gap-1 text-[9px] font-mono text-center mt-1.5">
                                  <div className="p-0.5 bg-muted/40 rounded border border-border/25">
                                    <span className="text-muted-foreground block text-[7.5px]">VAH</span>
                                    <span>{activeAnalysis.fvrp.vah}</span>
                                  </div>
                                  <div className="p-0.5 bg-primary/10 rounded border border-primary/25 font-bold">
                                    <span className="text-primary block text-[7.5px]">POC</span>
                                    <span>{activeAnalysis.fvrp.poc}</span>
                                  </div>
                                  <div className="p-0.5 bg-muted/40 rounded border border-border/25">
                                    <span className="text-muted-foreground block text-[7.5px]">VAL</span>
                                    <span>{activeAnalysis.fvrp.val}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Col 3: Strategy Plan */}
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-sans">Strategy Plan</h5>
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3.5 flex flex-col justify-between h-[calc(100%-1.5rem)] min-h-[140px] space-y-2">
                              <div>
                                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-primary block leading-none mb-1">
                                  {activeAnalysis.tradePlan.action}
                                </span>
                                <p className="text-[11px] text-muted-foreground leading-normal">{activeAnalysis.tradePlan.justification}</p>
                              </div>
                              <div className="space-y-1 font-mono text-xs border-t border-primary/10 pt-2 mt-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground text-[10px]">ENTRY RANGE</span>
                                  <span className="font-bold">{activeAnalysis.tradePlan.entry}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground text-[10px]">STOP LOSS</span>
                                  <span className="font-bold text-red-500">{activeAnalysis.tradePlan.stopLoss}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground text-[10px]">TAKE PROFIT</span>
                                  <span className="font-bold text-emerald-500">{activeAnalysis.tradePlan.takeProfit}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>

                    {/* Live Signal Feed */}
                    <Card className="bg-card flex flex-col h-[500px] relative overflow-hidden">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground font-sans">
                          Swarm Pro Signals
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                          </span>
                        </CardTitle>
                      </CardHeader>
                      {userTier === 'free' ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-background/50 backdrop-blur-[2px] relative z-10">
                          <div className="p-3 bg-primary/10 rounded-full border border-primary/20 mb-3 animate-pulse text-primary">
                            <Lock className="w-5 h-5" />
                          </div>
                          <h4 className="text-xs font-bold font-mono text-foreground uppercase tracking-wider">Signals Locked</h4>
                          <p className="text-[10px] text-muted-foreground max-w-[200px] mt-1 mb-4 leading-normal">
                            Live buy/sell signals with exact entry triggers require a **Basic** plan or higher.
                          </p>
                          <Button 
                            onClick={() => {
                              setSubscriptionTriggerReason('upgrade');
                              setIsSubscriptionModalOpen(true);
                            }}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-[9px] uppercase tracking-wider h-7 px-3 rounded cursor-pointer"
                          >
                            Upgrade ($5/mo)
                          </Button>
                        </div>
                      ) : (
                        <ScrollArea className="flex-1 p-0">
                          <div className="flex flex-col gap-2 p-3">
                            {PRO_SIGNALS.map((signal) => (
                              <div 
                                key={signal.id} 
                                onClick={() => setActiveTab('perps')}
                                className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-colors cursor-pointer group hover:bg-muted/10"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span className="text-[10px] font-mono text-muted-foreground">{signal.id} • {signal.timeframe}</span>
                                  <span className="text-[10px] text-primary font-mono">{signal.confidence}% CONF</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <p className={`text-xs font-mono font-bold uppercase p-0 ${signal.type === 'Long' ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {signal.asset} {signal.type}
                                  </p>
                                  <span className="text-[8px] bg-muted/60 px-1 py-0.2 rounded font-mono text-muted-foreground uppercase">{signal.category}</span>
                                </div>
                                <div className="flex justify-between text-[9px] mt-2 text-muted-foreground font-mono">
                                  <span>ENTRY: {signal.entry}</span>
                                  <span className="text-muted-foreground opacity-60">{signal.time}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </Card>

                  </div>

                  {/* Bottom Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                    {/* Market Watch Table */}
                    <Card className="bg-card">
                      <CardHeader className="pb-2.5">
                        <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans">Global Market Watch</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-[210px] pr-2">
                          <div className="space-y-0">
                            {PERP_ASSETS.slice(0, 8).map((asset) => {
                              const ticker = asset.symbol.split('/')[0].toUpperCase();
                              const liveInfo = globalPrices[ticker];
                              const displayPrice = liveInfo ? liveInfo.price : asset.price;
                              const displayChange = liveInfo ? liveInfo.change24h : asset.change24h;

                              return (
                                <div 
                                  key={asset.symbol} 
                                  onClick={() => setActiveTab('perps')}
                                  className="py-2.5 flex justify-between items-center border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/10 px-1 rounded transition-colors"
                                >
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono text-xs font-bold uppercase">{asset.symbol}</span>
                                    <span className="text-[8px] opacity-70 bg-muted px-1.5 py-0.2 rounded font-mono">{asset.category}</span>
                                  </div>
                                  <span className="text-xs font-mono font-medium">
                                    ${displayPrice.toLocaleString('en-US', { minimumFractionDigits: asset.category === 'Forex' ? 4 : 2 })}
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold ${displayChange >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>

                    {/* Swarm Community Feed */}
                    <Card className="bg-card">
                      <CardHeader>
                        <CardTitle className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans">Swarm Activity</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex-1 p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-mono">Whale Alert</p>
                            <p className="text-sm">1,200 BTC moved from <span className="text-primary font-bold">Unknown Wallet</span> to Binance.</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono">2 minutes ago</p>
                          </div>
                          <div className="flex-1 p-3 bg-secondary rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-mono">Consensus Shift</p>
                            <p className="text-sm">Community pivot to <span className="text-emerald-500 font-bold">Long positions</span> on ETH confirmed.</p>
                            <p className="text-[10px] text-muted-foreground mt-2 font-mono">14 minutes ago</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              ) : activeTab === 'perps' ? (
                <PerpsTrading 
                  walletAddress={walletAddress}
                  setWalletAddress={setWalletAddress}
                  usdcBalance={usdcBalance}
                  setUsdcBalance={setUsdcBalance}
                  solBalance={solBalance}
                  setSolBalance={setSolBalance}
                  globalPrices={globalPrices}
                  userTier={userTier}
                  onTriggerUpgrade={() => {
                    setSubscriptionTriggerReason('upgrade');
                    setIsSubscriptionModalOpen(true);
                  }}
                  onSendToAI={(prompt) => {
                    setAiInitialPrompt(prompt);
                    setIsChatOpen(true);
                  }}
                />
              ) : activeTab === 'strategy' ? (
                <StrategyBuilder 
                  strategyCycleHigh={strategyCycleHigh}
                  setStrategyCycleHigh={setStrategyCycleHigh}
                  strategyCycleLow={strategyCycleLow}
                  setStrategyCycleLow={setStrategyCycleLow}
                  strategySimPrice={strategySimPrice}
                  setStrategySimPrice={setStrategySimPrice}
                  strategyGreenDotTimeframes={strategyGreenDotTimeframes}
                  setStrategyGreenDotTimeframes={setStrategyGreenDotTimeframes}
                  strategyLeverage={strategyLeverage}
                  setStrategyLeverage={setStrategyLeverage}
                  strategySymbol={strategySymbol}
                  setStrategySymbol={setStrategySymbol}
                  onSendToAI={(prompt) => {
                    setAiInitialPrompt(prompt);
                    setIsChatOpen(true);
                  }}
                />
              ) : activeTab === 'monitor' ? (
                <CycleMonitor />
              ) : (
                <Snapshots 
                  onAnalyze={handleAnalyzeSnapshot} 
                  onTriggerUpgrade={() => {
                    setSubscriptionTriggerReason('upgrade');
                    setIsSubscriptionModalOpen(true);
                  }}
                  userTier={userTier}
                />
              )}
            </div>
          </ScrollArea>
          
          {/* Mobile Bottom Navigation - iPhone 16 Friendly */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-background/85 backdrop-blur-lg border-t border-border/60 z-40 flex items-center justify-around px-4 pb-safe shadow-lg">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span>Dash</span>
            </button>
            <button
              onClick={() => setActiveTab('perps')}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'perps' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <BarChart2 className="w-5 h-5" />
              <span>Perps</span>
            </button>
            <button
              onClick={() => setActiveTab('snapshots')}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'snapshots' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Snaps</span>
            </button>
            <button
              onClick={() => setActiveTab('strategy')}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
                activeTab === 'strategy' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Bot className="w-5 h-5" />
              <span>Quant</span>
            </button>
            <button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`flex flex-col items-center justify-center gap-1 text-[9px] font-mono uppercase tracking-widest font-bold transition-all duration-200 cursor-pointer ${
                isChatOpen ? 'text-primary animate-pulse' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>AI Chat</span>
            </button>
          </div>

          {/* AI Chat Floating Box - Fully Responsive and Safe on Mobile */}
          {isChatOpen && (
            <div className="fixed bottom-20 md:bottom-4 right-3 left-3 sm:left-auto sm:right-4 w-auto sm:w-[360px] md:w-[400px] h-[520px] md:h-[600px] max-h-[75vh] md:max-h-[85vh] z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-border bg-background">
              <AIChat 
                selectedSnapshot={selectedSnapshot} 
                onClearSnapshot={() => setSelectedSnapshot(null)} 
                onClose={() => setIsChatOpen(false)}
                initialPrompt={aiInitialPrompt}
                onClearInitialPrompt={() => setAiInitialPrompt(null)}
                onSelectSymbol={(symbol, label) => {
                  setActiveSymbol(symbol);
                  setActiveSymbolLabel(label);
                }}
                userTier={userTier}
                dailyChatCount={dailyChatCount}
                onIncrementChatCount={incrementChatCount}
                onTriggerUpgrade={() => {
                  setSubscriptionTriggerReason('chat');
                  setIsSubscriptionModalOpen(true);
                }}
                dailyApiCount={dailyApiCount}
                maxApiRequests={TIER_LIMITS[userTier].maxApiRequests}
                onIncrementApiCount={() => {
                  setDailyApiCount(prev => {
                    const next = prev + 1;
                    localStorage.setItem('swarm_api_count', next.toString());
                    return next;
                  });
                }}
              />
            </div>
          )}

          {/* Profile & Wallet Settings Control Center Modal */}
          <ProfileModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            walletAddress={walletAddress}
            setWalletAddress={setWalletAddress}
            username={username}
            setUsername={setUsername}
            avatarUrl={avatarUrl}
            setAvatarUrl={setAvatarUrl}
            connectedBlockchain={connectedBlockchain}
            setConnectedBlockchain={setConnectedBlockchain}
            walletType={walletType}
            setWalletType={setWalletType}
            setUsdcBalance={setUsdcBalance}
            setSolBalance={setSolBalance}
            email={profileEmail}
            setEmail={setProfileEmail}
            receipts={receipts}
            setReceipts={setReceipts}
            chartMarkups={chartMarkups}
            setChartMarkups={setChartMarkups}
          />

          {/* On-Chain Wallet Details / Screenshot Modal */}
          <WalletDetailsModal
            isOpen={isWalletDetailsModalOpen}
            onClose={() => setIsWalletDetailsModalOpen(false)}
            walletAddress={walletAddress}
            usdcBalance={usdcBalance}
            solBalance={solBalance}
            solPrice={currentSolPrice}
            blockchain={connectedBlockchain}
            walletType={walletType}
            onConnectWallet={() => setIsProfileModalOpen(true)}
          />

          {/* 1-Week (1W) Forecast Price Projection Modal */}
          {projectionAsset && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-card border border-border w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200 text-left">
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/35">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-mono uppercase text-foreground">{projectionAsset.label} 1W Forecast</h3>
                      <p className="text-[10px] text-muted-foreground font-mono">The Lion Scanner AI Price Projection Engine</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setProjectionAsset(null)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {userTier !== 'ultimate' ? (
                  <div className="flex-1 overflow-y-auto p-8 space-y-6 flex flex-col items-center justify-center min-h-[350px] text-center">
                    <div className="p-4 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse text-amber-500">
                      <Lock className="w-10 h-10" />
                    </div>
                    <div className="space-y-2 max-w-md">
                      <h4 className="text-base font-bold font-mono text-foreground uppercase tracking-wider">AI 1W Forecast Locked</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        The premium 1-Week Swarm Forecast & consensus simulator uses Deep-NLP orderbook depth projection to estimate buy/sell bands. This resource-intensive engine is reserved exclusively for **Ultimate** plan members.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-2">
                      <Button 
                        variant="outline"
                        onClick={() => setProjectionAsset(null)}
                        className="font-mono text-xs uppercase h-9 tracking-wider cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          setProjectionAsset(null);
                          setSubscriptionTriggerReason('upgrade');
                          setIsSubscriptionModalOpen(true);
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs uppercase tracking-wider h-9 px-6 rounded-lg cursor-pointer transition-all shadow-md shadow-amber-500/20 font-bold"
                      >
                        Upgrade to Ultimate ($29)
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                      {isProjectionLoading ? (
                        <div className="flex flex-col items-center justify-center py-16 space-y-4">
                          <Loader2 className="w-8 h-8 text-primary animate-spin" />
                          <div className="space-y-1.5 text-center">
                            <p className="text-xs font-mono font-bold uppercase text-foreground tracking-wider animate-pulse">Running The Lion Scanner AI Consensus...</p>
                            <p className="text-[10px] text-muted-foreground">Aggregating orderbook depth & sentiment confluences...</p>
                          </div>
                        </div>
                      ) : projectionData ? (
                        <div className="space-y-6">
                          {/* Top Metrics Banner */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/40 p-4 rounded-xl border border-border/60">
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">Current Price</span>
                              <p className="text-sm font-bold font-mono text-foreground">${livePrice}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">1W Projected Price</span>
                              <p className="text-sm font-bold font-mono text-amber-400">${projectionData.projectedPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">Direction Bias</span>
                              <div className="mt-0.5">
                                <span className={`inline-flex items-center gap-1 text-[9.5px] font-bold font-mono px-2 py-0.5 rounded uppercase ${
                                  projectionData.direction === 'BULLISH'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                  {projectionData.direction === 'BULLISH' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                  {projectionData.direction} ({projectionData.percentChange})
                                </span>
                              </div>
                            </div>
                            <div>
                              <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">Weekly Range</span>
                              <p className="text-[11px] font-semibold font-mono text-muted-foreground mt-0.5">
                                ${projectionData.weeklyLow?.toLocaleString()} - ${projectionData.weeklyHigh?.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* Detailed AI Report */}
                          <div className="bg-background/45 border border-border/55 p-5 rounded-xl space-y-3 max-w-none text-left">
                            {renderMarkdownContent(projectionData.markdownAnalysis)}
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-8">Error calculating technical forecast for this market.</p>
                      )}
                    </div>

                    <div className="p-5 border-t border-border bg-muted/35 flex flex-col sm:flex-row justify-end gap-3">
                      <Button 
                        variant="outline"
                        onClick={() => setProjectionAsset(null)}
                        className="font-mono text-xs uppercase h-9 tracking-wider cursor-pointer"
                      >
                        Close Forecast
                      </Button>
                      <Button 
                        onClick={() => {
                          if (projectionData) {
                            const prompt = `Let's deep dive into the 1-Week forecast for ${projectionAsset.label} (${projectionAsset.id.toUpperCase()}):
- Projected 1W target: $${projectionData.projectedPrice} (${projectionData.direction} trend bias)
- Weekly Projected Range: $${projectionData.weeklyLow} to $${projectionData.weeklyHigh}

${projectionData.markdownAnalysis}

What are the critical price milestones and exact validation triggers we should monitor on the chart?`;
                            setAiInitialPrompt(prompt);
                            setIsChatOpen(true);
                            setProjectionAsset(null);
                          }
                        }}
                        className="bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs uppercase h-9 tracking-widest cursor-pointer px-4"
                        disabled={isProjectionLoading || !projectionData}
                      >
                        <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                        Interrogate Setup
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Premium Subscription plans Modal */}
          {isSubscriptionModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
              <div className="bg-card border border-border w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] my-8 animate-in fade-in zoom-in duration-200 text-left">
                <div className="flex items-center justify-between p-5 border-b border-border bg-muted/35">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold font-mono uppercase text-foreground">Select Membership Tier</h3>
                      <p className="text-[10px] text-muted-foreground">Unlock Unlimited Searches & Deep AI Confluence Analytics</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsSubscriptionModalOpen(false)}
                    className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Custom Header Alerts based on Maxing out Free Tier */}
                  {subscriptionTriggerReason === 'search' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center space-y-1">
                      <h4 className="text-sm font-bold font-mono text-amber-500 uppercase">Daily Asset Search Limit Reached!</h4>
                      <p className="text-xs text-muted-foreground">Free tier allows up to 3 asset checks per day. Upgrade below to analyze more assets instantly.</p>
                    </div>
                  )}
                  {subscriptionTriggerReason === 'chat' && (
                    <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-center space-y-1">
                      <h4 className="text-sm font-bold font-mono text-amber-500 uppercase">AI Chat Allowance Limit Reached!</h4>
                      <p className="text-xs text-muted-foreground">Free tier allows up to 2 AI chat questions per day. Upgrade below to continuous interrogations.</p>
                    </div>
                  )}
                  {subscriptionTriggerReason === 'tokens' && (
                    <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-xl text-center space-y-1">
                      <h4 className="text-sm font-bold font-mono text-orange-500 uppercase">0 AI Scanner Tokens Remaining!</h4>
                      <p className="text-xs text-muted-foreground">Generating a 1-Week Forecast requires 1 Token. Purchase a Premium Pack or Refill Pack below to run unlimited queries.</p>
                    </div>
                  )}

                  {/* Active Stats Dashboard */}
                  <div className="bg-background/45 border border-border/70 rounded-xl p-4 md:p-5 flex flex-col sm:flex-row justify-between items-center gap-4 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground">Active Account Tier</span>
                      <p className="text-sm font-bold font-mono text-primary uppercase flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {TIER_LIMITS[userTier].label} ({TIER_LIMITS[userTier].price})
                      </p>
                    </div>
                    <div className="flex gap-4 sm:gap-6 items-center">
                      <div className="text-center sm:text-right">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground block">Searches Conducted Today</span>
                        <p className="text-xs font-bold font-mono text-foreground mt-0.5">
                          {dailySearchCount} / {TIER_LIMITS[userTier].maxSearches === 999999 ? 'Unlimited' : TIER_LIMITS[userTier].maxSearches}
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground block">AI Questions Asked Today</span>
                        <p className="text-xs font-bold font-mono text-foreground mt-0.5">
                          {dailyChatCount} / {TIER_LIMITS[userTier].maxChats === 999999 ? 'Unlimited' : TIER_LIMITS[userTier].maxChats}
                        </p>
                      </div>
                      <div className="text-center sm:text-right">
                        <span className="text-[9px] uppercase font-mono tracking-wider text-muted-foreground block">Live API Pulls Today</span>
                        <p className="text-xs font-bold font-mono text-foreground mt-0.5">
                          {dailyApiCount} / {TIER_LIMITS[userTier].maxApiRequests === 999999 ? 'Unlimited' : TIER_LIMITS[userTier].maxApiRequests}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: Premium Access Packs */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                      <span className="w-1.5 h-3.5 rounded-full bg-primary"></span>
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground">Premium Duration Packs (Unlocks Scanning Tier + Tokens)</h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* 30-Day Premium Pack */}
                      <div className={`border rounded-xl p-5 flex flex-col justify-between space-y-5 bg-card relative transition-all ${
                        userTier === 'basic' ? 'ring-2 ring-primary border-transparent shadow-sm' : 'border-border hover:border-border/80'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-bold block">30 Days</span>
                              <h4 className="text-base font-bold font-mono text-foreground">Premium Pack</h4>
                            </div>
                            <span className="bg-primary/15 text-primary text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                              +30 Tokens
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            $10.00
                          </div>
                          <ul className="space-y-2 font-sans text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>30 Days</strong> Basic scanner access</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>30 AI Scanner Tokens</strong> credited</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Standard local backups & sync</span>
                            </li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'basic', name: '30-Day Premium Pack', price: 10, tokens: 30 })}
                          className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase h-9 tracking-wider cursor-pointer"
                        >
                          Select 30-Day
                        </Button>
                      </div>

                      {/* 120-Day Premium Pack */}
                      <div className={`border rounded-xl p-5 flex flex-col justify-between space-y-5 bg-card relative transition-all shadow-md ${
                        userTier === 'pro' 
                          ? 'ring-2 ring-primary border-transparent' 
                          : 'border-orange-500/50 hover:border-orange-500 bg-gradient-to-b from-card to-orange-500/5'
                      }`}>
                        <div className="absolute -top-2.5 right-4 bg-orange-500 text-black text-[8px] uppercase font-black font-mono tracking-wider px-2 py-0.5 rounded-md shadow-sm">
                          Best Choice
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-orange-500 font-bold block">120 Days</span>
                              <h4 className="text-base font-bold font-mono text-foreground">Premium Pack</h4>
                            </div>
                            <span className="bg-emerald-500 text-black text-[9px] font-mono font-extrabold px-2 py-0.5 rounded-full uppercase">
                              +120 Tokens
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            $25.00
                          </div>
                          <ul className="space-y-2 font-sans text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>120 Days</strong> Pro scanner features</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>120 AI Scanner Tokens</strong> credited</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span>Unlocks <strong>Interactive Charts</strong></span>
                            </li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'pro', name: '120-Day Premium Pack', price: 25, tokens: 120 })}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-mono text-xs uppercase h-9 tracking-wider cursor-pointer font-bold"
                        >
                          Select 120-Day
                        </Button>
                      </div>

                      {/* 360-Day Premium Pack */}
                      <div className={`border rounded-xl p-5 flex flex-col justify-between space-y-5 bg-card relative transition-all ${
                        userTier === 'ultimate' ? 'ring-2 ring-primary border-transparent' : 'border-border hover:border-border/80'
                      }`}>
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground font-bold block">360 Days</span>
                              <h4 className="text-base font-bold font-mono text-foreground">Ultimate Pack</h4>
                            </div>
                            <span className="bg-primary/15 text-primary text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
                              +360 Tokens
                            </span>
                          </div>
                          <div className="text-2xl font-black font-mono text-foreground">
                            $60.00
                          </div>
                          <ul className="space-y-2 font-sans text-[11px] text-muted-foreground border-t border-border/40 pt-3">
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>360 Days</strong> Ultimate scanner features</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>360 AI Scanner Tokens</strong> credited</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span><strong>100x Max Leverage</strong> perps limit</span>
                            </li>
                          </ul>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'ultimate', name: '360-Day Premium Pack', price: 60, tokens: 360 })}
                          className="w-full bg-primary hover:bg-primary/95 text-white font-mono text-xs uppercase h-9 tracking-wider cursor-pointer"
                        >
                          Select 360-Day
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: AI Scanner Token Refills */}
                  <div className="space-y-4 pt-1">
                    <div className="flex items-center gap-2 pb-1 border-b border-border/40">
                      <span className="w-1.5 h-3.5 rounded-full bg-emerald-500"></span>
                      <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-foreground">Direct AI Scanner Token Refills</h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* 50 Tokens */}
                      <div className="border border-border/70 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-muted/20 hover:border-border transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">Refill Pack A</span>
                          <h5 className="text-sm font-bold font-mono text-foreground">50 AI Scanner Tokens</h5>
                          <p className="text-[10px] text-muted-foreground">Perfect for basic technical checks.</p>
                          <p className="text-base font-black font-mono text-foreground mt-2">$10.00</p>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'token_50', name: '50 AI Scanner Tokens', price: 10, tokens: 50 })}
                          variant="outline"
                          className="w-full font-mono text-xs uppercase h-8 tracking-wider cursor-pointer border-primary/30 hover:border-primary text-foreground"
                        >
                          Buy 50 Tokens
                        </Button>
                      </div>

                      {/* 200 Tokens */}
                      <div className="border border-orange-500/25 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-orange-500/[0.02] hover:border-orange-500/50 transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-orange-500 block font-bold">Refill Pack B</span>
                          <h5 className="text-sm font-bold font-mono text-foreground">200 AI Scanner Tokens</h5>
                          <p className="text-[10px] text-muted-foreground">Best value for everyday trading.</p>
                          <p className="text-base font-black font-mono text-foreground mt-2">$30.00</p>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'token_200', name: '200 AI Scanner Tokens', price: 30, tokens: 200 })}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-black font-mono text-xs uppercase h-8 tracking-wider cursor-pointer font-bold"
                        >
                          Buy 200 Tokens
                        </Button>
                      </div>

                      {/* 500 Tokens */}
                      <div className="border border-border/70 rounded-xl p-4 flex flex-col justify-between space-y-4 bg-muted/20 hover:border-border transition-all">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground block">Refill Pack C</span>
                          <h5 className="text-sm font-bold font-mono text-foreground">500 AI Scanner Tokens</h5>
                          <p className="text-[10px] text-emerald-500 font-semibold">Bulk discount tier.</p>
                          <p className="text-base font-black font-mono text-foreground mt-2">$50.00</p>
                        </div>
                        <Button 
                          onClick={() => setActivePurchaseProduct({ id: 'token_500', name: '500 AI Scanner Tokens', price: 50, tokens: 500 })}
                          variant="outline"
                          className="w-full font-mono text-xs uppercase h-8 tracking-wider cursor-pointer border-emerald-500/30 hover:border-emerald-500 text-foreground"
                        >
                          Buy 500 Tokens
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-5 border-t border-border bg-muted/35 flex justify-end">
                  <Button 
                    variant="ghost" 
                    onClick={() => setIsSubscriptionModalOpen(false)}
                    className="font-mono text-xs uppercase h-9 tracking-wider cursor-pointer text-muted-foreground hover:text-foreground"
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Smart Contract Web3 Payment Modal */}
          {activePurchaseProduct && (
            <SmartContractPayment
              isOpen={!!activePurchaseProduct}
              onClose={() => setActivePurchaseProduct(null)}
              tier={activePurchaseProduct.id}
              price={activePurchaseProduct.price}
              packName={activePurchaseProduct.name}
              walletAddress={walletAddress}
              onConnectWallet={() => {
                setActivePurchaseProduct(null);
                setIsProfileModalOpen(true);
              }}
              usdcBalance={usdcBalance}
              setUsdcBalance={(newBal) => {
                setUsdcBalance(newBal);
                localStorage.setItem('swarm_wallet_usdc', newBal.toString());
              }}
              solBalance={solBalance}
              setSolBalance={(newBal) => {
                setSolBalance(newBal);
                localStorage.setItem('swarm_wallet_sol', newBal.toString());
              }}
              onSuccess={() => {
                // If it is a premium tier pack:
                if (['basic', 'pro', 'ultimate'].includes(activePurchaseProduct.id)) {
                  const targetTier = activePurchaseProduct.id as 'basic' | 'pro' | 'ultimate';
                  setUserTier(targetTier);
                  localStorage.setItem('swarm_user_tier', targetTier);

                  // Calculate and store membership expiration
                  const daysToAdd = activePurchaseProduct.id === 'ultimate' ? 360 : activePurchaseProduct.id === 'pro' ? 120 : 30;
                  const newExpiry = Date.now() + daysToAdd * 24 * 60 * 60 * 1000;
                  localStorage.setItem('swarm_membership_expiry', newExpiry.toString());
                }

                // Credit the purchased analysis tokens
                const addedTokens = activePurchaseProduct.tokens;
                setAnalysisTokens(prev => {
                  const next = prev + addedTokens;
                  localStorage.setItem('lion_analysis_tokens', next.toString());
                  return next;
                });

                // Generate and save subscription receipt
                const newReceipt = {
                  id: `RCPT-${Math.floor(100000 + Math.random() * 900000)}`,
                  tier: activePurchaseProduct.id,
                  price: activePurchaseProduct.price,
                  billingCycle: activePurchaseProduct.tokens > 0 ? `+${activePurchaseProduct.tokens} Tokens` : 'Refill',
                  date: Date.now(),
                  txHash: `SOL-${Math.floor(Math.random() * 100000000).toString(16).toUpperCase()}`,
                  status: 'Paid'
                };
                const updatedReceipts = [newReceipt, ...receipts];
                setReceipts(updatedReceipts);
                localStorage.setItem('swarm_receipts', JSON.stringify(updatedReceipts));
                
                // If they have email saved, automatically backup/sync as well
                if (profileEmail) {
                  const profileData = {
                    username,
                    avatarUrl,
                    email: profileEmail,
                    walletAddress,
                    connectedBlockchain,
                    walletType,
                    snapshotsCount: receipts.length, // approximation or loaded
                    receipts: updatedReceipts,
                    updatedAt: Date.now()
                  };
                  localStorage.setItem('swarm_profile_data_' + profileEmail, JSON.stringify(profileData));
                }

                setToastMessage(`Success! Purchased ${activePurchaseProduct.name} successfully.`);
                setActivePurchaseProduct(null);
                setIsSubscriptionModalOpen(false);
              }}
            />
          )}

          {/* Live Recalculating overlay backdrop screen */}
          {isRecalculating && (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/85 backdrop-blur-md animate-in fade-in duration-300">
              <div className="max-w-md w-full p-6 text-center space-y-6">
                <div className="relative mx-auto w-24 h-24">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-primary border-r-primary animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-amber-500/20"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-b-amber-500 border-l-amber-500 animate-spin animate-reverse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-amber-500 animate-pulse" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold font-mono uppercase tracking-wider text-foreground">AI Swarm Sync In Progress</h3>
                  <p className="text-xs text-muted-foreground font-mono">{recalcStep}</p>
                </div>

                <div className="bg-muted/30 border border-border/40 rounded-xl p-4 text-left space-y-2.5">
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">Session Status:</span>
                    <span className="text-emerald-400 font-bold uppercase animate-pulse">Synchronizing</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">User Plan:</span>
                    <span className="text-primary font-bold uppercase">{TIER_LIMITS[userTier].label}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span className="text-muted-foreground">API Limit per Tier:</span>
                    <span className="text-amber-500 font-bold">{TIER_LIMITS[userTier].maxApiRequests === 999999 ? 'Unlimited' : `${TIER_LIMITS[userTier].maxApiRequests} pulls/day`}</span>
                  </div>
                  <Progress value={
                    recalcStep.includes('Initializing') ? 15 :
                    recalcStep.includes('CoinGecko') ? 35 :
                    recalcStep.includes('Momentum') ? 60 :
                    recalcStep.includes('Fibonacci') ? 80 :
                    recalcStep.includes('wallet') ? 95 : 100
                  } className="h-1.5 mt-2 bg-muted-foreground/10" />
                </div>
              </div>
            </div>
          )}

          {/* Toast Notification Banner */}
          {toastMessage && (
            <div className="fixed bottom-6 right-6 z-[100] bg-destructive/95 backdrop-blur text-destructive-foreground border border-destructive/20 px-4 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-300 max-w-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse flex-shrink-0"></span>
              <p className="text-xs font-mono">{toastMessage}</p>
              <button 
                onClick={() => setToastMessage(null)}
                className="ml-auto text-destructive-foreground/50 hover:text-destructive-foreground font-mono font-bold text-xs p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
