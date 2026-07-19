import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  Calendar, 
  Anchor, 
  TrendingDown, 
  Layers, 
  Activity, 
  Sparkles, 
  Cpu, 
  AlertTriangle, 
  RefreshCw, 
  CheckCircle2, 
  TrendingUp, 
  MessageSquare,
  HelpCircle,
  FileText,
  BadgeAlert,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Pillar {
  id: string;
  name: string;
  baselineVal: string;
  baselineScore: number;
  currentScore: number;
  unit: string;
  desc: string;
}

export default function CycleMonitor() {
  // --- State for the 11 pillars ---
  const [pillars, setPillars] = useState<Pillar[]>([
    { id: 'profit', name: '% Supply in Profit', baselineVal: '84.2%', baselineScore: 24, currentScore: 24, unit: '%', desc: 'Measures percent of circulating coins whose cost basis is lower than current spot.' },
    { id: 'ahr999', name: 'AHR999 Index', baselineVal: '0.42', baselineScore: 12, currentScore: 12, unit: 'index', desc: 'Multiplicative oscillator tracking absolute value and 200DMA deviation.' },
    { id: 'mvrv', name: 'MVRV Z-Score', baselineVal: '1.15', baselineScore: 18, currentScore: 18, unit: 'z-score', desc: 'Standard deviations of market cap from realized cap distribution.' },
    { id: 'puell', name: 'Puell Multiple', baselineVal: '0.72', baselineScore: 15, currentScore: 15, unit: 'multiple', desc: 'Daily issuance value divided by 365-day moving average issuance.' },
    { id: 'ma2y', name: 'Price / 2Y MA Ratio', baselineVal: '0.88', baselineScore: 16, currentScore: 16, unit: 'ratio', desc: 'Spot price ratio compared to its 2-year simple moving average.' },
    { id: 'res_risk', name: 'Reserve Risk', baselineVal: '0.0012', baselineScore: 8, currentScore: 8, unit: 'multiple', desc: 'Tracks long-term holder confidence relative to current market price.' },
    { id: 'mayer', name: 'Mayer Multiple', baselineVal: '0.92', baselineScore: 14, currentScore: 14, unit: 'multiple', desc: 'Current price deviation from its 200-day simple moving average.' },
    { id: 'fg_index', name: 'Fear & Greed Index', baselineVal: '24/100', baselineScore: 24, currentScore: 24, unit: 'index', desc: 'Normalized multi-factor retail and sentiment tracker.' },
    { id: 'rhodl', name: 'RHODL Ratio', baselineVal: '342', baselineScore: 15, currentScore: 15, unit: 'ratio', desc: 'Ratio between 1-week and 1-2 year realized cap HODL bands.' },
    { id: 'drawdown', name: 'Drawdown Path (from ATH)', baselineVal: '-48.2%', baselineScore: 19, currentScore: 19, unit: '%', desc: 'Percent peak-to-trough distance from the cycle absolute high.' },
    { id: 'nupl', name: 'NUPL', baselineVal: '0.32', baselineScore: 21, currentScore: 21, unit: 'ratio', desc: 'Net Unrealized Profit/Loss represents ratio of profit versus loss.' }
  ]);

  // --- Dynamic price & calculation states ---
  const [currentBtcPrice, setCurrentBtcPrice] = useState<number>(65296);
  const [ethBtcRatio, setEthBtcRatio] = useState<number>(0.029);
  
  // Custom dates
  const athDate = new Date('2025-10-06T00:00:00');
  const [daysSinceAth, setDaysSinceAth] = useState<number>(275);
  
  // AI advice states
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const wsRef = React.useRef<WebSocket | null>(null);

  // Set up WebSocket listener
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onopen = () => {
        setWsConnected(true);
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === "live-update" && parsed.data) {
            const { btcPrice, ethBtcRatio, pillars: remotePillars } = parsed.data.cycleMonitor;
            setCurrentBtcPrice(Math.round(btcPrice));
            setEthBtcRatio(parseFloat(ethBtcRatio.toFixed(4)));
            
            setPillars(prev => prev.map(localPillar => {
              const remoteMatch = remotePillars.find((rp: any) => rp.id === localPillar.id);
              if (remoteMatch) {
                return {
                  ...localPillar,
                  currentScore: remoteMatch.currentScore,
                  baselineVal: remoteMatch.baselineVal
                };
              }
              return localPillar;
            }));
          }
        } catch (e) {
          console.error("Error reading websocket message in CycleMonitor:", e);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        wsRef.current = null;
        reconnectTimeout = setTimeout(connect, 3000);
      };

      socket.onerror = (err) => {
        console.error("WebSocket error:", err);
        socket?.close();
      };
    }

    connect();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Compute Days since October 6, 2025
  useEffect(() => {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - athDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    setDaysSinceAth(diffDays);
  }, []);

  // --- Calculations ---
  const compositeCycleScore = Math.round(
    pillars.reduce((acc, pillar) => acc + pillar.currentScore, 0) / pillars.length
  );

  // Active Zone Resolution
  let activeZone = "MID-CYCLE";
  let zoneColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
  let zoneColorText = "text-amber-500";
  let zoneDescription = "Market is in normal mid-cycle oscillation. Balance strategic capital deployment and protect positions.";

  if (compositeCycleScore >= 0 && compositeCycleScore < 15) {
    activeZone = "BOTTOM CORRIDOR";
    zoneColor = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    zoneColorText = "text-emerald-400";
    zoneDescription = "Extreme value corridor detected. Maximize systematic long-term accumulation protocols.";
  } else if (compositeCycleScore >= 15 && compositeCycleScore < 35) {
    activeZone = "DEEP ACCUMULATION";
    zoneColor = "text-teal-400 bg-teal-500/10 border-teal-500/20";
    zoneColorText = "text-teal-400";
    zoneDescription = "Systemic range accumulation. High probability buying window for mid-to-long term portfolios.";
  } else if (compositeCycleScore >= 35 && compositeCycleScore < 65) {
    activeZone = "MID-CYCLE RANGE";
    zoneColor = "text-amber-500 bg-amber-500/10 border-amber-500/20";
    zoneColorText = "text-amber-500";
    zoneDescription = "Consolidation zone. Market strength is balanced. Maintain steady allocation, avoid leverage peaks.";
  } else if (compositeCycleScore >= 65 && compositeCycleScore < 85) {
    activeZone = "EUPHORIA TRIGGER";
    zoneColor = "text-orange-500 bg-orange-500/10 border-orange-500/20 animate-pulse";
    zoneColorText = "text-orange-500";
    zoneDescription = "FOMO entering retail channels. Scaling out and profit-taking targets are active.";
  } else if (compositeCycleScore >= 85 && compositeCycleScore <= 100) {
    activeZone = "CYCLE TOP DISCHARGE";
    zoneColor = "text-red-500 bg-red-500/10 border-red-500/20 animate-pulse";
    zoneColorText = "text-red-500";
    zoneDescription = "Macro cycle peak reached. Extreme risk. De-risk entirely, hold capital in yield-bearing reserve.";
  }

  // Drawdown from ATH calculation
  const athValue = 126296;
  const drawdownVal = ((currentBtcPrice - athValue) / athValue) * 100;

  // Tranches verification
  const isT1Triggered = drawdownVal <= -50; // $63,148
  const isT2Triggered = drawdownVal <= -65; // $44,204
  const isT3Triggered = drawdownVal <= -70; // $37,889
  const isInvalidationTriggered = currentBtcPrice >= 101037;

  // Alt rotation validation
  const isAltRotationProhibited = ethBtcRatio < 0.035;

  const handlePillarScoreChange = (id: string, newScore: number) => {
    setPillars(prev => prev.map(p => p.id === id ? { ...p, currentScore: Math.max(0, Math.min(100, newScore)) } : p));
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "set-pillar",
        data: { id, score: newScore }
      }));
    }
  };

  const handleBtcPriceChange = (val: number) => {
    setCurrentBtcPrice(val);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "set-btc-price",
        data: { price: val }
      }));
    }
  };

  const handleResetPillars = () => {
    setPillars(prev => prev.map(p => ({ ...p, currentScore: p.baselineScore })));
    setCurrentBtcPrice(65296);
    setEthBtcRatio(0.029);
    setErrorMessage(null);
    setSuccessMessage("Pillar scores reset to baseline configuration!");
    setTimeout(() => setSuccessMessage(null), 3000);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "set-btc-price",
        data: { price: 65296 }
      }));
    }
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Query server side Swarm AI for Risk Advisor report
  const generateAiRiskAdvisory = async () => {
    setIsGeneratingAi(true);
    setAiReport(null);
    setErrorMessage(null);

    const pillarLines = pillars.map(p => `- ${p.name}: score ${p.currentScore}/100 (baseline: ${p.baselineScore}/100)`).join('\n');
    const systemInstructionsPrompt = `Perform a full risk report and capital deployment advisory based on the following Bitcoin Cycle metrics:
- Bitcoin Spot Price: $${currentBtcPrice.toLocaleString()} (Drawdown: ${drawdownVal.toFixed(1)}% from ATH of $126,296)
- ETH/BTC Ratio: ${ethBtcRatio} (Rotation rule: below 0.035 is STRICT NO ALT ROTATION)
- Days Elapsed since ATH: ${daysSinceAth} days (Cyclical Low Window Projection: ATH + 360 to 400 days)
- Composite Cycle Score: ${compositeCycleScore}/100 (Current Zone: ${activeZone})

Technical Indicator Matrix Contribution:
${pillarLines}

Please output a professional, system-analogue report following the Swarm AI Architect standards. Include:
1. Executive Risk Level & Active Capital Allocation Strategy
2. Specific evaluation of the 11 pillars contributing to the score of ${compositeCycleScore}/100
3. Capital deployment tranche recommendations (Tranches triggered: ${[isT1Triggered ? 'T1' : '', isT2Triggered ? 'T2' : '', isT3Triggered ? 'T3' : ''].filter(Boolean).join(', ') || 'None'})
4. Altcoin rotation filter warning status (ETH/BTC ratio active: ${ethBtcRatio})
Make the analysis crisp, mathematical, and decisive. Avoid verbose generic introductory fluff or sales-pitch wording. Use code/terminal styling or professional markdown.`;

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: systemInstructionsPrompt }]
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error("Failed to contact Swarm AI on server.");
      }

      const data = await response.json();
      if (data.text) {
        setAiReport(data.text);
        triggerSuccess("Advanced Swarm Risk Advisory generated successfully!");
      } else {
        throw new Error("Empty analysis returned.");
      }
    } catch (err: any) {
      console.error(err);
      // Fallback robust offline advice if key is not configured or network error
      const mockAdvice = `### 🦁 SWARM CYCLICAL ADVISORY (LOCAL REPORT MODELLING)
**Active State:** ${activeZone} | **Composite Score:** ${compositeCycleScore}/100

#### 1. Tactical Risk Evaluation:
- With a current drawdown of **${drawdownVal.toFixed(1)}%** relative to the $126,296 ATH coord, market structure continues to build historical analog patterns. 
- The current cycle score of **${compositeCycleScore}/100** places the market in the **${activeZone}** zone. Strategic deployments are actively calculated.

#### 2. Tranche Allocation Readiness:
- **Tranche 1 (T1) [Buy 50% @ $63,148]:** ${isT1Triggered ? '🟢 ACTIVE & TRIGGERED' : '⚪ INACTIVE (Spot price is above target)'}
- **Tranche 2 (T2) [Buy 75% @ $44,204]:** ${isT2Triggered ? '🟢 ACTIVE & TRIGGERED' : '⚪ INACTIVE (Spot price is above target)'}
- **Tranche 3 (T3) [Buy 100% @ $37,889]:** ${isT3Triggered ? '🟢 ACTIVE & TRIGGERED' : '⚪ INACTIVE (Spot price is above target)'}
- **Invalidation Weekly Trigger ($101,037):** ${isInvalidationTriggered ? '🔴 INVALIDATED (Weekly Close above 20W SMA)' : '🟢 UNTRIGGERED (Structural support remains valid)'}

#### 3. Portfolio Asset Strategy:
- **Altcoin rotation status:** ${isAltRotationProhibited ? '⚠️ STRICT NO ALT ROTATION (ETH/BTC ratio is below 0.035 trigger). Capital is heavily locked into BTC. Accumulation of alts represents high risk.' : '🟢 Rotation filter inactive (ETH/BTC ratio above 0.035). Selected layer-1 and liquidity assets may be accumulated alongside BTC.'}

#### 4. System Action Blueprint:
Steady accumulation in systematic intervals remains the high-confluence playbook in this zone. Refrain from momentum chasing until the composite score breaches 65/100.`;
      
      setAiReport(mockAdvice);
      triggerSuccess("Offline mathematical report compiled successfully!");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6" id="cycle-monitor-wrapper">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg">
              <Gauge className="w-5 h-5 animate-pulse" />
            </span>
            <h1 className="text-xl font-bold font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-yellow-500 uppercase">
              Bitcoin Cycle Monitor & Risk Engine
            </h1>
            <Badge className={`${wsConnected ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'} border font-mono text-[9px] uppercase font-bold px-2 py-0.5 shrink-0`}>
              {wsConnected ? '● WS Live' : '○ WS Offline'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-normal font-sans">
            Cyclical risk engine tracking normalized macro coordinates and deployment tranches. Anchored to the visual ground truth metrics of the 11 Core Pillars.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={handleResetPillars}
            size="sm"
            className="border-border text-xs font-mono text-muted-foreground hover:text-orange-400 hover:border-orange-500/30"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            Reset Base Metrics
          </Button>
        </div>
      </div>

      {/* Notifications area */}
      {errorMessage && (
        <div className="bg-rose-950/20 border border-rose-900/50 p-4 rounded-xl flex items-start gap-3 text-xs text-rose-200 animate-fadeIn" id="cm-error-alert">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold font-mono text-rose-400 uppercase tracking-wider mb-0.5">Execution Notification</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="bg-emerald-950/20 border border-emerald-900/50 p-4 rounded-xl flex items-start gap-3 text-xs text-emerald-200 animate-fadeIn" id="cm-success-alert">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold font-mono text-emerald-400 uppercase tracking-wider mb-0.5">Engine Success</p>
            <p>{successMessage}</p>
          </div>
        </div>
      )}

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN 1: THE METRIC GAUGE & DECISION ROOM (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Composite Score Gauge */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
              <Sparkles className="w-48 h-48 text-orange-400" />
            </div>
            
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> COMPOSITE RISK METRICS
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground font-sans mt-0.5">
                Calculated mean risk value from all 11 core macro parameters.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 text-center space-y-6">
              
              {/* Dynamic Big Score Display */}
              <div className="relative inline-flex items-center justify-center p-6 bg-muted/40 dark:bg-black/40 border border-border dark:border-slate-800 rounded-2xl w-full max-w-[280px] mx-auto overflow-hidden">
                <div className="absolute top-2 left-2 text-[8px] font-mono text-muted-foreground uppercase">Mean Cycle Index</div>
                <div className="space-y-1 z-10">
                  <span className="text-6xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-orange-400 to-amber-500">
                    {compositeCycleScore}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono block">/ 100 max</span>
                </div>
              </div>

              {/* Active Zone Readout */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-muted-foreground">Calculated Zone:</span>
                  <span className={`px-2.5 py-1 rounded text-[11px] font-black tracking-wider uppercase border ${zoneColor}`}>
                    {activeZone}
                  </span>
                </div>
                <p className="text-xs text-foreground/80 dark:text-slate-300 leading-normal font-sans pt-1 max-w-sm mx-auto">
                  {zoneDescription}
                </p>
              </div>

              {/* Progress Slider Track for Visual Representation */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between font-mono text-[9px] text-muted-foreground px-1">
                  <span>0 (BOTTOM)</span>
                  <span>50 (MID)</span>
                  <span>100 (TOP)</span>
                </div>
                <Progress value={compositeCycleScore} className="h-2 bg-muted dark:bg-[#07090e] [&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:via-orange-500 [&>div]:to-red-500" />
              </div>

            </CardContent>
          </Card>

          {/* Capital Allocation & Tranches */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5" /> DEPLOYMENT TRANCHES PROTOCOL
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground font-sans mt-0.5">
                Systematic asset accumulation triggers mapped to absolute ATH Coordinates ($126,296).
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 space-y-4 font-mono text-xs">
              
              {/* Interactive Bitcoin Spot Price Modeller */}
              <div className="bg-muted/40 dark:bg-black/30 border border-border dark:border-slate-900/60 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>Spot Price Accumulator Model</span>
                  <span className="text-orange-400 font-bold">${currentBtcPrice.toLocaleString()}</span>
                </div>
                <input 
                  type="range"
                  min={25000}
                  max={130000}
                  step={500}
                  value={currentBtcPrice}
                  onChange={(e) => handleBtcPriceChange(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-muted dark:bg-[#07090e] rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/80">
                  <span>$25k</span>
                  <span>ATH ($126k)</span>
                </div>
              </div>

              {/* Drawdown Output Display */}
              <div className="flex justify-between items-center bg-muted/60 dark:bg-[#07090e] border border-border dark:border-slate-800 p-2.5 rounded-lg">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Peak Drawdown Percent:</span>
                <span className={`font-bold ${drawdownVal <= -50 ? 'text-emerald-400' : 'text-foreground dark:text-slate-200'}`}>
                  {drawdownVal.toFixed(1)}%
                </span>
              </div>

              {/* Tranche Listing Status */}
              <div className="space-y-2 pt-1">
                
                {/* Tranche 1 */}
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  isT1Triggered 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                    : 'bg-muted/30 dark:bg-[#07090e]/50 border-border dark:border-slate-900 text-muted-foreground'
                }`}>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase">TRANCHE 1 (T1) - 50% BATCH</p>
                    <p className="text-[9px] text-muted-foreground/80 font-sans">Triggers at -50% Drawdown from ATH ($63,148)</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isT1Triggered ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted dark:bg-slate-900 border border-border dark:border-slate-800'
                  }`}>
                    {isT1Triggered ? "TRIGGERED" : "AWAITING"}
                  </span>
                </div>

                {/* Tranche 2 */}
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  isT2Triggered 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                    : 'bg-muted/30 dark:bg-[#07090e]/50 border-border dark:border-slate-900 text-muted-foreground'
                }`}>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase">TRANCHE 2 (T2) - 75% BATCH</p>
                    <p className="text-[9px] text-muted-foreground/80 font-sans">Triggers at -65% Drawdown from ATH ($44,204)</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isT2Triggered ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted dark:bg-slate-900 border border-border dark:border-slate-800'
                  }`}>
                    {isT2Triggered ? "TRIGGERED" : "AWAITING"}
                  </span>
                </div>

                {/* Tranche 3 */}
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  isT3Triggered 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400' 
                    : 'bg-muted/30 dark:bg-[#07090e]/50 border-border dark:border-slate-900 text-muted-foreground'
                }`}>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase">TRANCHE 3 (T3) - 100% CAPITAL</p>
                    <p className="text-[9px] text-muted-foreground/80 font-sans">Triggers at -70% Drawdown from ATH ($37,889)</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isT3Triggered ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-muted dark:bg-slate-900 border border-border dark:border-slate-800'
                  }`}>
                    {isT3Triggered ? "TRIGGERED" : "AWAITING"}
                  </span>
                </div>

                {/* Invalidation Trigger */}
                <div className={`p-3 border rounded-xl flex items-center justify-between ${
                  isInvalidationTriggered 
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-400' 
                    : 'bg-muted/30 dark:bg-[#07090e]/50 border-border dark:border-slate-900 text-muted-foreground'
                }`}>
                  <div className="space-y-0.5">
                    <p className="font-bold text-[11px] uppercase">INVALIDATION SIGNAL (BUY REMAINING)</p>
                    <p className="text-[9px] text-muted-foreground/80 font-sans">Weekly close above 20W SMA ($101,037)</p>
                  </div>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    isInvalidationTriggered ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400' : 'bg-muted dark:bg-slate-900 border border-border dark:border-slate-800'
                  }`}>
                    {isInvalidationTriggered ? "INVALIDATED" : "STABLE"}
                  </span>
                </div>

              </div>

            </CardContent>
          </Card>

          {/* Altcoin Rotation Filter */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> ALTCOIN ROTATION FILTER
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-mono text-xs">
              
              {/* Slider for ETH/BTC ratio */}
              <div className="bg-muted/40 dark:bg-black/30 border border-border dark:border-slate-900/60 p-3 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>ETH/BTC Liquidity Anchor</span>
                  <span className="text-orange-400 font-bold">{ethBtcRatio.toFixed(3)}</span>
                </div>
                <input 
                  type="range"
                  min={0.015}
                  max={0.075}
                  step={0.001}
                  value={ethBtcRatio}
                  onChange={(e) => setEthBtcRatio(Number(e.target.value))}
                  className="w-full accent-orange-500 h-1 bg-muted dark:bg-[#07090e] rounded cursor-pointer"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground/80">
                  <span>0.015 (Extreme Low)</span>
                  <span>Trigger Rule (0.035)</span>
                  <span>0.075 (Alt Season)</span>
                </div>
              </div>

              {/* Filter Readout status */}
              <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                isAltRotationProhibited 
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-300' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-300'
              }`}>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-widest uppercase block text-muted-foreground">Active Rotational Directives</span>
                  <p className="text-xs font-bold uppercase">
                    {isAltRotationProhibited ? "STRICT NO ALT ROTATION PROTOCOL" : "ALT ROTATION PERMITTED"}
                  </p>
                  <p className="text-[10px] text-muted-foreground leading-normal font-sans pt-0.5">
                    {isAltRotationProhibited 
                      ? "ETH/BTC is below the 0.035 threshold. Capital must be locked entirely in BTC. Purchasing alts yields negative expected utility."
                      : "ETH/BTC has established strength above 0.035. Selective macro alts accumulation models are validated."
                    }
                  </p>
                </div>
              </div>

            </CardContent>
          </Card>

        </div>

        {/* COLUMN 2: THE 11 PILLARS MATRIX & SIMULATOR (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 11 Pillars Interactive Card */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" /> Technical Indicator Matrix (11 Pillars)
                </CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground font-sans mt-0.5">
                  Adjust individual indicator risk weights to simulate overall market cycle score deviations.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-orange-500/20 text-orange-400 font-mono text-[9px] uppercase font-bold">
                1000001644 Reference
              </Badge>
            </CardHeader>

            <CardContent className="pt-4 p-0">
              <ScrollArea className="h-[540px]">
                <div className="p-4 space-y-3.5">
                  
                  {pillars.map((pillar) => (
                    <div 
                      key={pillar.id}
                      className="bg-muted/20 dark:bg-black/20 hover:bg-muted/30 dark:hover:bg-black/40 border border-border dark:border-slate-900 rounded-xl p-3.5 space-y-3 transition-colors"
                    >
                      {/* Name & Baseline Indicator */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-black font-mono text-foreground dark:text-slate-200 uppercase">{pillar.name}</h4>
                          <p className="text-[9.5px] text-muted-foreground leading-normal font-sans max-w-md">{pillar.desc}</p>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <span className="text-[8.5px] text-muted-foreground block uppercase font-semibold">BASELINE</span>
                          <span className="text-orange-400 text-[10.5px] font-bold">Value: {pillar.baselineVal}</span>
                        </div>
                      </div>

                      {/* Slider and direct score input */}
                      <div className="grid grid-cols-12 gap-3.5 items-center pt-1">
                        
                        {/* Sliders */}
                        <div className="col-span-8 flex items-center gap-2">
                          <input 
                            type="range"
                            min={0}
                            max={100}
                            value={pillar.currentScore}
                            onChange={(e) => handlePillarScoreChange(pillar.id, Number(e.target.value))}
                            className="w-full accent-orange-500 h-1 bg-muted dark:bg-[#07090e] rounded cursor-pointer"
                          />
                        </div>

                        {/* Current Score / 100 block */}
                        <div className="col-span-4 flex items-center justify-end gap-1.5 font-mono text-[11px]">
                          <span className="text-muted-foreground text-[9px] uppercase">SCORE:</span>
                          <input 
                            type="number"
                            min={0}
                            max={100}
                            value={pillar.currentScore}
                            onChange={(e) => handlePillarScoreChange(pillar.id, Number(e.target.value))}
                            className="bg-background dark:bg-black/60 border border-border dark:border-slate-800 text-center w-12 py-0.5 text-orange-400 rounded focus:border-orange-500/50 outline-none text-[11px] font-bold font-mono"
                          />
                          <span className="text-muted-foreground font-bold">/100</span>
                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Macro Time-Analog Floor Window Projection */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" /> CYCLICAL WINDOW FLOOR ANALOGS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4 font-mono text-xs">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                
                <div className="p-3 bg-muted/40 dark:bg-black/40 border border-border dark:border-slate-900 rounded-lg text-center">
                  <span className="text-[8px] text-muted-foreground block uppercase">2018 Bottom Analog</span>
                  <p className="font-bold text-foreground dark:text-slate-200 pt-0.5">ATH + 363 Days</p>
                </div>

                <div className="p-3 bg-muted/40 dark:bg-black/40 border border-border dark:border-slate-900 rounded-lg text-center">
                  <span className="text-[8px] text-muted-foreground block uppercase">2022 Bottom Analog</span>
                  <p className="font-bold text-foreground dark:text-slate-200 pt-0.5">ATH + 376 Days</p>
                </div>

                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-center">
                  <span className="text-[8px] text-orange-400 block uppercase font-bold">Current Proj Bottom</span>
                  <p className="font-bold text-orange-400 pt-0.5">Oct-Nov 2026</p>
                </div>

              </div>

              {/* Dynamic Day counter */}
              <div className="bg-muted/60 dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider">Dynamic Analog Coordinate</span>
                  <p className="text-[11px] text-foreground/80 dark:text-slate-200 font-sans leading-normal">
                    Macro ATH was established on **Oct 6, 2025**. Based on current date alignment, we have elapsed:
                  </p>
                </div>
                <div className="px-4 py-2 bg-orange-500/5 border border-orange-500/10 text-orange-400 font-black rounded-lg text-center text-lg shrink-0">
                  ATH + {daysSinceAth} Days
                </div>
              </div>

            </CardContent>
          </Card>

          {/* AI Advisor Chamber */}
          <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Swarm risk engine advisory chamber
              </CardTitle>
              <CardDescription className="text-[10px] text-muted-foreground font-sans mt-0.5">
                Leverage generative Swarm models to evaluate your custom simulated indicators.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              
              <Button 
                onClick={generateAiRiskAdvisory}
                disabled={isGeneratingAi}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 text-black font-mono font-black text-xs uppercase tracking-widest py-5 cursor-pointer hover:opacity-90 transition-all duration-200"
              >
                {isGeneratingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" />
                    SIMULATING MACRO INFERENCES...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5 text-black" />
                    GENERATE SYSTEM-ANALOG RISK ADVISORY
                  </>
                )}
              </Button>

              {aiReport && (
                <div className="bg-muted/50 dark:bg-[#03050a] border border-border dark:border-slate-800/80 rounded-xl p-4 font-mono text-[11px] leading-relaxed text-foreground/90 dark:text-slate-300 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-2 right-2 flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-muted-foreground uppercase tracking-widest">REPORT INFERENCE SECURED</span>
                  </div>
                  
                  <div className="space-y-4 whitespace-pre-wrap select-text pr-2 pt-1 max-h-[360px] overflow-y-auto">
                    {aiReport}
                  </div>
                </div>
              )}

            </CardContent>
          </Card>

        </div>

      </div>

    </div>
  );
}
