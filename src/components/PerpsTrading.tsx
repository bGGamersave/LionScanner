import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  ChevronRight, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  DollarSign,
  Briefcase,
  HelpCircle,
  Play,
  RotateCcw,
  Sparkles,
  ArrowRightLeft,
  History
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PERP_ASSETS, PerpAsset, PRO_SIGNALS } from '../data/perpsAndSignals';
import Chart from './Chart';

interface SettledTrade {
  id: string;
  symbol: string;
  name: string;
  type: 'Long' | 'Short';
  entryPrice: number;
  exitPrice: number;
  leverage: number;
  margin: number;
  size: number;
  realizedPnl: number;
  realizedPnlPercent: number;
  settledAt: string;
  outcome: 'Closed by User' | 'Liquidated';
}

interface PerpsTradingProps {
  walletAddress: string | null;
  setWalletAddress: (address: string | null) => void;
  usdcBalance: number;
  setUsdcBalance: (balance: number | ((prev: number) => number)) => void;
  solBalance: number;
  setSolBalance: (balance: number | ((prev: number) => number)) => void;
  onSendToAI: (prompt: string) => void;
}

interface Position {
  id: string;
  symbol: string;
  name: string;
  type: 'Long' | 'Short';
  entryPrice: number;
  markPrice: number;
  leverage: number;
  margin: number;
  size: number; // calculated in USD = margin * leverage
  liquidationPrice: number;
  pnl: number; // USD PnL
  pnlPercent: number;
  openedAt: string;
}

