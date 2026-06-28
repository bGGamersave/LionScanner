import {
  Activity,
  BarChart2,
  Bell,
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
  Users
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import Chart from './components/Chart';
import Snapshots, { SnapshotData } from './components/Snapshots';
import AIChat from './components/AIChat';
import PerpsTrading from './components/PerpsTrading';
import FullPortTimer from './components/FullPortTimer';
import ProfileModal from './components/ProfileModal';
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

export default function App() {
  const [isDark, setIsDark] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'perps' | 'snapshots'>('dashboard');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<SnapshotData | null>(null);
  const [activeInterval, setActiveInterval] = useState<string>('D');
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | null>(null);

  const [activeSymbol, setActiveSymbol] = useState<string>('BINANCE:BTCUSDT');
  const [activeSymbolLabel, setActiveSymbolLabel] = useState<string>('BTC / USDT');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [livePrice, setLivePrice] = useState<number | string>('64,212.45');
  const [liveChange, setLiveChange] = useState<number | string>('+2.45%');
  const [liveVolume, setLiveVolume] = useState<string>('$28.4B');
  const [liveHigh, setLiveHigh] = useState<number | string>('64,850.00');
  const [liveLow, setLiveLow] = useState<number | string>('63,200.00');

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
    const fetchQuote = async () => {
      const matched = SEARCHABLE_MARKETS.find(m => m.symbol === activeSymbol);
      const ticker = matched ? matched.id.toUpperCase() : 'BTC';
      try {
        const res = await fetch(`/api/coingecko/quote?symbol=${ticker}`);
        if (res.ok) {
          const result = await res.json();
          if (result && result.data && result.data[ticker]) {
            const data = result.data[ticker].quote.USD;
            setLivePrice(data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setLiveChange(`${data.percent_change_24h >= 0 ? '+' : ''}${data.percent_change_24h.toFixed(2)}%`);
            setLiveVolume(data.volume_24h >= 1e9 
              ? `$${(data.volume_24h / 1e9).toFixed(2)}B` 
              : `$${(data.volume_24h / 1e6).toFixed(2)}M`
            );
            setLiveHigh(data.high_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
            setLiveLow(data.low_24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
        }
      } catch (error) {
        console.error("Failed to fetch live quote:", error);
      }
    };
    fetchQuote();
    const interval = setInterval(fetchQuote, 30000);
    return () => clearInterval(interval);
  }, [activeSymbol]);

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

  const [usdcBalance, setUsdcBalance] = useState<number>(() => {
    const val = localStorage.getItem('swarm_wallet_usdc');
    return val ? parseFloat(val) : 0;
  });
  const [solBalance, setSolBalance] = useState<number>(() => {
    const val = localStorage.getItem('swarm_wallet_sol');
    return val ? parseFloat(val) : 0;
  });

  useEffect(() => {
    if (walletAddress) {
      localStorage.setItem('swarm_wallet_address', walletAddress);
    } else {
      localStorage.removeItem('swarm_wallet_address');
      localStorage.removeItem('swarm_wallet_usdc');
      localStorage.removeItem('swarm_wallet_sol');
    }
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

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/50 flex flex-col hidden md:flex shrink-0">
        <div className="h-16 flex items-center px-4 md:px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              L
            </div>
            <span className="text-lg md:text-xl lion-serif tracking-tight pr-2">Lions Trading Swarm</span>
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
            <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
              <Activity className="mr-2 h-4 w-4" />
              Live Signals
              <Badge variant="default" className="ml-auto bg-primary text-primary-foreground font-mono">3</Badge>
            </Button>
            <Button 
              variant={activeTab === 'perps' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'perps' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('perps')}
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              Perps Platform
              <Badge variant="outline" className="ml-auto border-emerald-500/30 text-emerald-500 text-[8px] font-mono font-bold">PHANTOM</Badge>
            </Button>
            <Button 
              variant={activeTab === 'snapshots' ? 'secondary' : 'ghost'} 
              className={`w-full justify-start ${activeTab !== 'snapshots' ? 'text-muted-foreground hover:text-foreground' : ''}`}
              onClick={() => setActiveTab('snapshots')}
            >
              <Camera className="mr-2 h-4 w-4" />
              My Snapshots
            </Button>
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
              <span className="text-sm font-bold font-mono tracking-tight text-foreground uppercase">Lions Swarm</span>
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
                                onMouseDown={() => {
                                  setActiveSymbol(asset.symbol);
                                  setActiveSymbolLabel(asset.label);
                                  setSearchQuery('');
                                }}
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
                      <h3 className="text-sm font-semibold tracking-tight uppercase font-mono text-primary flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        Lions 24H Swarm Strategy Room
                      </h3>
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

                    <Card className="bg-card hidden md:block">
                      <CardContent className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-[10px] tracking-widest uppercase font-medium text-muted-foreground">Portfolio Balance</p>
                            <h2 className="text-2xl lg:text-3xl font-bold font-mono">$142,804.12</h2>
                          </div>
                        </div>
                        <div className="mt-4 flex flex-col justify-between h-[42px]">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <span className="text-emerald-500 font-medium font-mono flex items-center mr-2">
                              +$1,402.30 today
                            </span>
                          </div>
                          <Button variant="outline" size="sm" className="w-full text-[10px] h-6 uppercase tracking-widest mt-2 border-border text-muted-foreground">View Details</Button>
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
                          <Chart symbol={activeSymbol} interval={activeInterval} height={520} />
                        </CardContent>
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
                    <Card className="bg-card flex flex-col h-[500px]">
                      <CardHeader className="pb-3 border-b border-border/50">
                        <CardTitle className="text-lg flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground font-sans">
                          Swarm Pro Signals
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                          </span>
                        </CardTitle>
                      </CardHeader>
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
                            {PERP_ASSETS.slice(0, 8).map((asset) => (
                              <div 
                                key={asset.symbol} 
                                onClick={() => setActiveTab('perps')}
                                className="py-2.5 flex justify-between items-center border-b border-border/40 last:border-0 cursor-pointer hover:bg-muted/10 px-1 rounded transition-colors"
                              >
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-xs font-bold uppercase">{asset.symbol}</span>
                                  <span className="text-[8px] opacity-70 bg-muted px-1.5 py-0.2 rounded font-mono">{asset.category}</span>
                                </div>
                                <span className="text-xs font-mono font-medium">${asset.price.toLocaleString('en-US', { minimumFractionDigits: asset.category === 'Forex' ? 4 : 2 })}</span>
                                <span className={`text-[10px] font-mono font-bold ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                                </span>
                              </div>
                            ))}
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
                  onSendToAI={(prompt) => {
                    setAiInitialPrompt(prompt);
                    setIsChatOpen(true);
                  }}
                />
              ) : (
                <Snapshots onAnalyze={handleAnalyzeSnapshot} />
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
          />
        </div>
      </main>
    </div>
  );
}