export default function PerpsTrading({
  walletAddress,
  setWalletAddress,
  usdcBalance,
  setUsdcBalance,
  solBalance,
  setSolBalance,
  onSendToAI
}: PerpsTradingProps) {
  // Navigation & filtering states
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'Crypto' | 'Stocks' | 'Commodities' | 'Forex'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<PerpAsset>(PERP_ASSETS[0]);
  
  // Phantom Connector UI state
  const [isConnectingPhantom, setIsConnectingPhantom] = useState(false);
  const [phantomPopupOpen, setPhantomPopupOpen] = useState(false);
  
  // Perps Trading Form States
  const [tradeSide, setTradeSide] = useState<'Long' | 'Short'>('Long');
  const [orderType, setOrderType] = useState<'Market' | 'Limit'>('Market');
  const [limitPriceInput, setLimitPriceInput] = useState<string>('');
  const [marginInput, setMarginInput] = useState<string>('500');
  const [leverage, setLeverage] = useState<number>(10);
  
  // Transaction Confirmation Popup State
  const [showSignPopup, setShowSignPopup] = useState(false);
  const [signStatus, setSignStatus] = useState<'idle' | 'signing' | 'success' | 'failed'>('idle');
  const [signTargetPosition, setSignTargetPosition] = useState<{
    asset: PerpAsset;
    side: 'Long' | 'Short';
    margin: number;
    leverage: number;
    price: number;
    orderType: 'Market' | 'Limit';
  } | null>(null);

  // Active Positions State
  const [positions, setPositions] = useState<Position[]>(() => {
    const saved = localStorage.getItem('swarm_positions');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved positions:", err);
      }
    }
    return [
      {
        id: 'POS-001',
        symbol: 'SOL/USD',
        name: 'Solana',
        type: 'Long',
        entryPrice: 142.50,
        markPrice: 145.82,
        leverage: 15,
        margin: 250,
        size: 3750,
        liquidationPrice: 133.00,
        pnl: 87.36,
        pnlPercent: 34.94,
        openedAt: '2 hours ago'
      },
      {
        id: 'POS-002',
        symbol: 'GOLD/USD',
        name: 'Gold Spot',
        type: 'Long',
        entryPrice: 2405.00,
        markPrice: 2412.50,
        leverage: 20,
        margin: 500,
        size: 10000,
        liquidationPrice: 2284.75,
        pnl: 31.18,
        pnlPercent: 6.24,
        openedAt: '4 hours ago'
      }
    ];
  });

  const [settledTrades, setSettledTrades] = useState<SettledTrade[]>(() => {
    const saved = localStorage.getItem('swarm_settled_trades');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (err) {
        console.error("Failed to parse saved settled trades:", err);
      }
    }
    return [
      {
        id: 'SET-001',
        symbol: 'BTC/USD',
        name: 'Bitcoin',
        type: 'Long',
        entryPrice: 63840.00,
        exitPrice: 65120.00,
        leverage: 10,
        margin: 100,
        size: 1000,
        realizedPnl: 20.05,
        realizedPnlPercent: 20.05,
        settledAt: new Date(Date.now() - 3600 * 24 * 1000).toLocaleString(),
        outcome: 'Closed by User'
      }
    ];
  });

  const [positionsTab, setPositionsTab] = useState<'active' | 'history'>('active');

  useEffect(() => {
    localStorage.setItem('swarm_positions', JSON.stringify(positions));
  }, [positions]);

  useEffect(() => {
    localStorage.setItem('swarm_settled_trades', JSON.stringify(settledTrades));
  }, [settledTrades]);

  // Autonomous Liquidation Engine Monitoring
  useEffect(() => {
    // Check if any position hits <= -95% pnlPercent (maintenance liquidation threshold)
    const toLiquidate = positions.filter(pos => pos.pnlPercent <= -95);
    if (toLiquidate.length > 0) {
      const liqSettleLogs: SettledTrade[] = toLiquidate.map(pos => ({
        id: `SET-LIQ-${Math.floor(100 + Math.random() * 900)}`,
        symbol: pos.symbol,
        name: pos.name,
        type: pos.type,
        entryPrice: pos.entryPrice,
        exitPrice: pos.markPrice,
        leverage: pos.leverage,
        margin: pos.margin,
        size: pos.size,
        realizedPnl: -pos.margin, // Entire isolated margin is lost as collateral liquidation
        realizedPnlPercent: -100,
        settledAt: new Date().toLocaleString(),
        outcome: 'Liquidated'
      }));

      setSettledTrades(prev => [...liqSettleLogs, ...prev]);
      // Remove liquidated positions from active list
      setPositions(prev => prev.filter(p => !toLiquidate.some(l => l.id === p.id)));
    }
  }, [positions]);

  // Asset Price simulation to show organic fluctuating trading floor
  const [simulatedPrices, setSimulatedPrices] = useState<Record<string, number>>(
    PERP_ASSETS.reduce((acc, curr) => ({ ...acc, [curr.symbol]: curr.price }), {})
  );

  // Synchronize limit input when asset changes
  useEffect(() => {
    const activePrice = simulatedPrices[selectedAsset.symbol] || selectedAsset.price;
    setLimitPriceInput(activePrice.toFixed(selectedAsset.category === 'Forex' ? 4 : 2));
  }, [selectedAsset, simulatedPrices]);

  // Simulate pricing updates (ticks) every 3 seconds to represent living markets
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedPrices(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(symbol => {
          const originalAsset = PERP_ASSETS.find(a => a.symbol === symbol);
          if (!originalAsset) return;
          
          const volatility = symbol.includes('BTC') || symbol.includes('SOL') ? 0.0015 : 0.0006; // Crypto is more volatile
          const direction = Math.random() > 0.48 ? 1 : -1; // subtle upward bias
          const percentChange = Math.random() * volatility * direction;
          const currentPrice = next[symbol];
          next[symbol] = currentPrice * (1 + percentChange);
        });
        return next;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  // Update positions based on fluctuating simulated prices
  useEffect(() => {
    setPositions(prev => 
      prev.map(pos => {
        const activePrice = simulatedPrices[pos.symbol];
        if (!activePrice) return pos;

        // Calculate P&L
        const priceDiff = activePrice - pos.entryPrice;
        const multiplier = pos.type === 'Long' ? 1 : -1;
        
        // P&L calculation: (Current Price - Entry Price) / Entry Price * Size
        const pnlFraction = (priceDiff / pos.entryPrice) * multiplier;
        const rawPnl = parseFloat((pos.size * pnlFraction).toFixed(2));
        const rawPnlPercent = parseFloat((pnlFraction * pos.leverage * 100).toFixed(2));

        // Isolated Margin Safety Net: Cap loss at 100% of collateral margin
        const pnlPercent = Math.max(-100, rawPnlPercent);
        const pnl = Math.max(-pos.margin, rawPnl);

        return {
          ...pos,
          markPrice: parseFloat(activePrice.toFixed(pos.symbol.includes('Forex') ? 4 : 2)),
          pnl,
          pnlPercent
        };
      })
    );
  }, [simulatedPrices]);

  // Filters for Perp instruments List
  const filteredAssets = PERP_ASSETS.filter(asset => {
    const matchesCategory = selectedCategory === 'All' || asset.category === selectedCategory;
    const matchesSearch = asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          asset.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Phantom connect mockup
  const triggerPhantomConnection = () => {
    setIsConnectingPhantom(true);
    setPhantomPopupOpen(true);
  };

  const handleConfirmPhantomConnect = () => {
    setSignStatus('signing');
    setTimeout(() => {
      setWalletAddress('LioNPhAn7oMvE8pZT2y9RcsWSvSqC8u86CAd3791aB');
      setUsdcBalance(12500);
      setSolBalance(82.45);
      setPhantomPopupOpen(false);
      setIsConnectingPhantom(false);
      setSignStatus('idle');
    }, 1200);
  };

  const handleDisconnectWallet = () => {
    setWalletAddress(null);
  };

  // Create a Perp position execution
  const handleInitiateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) {
      triggerPhantomConnection();
      return;
    }

    const marginVal = parseFloat(marginInput);
    if (isNaN(marginVal) || marginVal <= 0) {
      alert("Please enter a valid margin amount");
      return;
    }

    if (marginVal > usdcBalance) {
      alert("Insufficient USDC collateral balance in your Phantom Wallet");
      return;
    }

    const entryPrice = orderType === 'Market' 
      ? (simulatedPrices[selectedAsset.symbol] || selectedAsset.price)
      : parseFloat(limitPriceInput);

    if (isNaN(entryPrice) || entryPrice <= 0) {
      alert("Please check entry price values");
      return;
    }

    // Set signed target details and trigger Phantom approval popup
    setSignTargetPosition({
      asset: selectedAsset,
      side: tradeSide,
      margin: marginVal,
      leverage,
      price: entryPrice,
      orderType
    });
    setSignStatus('idle');
    setShowSignPopup(true);
  };

  const approvePositionOnChain = () => {
    if (!signTargetPosition) return;

    setSignStatus('signing');
    
    // Simulate transaction processing & chain settling (standard Solana speed)
    setTimeout(() => {
      const positionSize = signTargetPosition.margin * signTargetPosition.leverage;
      
      // Calculate liquidation limit
      const liqBuffer = 1 / signTargetPosition.leverage;
      const liqFactor = signTargetPosition.side === 'Long' ? (1 - liqBuffer) : (1 + liqBuffer);
      const liquidationPrice = signTargetPosition.price * liqFactor;

      const newPosition: Position = {
        id: `POS-${Math.floor(100 + Math.random() * 900)}`,
        symbol: signTargetPosition.asset.symbol,
        name: signTargetPosition.asset.name,
        type: signTargetPosition.side,
        entryPrice: signTargetPosition.price,
        markPrice: signTargetPosition.price,
        leverage: signTargetPosition.leverage,
        margin: signTargetPosition.margin,
        size: positionSize,
        liquidationPrice: parseFloat(liquidationPrice.toFixed(signTargetPosition.asset.category === 'Forex' ? 4 : 2)),
        pnl: 0,
        pnlPercent: 0,
        openedAt: 'Just now'
      };

      // update standard wallet balances (lock margin)
      setUsdcBalance(prev => prev - signTargetPosition.margin);
      setSolBalance(prev => prev - 0.00005); // Network Transaction Fee mock
      setPositions(prev => [newPosition, ...prev]);
      
      setSignStatus('success');
      
      setTimeout(() => {
        setShowSignPopup(false);
        setSignTargetPosition(null);
        setSignStatus('idle');
      }, 1500);

    }, 1800);
  };

  const handleClosePosition = (id: string) => {
    const target = positions.find(p => p.id === id);
    if (!target) return;

    // Refund collateral + settle realized profits or losses immediately into usdcBalance
    const totalRefund = target.margin + target.pnl;
    
    // Safety check that balance is positive
    setUsdcBalance(prev => Math.max(0, parseFloat((prev + totalRefund).toFixed(2))));
    
    // Append to historical settled trades ledger
    const newSettledTrade: SettledTrade = {
      id: `SET-${Math.floor(100 + Math.random() * 900)}`,
      symbol: target.symbol,
      name: target.name,
      type: target.type,
      entryPrice: target.entryPrice,
      exitPrice: target.markPrice,
      leverage: target.leverage,
      margin: target.margin,
      size: target.size,
      realizedPnl: target.pnl,
      realizedPnlPercent: target.pnlPercent,
      settledAt: new Date().toLocaleString(),
      outcome: 'Closed by User'
    };

    setSettledTrades(prev => [newSettledTrade, ...prev]);

    // Remove position
    setPositions(prev => prev.filter(p => p.id !== id));
  };

  // calculated properties for current order
  const calculatedPositionSize = parseFloat(marginInput) ? parseFloat(marginInput) * leverage : 0;
  const entryPriceEstimate = simulatedPrices[selectedAsset.symbol] || selectedAsset.price;
  const estLiqPrice = tradeSide === 'Long' 
    ? entryPriceEstimate * (1 - 1 / leverage)
    : entryPriceEstimate * (1 + 1 / leverage);

  const formatCurrency = (val: number, isForex = false) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: isForex ? 4 : 2,
      maximumFractionDigits: isForex ? 4 : 2,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Upper Status Wallet Link Banner */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-card border border-border/70 p-4 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight uppercase font-mono text-primary flex items-center gap-1.5">
              Solana Perpetual Dex Interface
            </h3>
            <p className="text-xs text-muted-foreground mr-2">
              Provide cross-margin liquidity through Phantom to trade stocks, index composites, commodity spots, and crypto tokens.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 select-none self-end sm:self-auto">
          {walletAddress ? (
            <div className="flex items-center gap-2 bg-background border border-emerald-500/20 px-3 py-1.5 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <div className="text-left font-mono">
                <span className="text-[10px] text-muted-foreground block leading-none">PHANTOM WALLET</span>
                <span className="text-xs font-semibold text-foreground">{walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}</span>
              </div>
              <div className="h-8 w-px bg-border/40 mx-1"></div>
              <div className="font-mono text-right text-xs">
                <span className="text-primary font-bold block leading-none text-[9px]">COLLATERAL</span>
                <span>{usdcBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleDisconnectWallet} 
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                title="Disconnect Wallet"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button 
              onClick={triggerPhantomConnection} 
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-mono uppercase text-xs tracking-wider px-4 py-2 hover:indigo-shadow"
            >
              <Wallet className="w-4 h-4 mr-2" />
              Connect Phantom Wallet
            </Button>
          )}
        </div>
      </div>

      {/* Main Suite Container */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Col 1: Markets Navigation Sidebar */}
        <div className="xl:col-span-1 space-y-4">
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">Perp Instruments</CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filter symbols..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-background border-border pl-8 text-xs h-8 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>
              <div className="flex flex-wrap gap-1 mt-2.5">
                {(['All', 'Crypto', 'Stocks', 'Commodities', 'Forex'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded cursor-pointer transition-all border ${
                      selectedCategory === cat 
                        ? 'bg-primary/10 border-primary text-primary font-semibold' 
                        : 'bg-muted/40 border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </CardHeader>
            <ScrollArea className="h-[430px]">
              <div className="p-2 space-y-1">
                {filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => {
                    const isSelected = selectedAsset.symbol === asset.symbol;
                    const price = simulatedPrices[asset.symbol] || asset.price;
                    const isForex = asset.category === 'Forex';
                    return (
                      <button
                        key={asset.symbol}
                        onClick={() => setSelectedAsset(asset)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-lg border transition-all text-left cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/10 border-primary shadow-sm' 
                            : 'border-transparent hover:bg-muted/30 hover:border-border/40'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono tracking-tight text-foreground">{asset.symbol}</span>
                            <Badge variant="outline" className="text-[7.5px] px-1 py-0 font-mono tracking-normal leading-none bg-muted hover:bg-muted text-muted-foreground border-border">
                              {asset.category}
                            </Badge>
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate block max-w-[130px]">{asset.name}</span>
                        </div>
                        <div className="text-right space-y-0.5">
                          <span className="text-xs font-mono font-bold block">{formatCurrency(price, isForex)}</span>
                          <span className={`text-[9px] font-mono leading-none ${asset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                            {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                          </span>
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No perpetual markets found
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

        {/* Col 2 & 3: The Interactive Live Chart and Terminal Execution */}
        <div className="xl:col-span-2 space-y-6">
          <Card className="bg-card flex flex-col min-h-[640px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2 shrink-0 border-b border-border/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-mono text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">
                    {selectedAsset.category} Perp
                  </span>
                  <CardTitle className="font-mono tracking-tight text-lg">{selectedAsset.symbol}</CardTitle>
                </div>
                <CardDescription className="text-xs">{selectedAsset.name} Liquid Perp contract on Solana</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-xl font-mono text-emerald-500 font-bold">
                  {formatCurrency(simulatedPrices[selectedAsset.symbol] || selectedAsset.price, selectedAsset.category === 'Forex')}
                </p>
                <div className="flex items-center justify-end gap-2 text-[10px] text-muted-foreground font-mono mt-0.5">
                  <span className={selectedAsset.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                    {selectedAsset.change24h >= 0 ? '+' : ''}{selectedAsset.change24h.toFixed(2)}%
                  </span>
                  <span>|</span>
                  <span>Funding: <span className="text-primary">{selectedAsset.fundingRate}</span></span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 pb-0 overflow-hidden relative min-h-[550px]">
              <Chart symbol={selectedAsset.tvSymbol} interval="D" height={550} />
            </CardContent>
          </Card>
        </div>

        {/* Col 4: Trade Execution Margin Order Panel */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="bg-card">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans">Order Terminal</CardTitle>
              <CardDescription className="text-[10px]">Execute leverage perps backed on-chain</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleInitiateOrder} className="space-y-4">
                
                {/* 1. Long Short Toggle */}
                <div className="grid grid-cols-2 gap-1 border border-border p-1 bg-background rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTradeSide('Long')}
                    className={`py-1.5 text-xs font-mono uppercase font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tradeSide === 'Long'
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    Long
                  </button>
                  <button
                    type="button"
                    onClick={() => setTradeSide('Short')}
                    className={`py-1.5 text-xs font-mono uppercase font-bold rounded-md flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      tradeSide === 'Short'
                        ? 'bg-red-500 text-white shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                    Short
                  </button>
                </div>

                {/* 2. Order Mode selection */}
                <div className="flex gap-1 border-b border-border/50 pb-2">
                  {(['Market', 'Limit'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setOrderType(type)}
                      className={`flex-1 py-1 text-[11px] uppercase font-mono tracking-tight cursor-pointer ${
                        orderType === type
                          ? 'text-primary font-bold border-b-2 border-primary'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* 3. Limit Price Input (Only for Limit trades) */}
                {orderType === 'Limit' && (
                  <div className="space-y-1.5">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground font-bold leading-none">Limit Order Price ($)</label>
                    <Input
                      type="number"
                      step={selectedAsset.category === 'Forex' ? '0.0001' : '0.01'}
                      value={limitPriceInput}
                      onChange={(e) => setLimitPriceInput(e.target.value)}
                      className="bg-background font-mono text-sm border-border h-9"
                    />
                  </div>
                )}

                {/* 4. Cross-margin USDC Collateral sizing */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[9.5px] font-mono uppercase tracking-wider text-muted-foreground font-bold leading-none">Margin Collateral</label>
                    <span className="text-[9px] font-mono text-muted-foreground">Collat Balance: <span className="font-semibold text-primary">{usdcBalance ? formatCurrency(usdcBalance) : '$0.00'}</span></span>
                  </div>
                  <div className="relative">
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      placeholder="Enter margin..."
                      value={marginInput}
                      onChange={(e) => setMarginInput(e.target.value)}
                      className="bg-background font-mono text-sm border-border pl-8 pr-14 h-9"
                    />
                    <div className="absolute left-2.5 top-2 cursor-default text-muted-foreground text-xs font-bold">$</div>
                    <div className="absolute right-2.5 top-2.5 text-muted-foreground text-[10px] font-bold font-mono">USDC</div>
                  </div>
                  <div className="grid grid-cols-4 gap-1 pt-1">
                    {['100', '250', '500', '1000'].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMarginInput(val)}
                        className="p-1 text-[10px] font-mono border border-border/80 text-muted-foreground rounded hover:bg-muted/50 cursor-pointer text-center"
                      >
                        +${val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Custom Leverage slider */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-center text-[9.5px] font-mono uppercase tracking-wider font-bold">
                    <span className="text-muted-foreground">Leverage Leverage</span>
                    <span className="text-primary font-bold">{leverage}x</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="100"
                    step="1"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full accent-primary bg-muted rounded-lg h-1 h-px-slider cursor-pointer"
                  />
                  <div className="flex justify-between text-[8px] text-muted-foreground font-mono leading-none pt-0.5">
                    <span>2x</span>
                    <span>20x</span>
                    <span>50x</span>
                    <span>100x Max</span>
                  </div>

                  {leverage >= 25 && (
                    <div className="flex items-center gap-1.5 text-yellow-500/90 text-[8.5px] font-mono bg-yellow-500/5 border border-yellow-500/20 p-2 rounded mt-1.5 leading-tight">
                      <AlertTriangle className="w-3 h-3 shrink-0" />
                      <span>Warning: High leverage ({leverage}x) increases liquidation risk substantially. Check margin zones carefully.</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-border/40 my-3"></div>

                {/* Position Sizing Calculations & Summary */}
                <div className="space-y-1.5 font-mono text-[10px] bg-background/50 border border-border/25 p-2.5 rounded-lg">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">POSITION VALUE</span>
                    <span className="font-semibold text-foreground">
                      {formatCurrency(calculatedPositionSize)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LIQ. PRICE EST.</span>
                    <span className="font-semibold text-red-500">
                      {marginInput && calculatedPositionSize ? formatCurrency(estLiqPrice, selectedAsset.category === 'Forex') : '$0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/20 pt-1.5 mt-1.5">
                    <span className="text-muted-foreground">EST. SPREAD</span>
                    <span className="font-semibold text-foreground">
                      {selectedAsset.category === 'Crypto' ? '0.05%' : selectedAsset.category === 'Stocks' ? '0.08%' : selectedAsset.category === 'Commodities' ? '0.04%' : '0.01%'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">EST. SLIPPAGE</span>
                    <span className="font-semibold text-primary">
                      {marginInput && calculatedPositionSize ? (Math.max(0.01, calculatedPositionSize * 0.000002)).toFixed(3) + '%' : '0.010%'}
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-border/20 pt-1.5 mt-1.5 text-[9px]">
                    <span className="text-muted-foreground">SOL NETWORK FEE</span>
                    <span className="text-primary">0.00005 SOL</span>
                  </div>
                </div>

                {/* Main CTA button */}
                <Button
                  type="submit"
                  className={`w-full py-5 text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300 shadow cursor-pointer ${
                    !walletAddress 
                      ? 'bg-primary hover:bg-primary/95 text-primary-foreground font-bold'
                      : tradeSide === 'Long'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white hover:emerald-glow'
                        : 'bg-red-600 hover:bg-red-500 text-white hover:red-glow'
                  }`}
                >
                  {!walletAddress ? (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Link Phantom to Trade
                    </>
                  ) : tradeSide === 'Long' ? (
                    <>
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Execute LONG Perp
                    </>
                  ) : (
                    <>
                      <TrendingDown className="w-4 h-4 mr-2" />
                      Execute SHORT Perp
                    </>
                  )}
                </Button>

                {/* AI advisor link */}
                <button
                  type="button"
                  onClick={() => {
                    const advicePrompt = `I am planning to execute a perpetual trade on ${selectedAsset.symbol}:
- Instrument Class: ${selectedAsset.category}
- Position Strategy: ${tradeSide} ${orderType} Order (Leverage: ${leverage}x, Collateral: $${marginInput} USDC)
- Estimated Position Size: $${calculatedPositionSize.toFixed(2)} USD
- Entry Price Setup: $${entryPriceEstimate.toFixed(selectedAsset.category === 'Forex' ? 4 : 2)} USD
- Estimated Liquidation Price: $${estLiqPrice.toFixed(selectedAsset.category === 'Forex' ? 4 : 2)} USD

Can you evaluate this perpetual setup? What are the immediate support and resistance bands based on Market Cipher B and volume profiles? Is ${leverage}x leverage reasonable here?`;
                    onSendToAI(advicePrompt);
                  }}
                  className="w-full text-center text-[10px] font-mono uppercase tracking-wider text-primary hover:text-primary-foreground bg-primary/5 hover:bg-primary/10 border border-primary/20 py-1.5 rounded transition-all flex items-center justify-center gap-1 mt-2 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  Pre-Analyze with AI
                </button>
              </form>
            </CardContent>
          </Card>
        </div>

      </div>

      {/* Grid Row: Live Signals Combined Feed and Opened Perp Positions tracker */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Active Margin Positions on Solana (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="bg-card h-full flex flex-col min-h-[300px]">
            <CardHeader className="pb-2 border-b border-border/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 border border-border/50 bg-background/40 p-1 rounded-lg shrink-0">
                <button
                  type="button"
                  onClick={() => setPositionsTab('active')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                    positionsTab === 'active' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  Active Positions
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${positionsTab === 'active' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {positions.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setPositionsTab('history')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-mono uppercase font-bold tracking-wider transition-all cursor-pointer ${
                    positionsTab === 'history' 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }`}
                >
                  <History className="w-3.5 h-3.5" />
                  Settle History
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] ${positionsTab === 'history' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {settledTrades.length}
                  </span>
                </button>
              </div>
              {walletAddress && positionsTab === 'active' && (
                <div className="text-right text-[10px] font-mono text-muted-foreground bg-background/55 border border-border/40 px-2 py-1 rounded">
                  Phantom Net Assets: <span className="text-emerald-500 font-bold font-mono">{formatCurrency(usdcBalance + positions.reduce((acc, c) => acc + c.margin + c.pnl, 200))}</span>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              {positionsTab === 'active' ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Contract</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Side / Lever</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Margin Size</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Entry / Mark</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Est. Liq Price</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5 text-right">Unrealized P&L</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.length > 0 ? (
                      positions.map((pos) => {
                        const isLong = pos.type === 'Long';
                        const pnlIsPositive = pos.pnl >= 0;
                        const isHighRisk = pos.pnlPercent <= -75;
                        return (
                          <tr key={pos.id} className="border-border/30 hover:bg-muted/15 transition-all text-sm leading-none">
                            <TableCell className="font-mono font-bold py-3.5 leading-none">
                              <div className="flex flex-col space-y-0.5">
                                <span>{pos.symbol}</span>
                                <span className="text-[9px] text-muted-foreground uppercase leading-none">{pos.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 leading-none font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9.5px] font-bold px-1.5 py-0.5 rounded leading-none ${
                                  isLong ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {pos.type}
                                </span>
                                <span className="text-xs text-foreground font-bold">{pos.leverage}x</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 leading-none font-mono text-xs">
                              <div className="flex flex-col space-y-0.5">
                                <span className="font-bold text-foreground">{formatCurrency(pos.margin)}</span>
                                <span className="text-[9.2px] text-muted-foreground">Size: {formatCurrency(pos.size)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 leading-none font-mono text-xs">
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-muted-foreground">Entry: {formatCurrency(pos.entryPrice, pos.symbol.includes('Forex'))}</span>
                                <span className="font-bold">Mark: {formatCurrency(pos.markPrice, pos.symbol.includes('Forex'))}</span>
                              </div>
                            </TableCell>
                            <TableCell className={`py-3.5 leading-none font-mono text-xs font-semibold ${isHighRisk ? 'text-amber-500 animate-pulse' : 'text-red-500/90'}`}>
                              <div className="flex items-center gap-1.5">
                                <span>{formatCurrency(pos.liquidationPrice, pos.symbol.includes('Forex'))}</span>
                                {isHighRisk && (
                                  <Badge className="bg-amber-500/15 border-amber-500/30 text-amber-500 px-1 py-0 text-[8px] animate-bounce shrink-0 leading-none">
                                    LIQ RISK
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className={`py-3.5 leading-none font-mono text-right text-xs font-bold leading-none ${pnlIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                              <div className="flex flex-col items-end space-y-0.5 leading-none">
                                <span>{pnlIsPositive ? '+' : ''}{formatCurrency(pos.pnl)}</span>
                                <span className="text-[9px] leading-none">{pnlIsPositive ? '+' : ''}{pos.pnlPercent}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 leading-none text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleClosePosition(pos.id)}
                                  className="h-7 text-[10px] font-mono lowercase tracking-normal border-destructive/30 hover:bg-destructive hover:text-destructive-foreground text-destructive cursor-pointer px-2"
                                >
                                  Close
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  title="Synthesise & Send to AI Room"
                                  onClick={() => {
                                    const prompt = `I would like your advanced Swarm analysis on my active ${pos.symbol} ${pos.type} position:
- Contract Setup: ${pos.symbol} (${pos.name}) Leverage: ${pos.leverage}x
- Locked Margin: $${pos.margin} USD (Position Size: $${pos.size} USD)
- Entry Price: $${pos.entryPrice.toFixed(pos.symbol.includes('Forex') ? 4 : 2)} USD
- Mark (Active) Price: $${pos.markPrice.toFixed(pos.symbol.includes('Forex') ? 4 : 2)} USD
- Est Liquid Price: $${pos.liquidationPrice.toFixed(pos.symbol.includes('Forex') ? 4 : 2)} USD
- Current P&L: $${pos.pnl} (${pos.pnlPercent}%)

Review current momentum, liquidity zones, and Market Cipher structures on the chart to tell me: should I hold this position, scale out, or close it now? Provide high-probability targets.`;
                                    onSendToAI(prompt);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-primary rounded-md"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                                </Button>
                              </div>
                            </TableCell>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-0">
                        <td colSpan={7} className="text-center py-16 text-muted-foreground text-xs">
                          No active leveraged margin positions. Place an order above to on-chain execute.
                        </td>
                      </tr>
                    )}
                  </TableBody>
                </Table>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 hover:bg-transparent">
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Settle Contract</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Type / Size</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5">Entry / Exit</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5 text-right">Realized P&L</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5 text-center">Settled Time</TableHead>
                      <TableHead className="font-mono text-[9px] uppercase font-bold tracking-wider py-2.5 text-right">Outcome</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settledTrades.length > 0 ? (
                      settledTrades.map((trade) => {
                        const isLong = trade.type === 'Long';
                        const pnlIsPositive = trade.realizedPnl >= 0;
                        const isLiquidated = trade.outcome === 'Liquidated';
                        return (
                          <tr key={trade.id} className="border-border/30 hover:bg-muted/15 transition-all text-xs font-mono">
                            <TableCell className="font-bold py-3.5">
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-foreground">{trade.symbol}</span>
                                <span className="text-[9px] text-muted-foreground uppercase leading-none">{trade.name}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`text-[9px] font-bold px-1 py-0.5 rounded leading-none ${
                                  isLong ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                                }`}>
                                  {trade.type} {trade.leverage}x
                                </span>
                                <span className="text-[10px] text-muted-foreground">Size: {formatCurrency(trade.size)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5">
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-muted-foreground">Entry: {formatCurrency(trade.entryPrice, trade.symbol.includes('Forex'))}</span>
                                <span className="font-bold text-foreground">Settle: {formatCurrency(trade.exitPrice, trade.symbol.includes('Forex'))}</span>
                              </div>
                            </TableCell>
                            <TableCell className={`py-3.5 text-right font-bold ${pnlIsPositive ? 'text-emerald-500' : 'text-red-500'}`}>
                              <div className="flex flex-col items-end space-y-0.5">
                                <span>{pnlIsPositive ? '+' : ''}{formatCurrency(trade.realizedPnl)}</span>
                                <span className="text-[10px] font-normal">{pnlIsPositive ? '+' : ''}{trade.realizedPnlPercent.toFixed(2)}%</span>
                              </div>
                            </TableCell>
                            <TableCell className="py-3.5 text-center text-muted-foreground text-[10px]">
                              {trade.settledAt}
                            </TableCell>
                            <TableCell className="py-3.5 text-right">
                              <span className={`text-[9.5px] px-2 py-0.5 rounded font-bold ${
                                isLiquidated 
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-sans tracking-wide shrink-0 font-bold' 
                                  : 'bg-muted text-muted-foreground border border-border/40 font-sans shrink-0'
                              }`}>
                                {trade.outcome}
                              </span>
                            </TableCell>
                          </tr>
                        );
                      })
                    ) : (
                      <tr className="border-0">
                        <td colSpan={6} className="text-center py-16 text-muted-foreground text-xs">
                          No settled trades on-chain yet. Realize profit or close a position to audit reports here.
                        </td>
                      </tr>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Column 3: Pro Signals section (1/3 width, with expanded items) */}
        <div className="lg:col-span-1">
          <Card className="bg-card h-full flex flex-col min-h-[300px]">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-sans flex items-center justify-between">
                <span>Lions Swarm Pro Signals</span>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
              </CardTitle>
              <CardDescription className="text-[10px]">Real-time confluence alerts across crypto, stocks, and forex spot perps</CardDescription>
            </CardHeader>
            <ScrollArea className="flex-1 max-h-[400px]">
              <div className="p-3 space-y-2.5">
                {PRO_SIGNALS.map((sig) => {
                  const isLong = sig.type === 'Long';
                  const isCrypto = sig.category === 'Crypto';
                  return (
                    <div 
                      key={sig.id} 
                      onClick={() => {
                        const matchedAsset = PERP_ASSETS.find(a => a.symbol === sig.asset);
                        if (matchedAsset) {
                          setSelectedAsset(matchedAsset);
                        }
                      }}
                      className="p-3 bg-background border border-border rounded-xl hover:border-primary/50 transition-colors cursor-pointer group relative"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`text-[7.5px] px-1 py-0 font-mono ${
                            sig.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                            sig.status === 'Pending' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
                            'bg-muted text-muted-foreground border-border'
                          }`}>
                            {sig.status}
                          </Badge>
                          <span className="text-[9.5px] font-mono text-muted-foreground">{sig.timeframe} Chart • {sig.id}</span>
                        </div>
                        <span className="text-[10px] text-primary font-mono font-bold">{sig.confidence}% Conf</span>
                      </div>

                      <div className="flex items-center justify-between mt-2.5">
                        <div>
                          <p className="text-sm font-mono uppercase font-bold text-foreground">
                            {sig.asset}
                          </p>
                          <span className="text-[9px] text-muted-foreground bg-muted/65 px-1 py-0.5 rounded uppercase leading-none font-mono">
                            {sig.category}
                          </span>
                        </div>
                        <div className="h-full flex flex-col justify-end text-right">
                          <span className={`text-xs font-mono font-bold uppercase ${isLong ? 'text-emerald-500' : 'text-red-500'}`}>
                            {sig.type} SIGNAL
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-1 pt-2 border-t border-border/20 mt-2.5 text-[9px] font-mono">
                        <div>
                          <span className="text-muted-foreground block text-[8px] uppercase">ENTRY PRICE</span>
                          <span className="font-semibold text-foreground">{sig.entry}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[8px] uppercase">TARGET LIMIT</span>
                          <span className="font-semibold text-emerald-500">{sig.target}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground block text-[8px] uppercase">STOP COLLAT</span>
                          <span className="font-semibold text-red-500">{sig.stopLoss}</span>
                        </div>
                      </div>

                      {/* Hover action to execute signal details directly */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const matchedAsset = PERP_ASSETS.find(a => a.symbol === sig.asset);
                          if (matchedAsset) {
                            setSelectedAsset(matchedAsset);
                            setTradeSide(sig.type);
                            // Pre-fill fields
                            const numericMargin = sig.category === 'Stocks' ? '250' : '500';
                            setMarginInput(numericMargin);
                            setLeverage(sig.timeframe === '1D' ? 10 : 15);
                          }
                        }}
                        className="absolute right-2.5 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground text-[8px] font-mono uppercase px-1.5 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                        title="Load signal parameters into trade card"
                      >
                        Load Trade <ChevronRight className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>

      </div>

      {/* Floating Animated Phantom Connection Modal popup */}
      <AnimatePresence>
        {phantomPopupOpen && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#242636] text-white rounded-2xl w-full max-w-sm border border-[#3e425e] shadow-2xl p-6 relative overflow-hidden"
            >
              {/* Purple top glow accent of Phantom native UI */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-violet-500 to-indigo-600"></div>

              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#512da8] flex items-center justify-center p-1.5 shadow-md">
                    {/* Simplified Phantom ghost emoji mock/SVG */}
                    <span className="text-base">👻</span>
                  </div>
                  <span className="text-base font-bold tracking-tight text-white font-mono">Phantom Connector</span>
                </div>
                <button 
                  onClick={() => {
                    setPhantomPopupOpen(false);
                    setIsConnectingPhantom(false);
                  }}
                  className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-center pb-2">
                <div className="w-14 h-14 rounded-2xl bg-[#512da8]/15 border border-[#512da8]/30 flex items-center justify-center mx-auto text-2xl text-[#ab92ff]">
                  🔒
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Connect Solana Wallet</h4>
                  <p className="text-xs text-gray-400 leading-normal max-w-[270px] mx-auto">
                    Lions Trading Swarm requests permission to view wallet addresses, trigger on-chain margin lockups and sign perp contracts.
                  </p>
                </div>
              </div>

              <div className="border-t border-[#3e425e]/45 mt-5 pt-4 space-y-2 text-xs text-gray-400 text-left font-mono">
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-[#aab0e0]">✔</span>
                  <span>View your standard wallet balance & activity</span>
                </div>
                <div className="flex items-center gap-2 leading-none">
                  <span className="text-[#aab0e0]">✔</span>
                  <span>Authorize individual perps leverage transactions</span>
                </div>
                <div className="flex items-center gap-2 text-yellow-500 leading-none antialiased">
                  <span>❌</span>
                  <span>Strictly zero authority to execute unauthorized withdrawals</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2.5">
                <Button
                  onClick={() => {
                    setPhantomPopupOpen(false);
                    setIsConnectingPhantom(false);
                  }}
                  className="bg-transparent border border-[#3e425e] hover:bg-white/5 text-gray-300 font-mono text-xs uppercase"
                >
                  Reject
                </Button>
                <Button
                  onClick={handleConfirmPhantomConnect}
                  disabled={signStatus === 'signing'}
                  className="bg-[#512da8] hover:bg-[#5e35b1] text-white font-mono text-xs uppercase cursor-pointer"
                >
                  {signStatus === 'signing' ? 'Linking...' : 'Connect'}
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* On-Chain Transaction Signature Modal popup styled like Phantom Approve Screen */}
      <AnimatePresence>
        {showSignPopup && signTargetPosition && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-[#212330] text-white rounded-2xl w-full max-w-sm border border-[#383b54] shadow-2xl p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600"></div>

              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                    👻
                  </div>
                  <span className="text-xs font-bold tracking-tight font-mono text-gray-300">Phantom Transaction Validation</span>
                </div>
                <button 
                  onClick={() => {
                    if (signStatus !== 'signing') {
                      setShowSignPopup(false);
                    }
                  }}
                  disabled={signStatus === 'signing'}
                  className="rounded-full p-1 text-gray-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-25"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {signStatus === 'signing' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin mx-auto"></div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold font-mono text-white">Signing transaction on-chain ...</p>
                    <p className="text-[10px] text-gray-400">Locking margin collateral & updating position maps</p>
                  </div>
                </div>
              ) : signStatus === 'success' ? (
                <div className="py-8 text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto text-emerald-400 text-2xl border border-emerald-500/40 animate-bounce">
                    ✓
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold font-mono text-emerald-400">Order Settled Successfully</p>
                    <p className="text-[10px] text-gray-400">Perp position officially active on margins.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-mono">Approve On-Chain Interaction</p>
                    <p className="text-lg font-bold font-mono text-white mt-1">
                      Execute {signTargetPosition.side} Order ({signTargetPosition.leverage}x)
                    </p>
                  </div>

                  <div className="bg-[#181a25] rounded-xl border border-[#2b2e40] p-3.5 space-y-2.5 font-mono text-xs">
                    <div className="flex justify-between text-gray-400">
                      <span>CONTRACT ASSET</span>
                      <span className="text-white font-bold">{signTargetPosition.asset.symbol}</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>MARGIN CAPTURE</span>
                      <span className="text-primary font-bold">{formatCurrency(signTargetPosition.margin)} USDC</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>LEVERAGED EXPOSURE</span>
                      <span className="text-white font-bold">{formatCurrency(signTargetPosition.margin * signTargetPosition.leverage)} USD</span>
                    </div>
                    <div className="flex justify-between text-gray-400">
                      <span>ORDER STYLE</span>
                      <span className="text-yellow-500 uppercase font-bold">{signTargetPosition.orderType}</span>
                    </div>
                    <div className="h-px bg-gray-800/60 my-1"></div>
                    <div className="flex justify-between text-gray-400 text-[10px]">
                      <span>SOL ESTIMATE GAS</span>
                      <span className="text-emerald-400">~ 0.00005 SOL</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-gray-400 text-[10px] font-mono leading-tight bg-white/5 border border-white/10 p-2.5 rounded">
                    <HelpCircle className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>This operation is finalized instantaneously. Funds are secured via decentralized smart contract escrows.</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-1">
                    <Button
                      onClick={() => setShowSignPopup(false)}
                      className="bg-transparent border border-gray-700 hover:bg-white/5 text-gray-300 font-mono text-xs uppercase"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={approvePositionOnChain}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-xs uppercase flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Sign Trade
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
