const fs = require('fs');
let code = fs.readFileSync('src/components/StrategyBuilder.tsx', 'utf8');

// 1. Update symbolConfigs
const newSymbolConfigs = `// --- Static Asset Configs Reference ---
export const symbolConfigs: Record<string, { high: number; low: number; simDefault: number; marketPrice: number; min: number; max: number; step: number }> = {
  "BINANCE:BTCUSDT": { high: 126198, low: 15500, simDefault: 37000, marketPrice: 61250, min: 10000, max: 200000, step: 250 },
  "BINANCE:ETHUSDT": { high: 4850, low: 890, simDefault: 2400, marketPrice: 3450, min: 500, max: 8000, step: 25 },
  "BINANCE:SOLUSDT": { high: 260, low: 8, simDefault: 134, marketPrice: 142, min: 1, max: 500, step: 1 },
  "BINANCE:BNBUSDT": { high: 690, low: 180, simDefault: 320, marketPrice: 575, min: 50, max: 1500, step: 5 },
  "BINANCE:XRPUSDT": { high: 1.96, low: 0.28, simDefault: 0.68, marketPrice: 0.56, min: 0.05, max: 5, step: 0.01 },
  "BINANCE:DOGEUSDT": { high: 0.73, low: 0.05, simDefault: 0.12, marketPrice: 0.11, min: 0.01, max: 2, step: 0.001 },
  "BINANCE:ADAUSDT": { high: 3.10, low: 0.22, simDefault: 0.50, marketPrice: 0.45, min: 0.05, max: 5, step: 0.01 },
  "BINANCE:SHIBUSDT": { high: 0.000088, low: 0.000005, simDefault: 0.000015, marketPrice: 0.000018, min: 0.000001, max: 0.0002, step: 0.000001 },
  "BINANCE:AVAXUSDT": { high: 146, low: 8, simDefault: 35, marketPrice: 28, min: 1, max: 300, step: 1 },
  "BINANCE:DOTUSDT": { high: 55, low: 3.5, simDefault: 7, marketPrice: 6, min: 1, max: 100, step: 0.1 },
  "BINANCE:LINKUSDT": { high: 52, low: 5, simDefault: 18, marketPrice: 14, min: 1, max: 100, step: 0.1 },
  "BINANCE:MATICUSDT": { high: 2.92, low: 0.3, simDefault: 0.8, marketPrice: 0.6, min: 0.1, max: 5, step: 0.01 },
  "BINANCE:UNIUSDT": { high: 45, low: 3.5, simDefault: 10, marketPrice: 8, min: 1, max: 100, step: 0.1 },
  "BINANCE:LTCUSDT": { high: 412, low: 40, simDefault: 80, marketPrice: 70, min: 10, max: 1000, step: 1 },
  "BINANCE:NEARUSDT": { high: 20, low: 1, simDefault: 5, marketPrice: 4.5, min: 0.5, max: 50, step: 0.1 }
};

export const LEVERAGE_PLATFORMS = [
  { name: 'Binance', fee: 0.0005 },
  { name: 'Bybit', fee: 0.00055 },
  { name: 'OKX', fee: 0.0005 },
  { name: 'Bitget', fee: 0.0006 },
  { name: 'KuCoin', fee: 0.0006 },
  { name: 'Kraken', fee: 0.0005 },
  { name: 'Deribit', fee: 0.0005 },
  { name: 'MEXC', fee: 0.0001 },
  { name: 'HTX', fee: 0.0005 },
  { name: 'Gate.io', fee: 0.0005 }
];`;

code = code.replace(/\/\/ --- Static Asset Configs Reference ---[\s\S]*?};/, newSymbolConfigs);

// 2. Add Leverage Simulator states
const hookReplacement = `// --- Leverage Simulator States ---
  const [simStartPrice, setSimStartPrice] = useState<number>(symbolConfigs["BINANCE:BTCUSDT"].marketPrice);
  const [simEndPrice, setSimEndPrice] = useState<number>(symbolConfigs["BINANCE:BTCUSDT"].marketPrice * 1.05);
  const [simPlatform, setSimPlatform] = useState<string>('Binance');
  const [simPositionSize, setSimPositionSize] = useState<number>(1000);
  const [simTradeDirection, setSimTradeDirection] = useState<'LONG' | 'SHORT'>('LONG');

  // Handle asset symbol switch: reset simulated defaults and limits
  const handleSymbolChange = (newSymbol: string) => {
    const config = symbolConfigs[newSymbol];
    if (config) {
      setStrategySymbol(newSymbol);
      setStrategyCycleHigh(config.high);
      setStrategyCycleLow(config.low);
      setStrategySimPrice(config.simDefault);
      setPriceInputText(config.simDefault.toString());
      setSimStartPrice(config.marketPrice);
      setSimEndPrice(config.marketPrice * 1.05);
      setErrorMessage(null);
    }
  };`;

code = code.replace(/\/\/ Handle asset symbol switch: reset simulated defaults and limits[\s\S]*?};/, hookReplacement);

// 3. Add derived logic for leverage sim right before return
const derivedSimReplacement = `  // --- Dynamic Strategy Calculations ---
  // Leverage Simulator Calculations
  const selectedPlatform = LEVERAGE_PLATFORMS.find(p => p.name === simPlatform) || LEVERAGE_PLATFORMS[0];
  const leveragedPosition = simPositionSize * strategyLeverage;
  const calculatedFees = leveragedPosition * selectedPlatform.fee * 2; // entry + exit
  
  let calculatedPnl = 0;
  let pnlPercentage = 0;
  let liquidationPrice = 0;

  if (simTradeDirection === 'LONG') {
    calculatedPnl = leveragedPosition * ((simEndPrice - simStartPrice) / simStartPrice);
    pnlPercentage = (calculatedPnl / simPositionSize) * 100;
    liquidationPrice = simStartPrice * (1 - 1 / strategyLeverage);
  } else {
    calculatedPnl = leveragedPosition * ((simStartPrice - simEndPrice) / simStartPrice);
    pnlPercentage = (calculatedPnl / simPositionSize) * 100;
    liquidationPrice = simStartPrice * (1 + 1 / strategyLeverage);
  }
  
  calculatedPnl -= calculatedFees;

  const [fibLevels, setFibLevels] = useState<number[]>([0.236, 0.382, 0.500, 0.618, 0.786]);`;

code = code.replace(/\/\/ --- Dynamic Strategy Calculations ---\n\s*const \[fibLevels, setFibLevels\] = useState<number\[\]>\(\[0.236, 0.382, 0.500, 0.618, 0.786\]\);/, derivedSimReplacement);

// 4. Update the Select dropdown
const newSelectOptions = `                      <option value="BINANCE:BTCUSDT">Bitcoin (BTC/USDT)</option>
                      <option value="BINANCE:ETHUSDT">Ethereum (ETH/USDT)</option>
                      <option value="BINANCE:SOLUSDT">Solana (SOL/USDT)</option>
                      <option value="BINANCE:BNBUSDT">Binance Coin (BNB/USDT)</option>
                      <option value="BINANCE:XRPUSDT">Ripple (XRP/USDT)</option>
                      <option value="BINANCE:DOGEUSDT">Dogecoin (DOGE/USDT)</option>
                      <option value="BINANCE:ADAUSDT">Cardano (ADA/USDT)</option>
                      <option value="BINANCE:SHIBUSDT">Shiba Inu (SHIB/USDT)</option>
                      <option value="BINANCE:AVAXUSDT">Avalanche (AVAX/USDT)</option>
                      <option value="BINANCE:DOTUSDT">Polkadot (DOT/USDT)</option>
                      <option value="BINANCE:LINKUSDT">Chainlink (LINK/USDT)</option>
                      <option value="BINANCE:MATICUSDT">Polygon (MATIC/USDT)</option>
                      <option value="BINANCE:UNIUSDT">Uniswap (UNI/USDT)</option>
                      <option value="BINANCE:LTCUSDT">Litecoin (LTC/USDT)</option>
                      <option value="BINANCE:NEARUSDT">NEAR (NEAR/USDT)</option>`;

code = code.replace(/<option value="BINANCE:BTCUSDT">Bitcoin \(BTC\/USDT\)<\/option>[\s\S]*?<option value="BINANCE:XRPUSDT">Ripple \(XRP\/USDT\)<\/option>/, newSelectOptions);


// 5. Replace Leverage Slider from first card
code = code.replace(/\/\/ --- Leverage Selector ---/, '');
code = code.replace(/<\!-- Leverage Selector -->/, '');
code = code.replace(/<div className="space-y-2 border-t border-border pt-3">[\s\S]*?<\/div>\s*<\/CardContent>/, '</CardContent>');


// 6. Replace the third card "Strategy Engine Decision" with "Leverage Simulator"
const simCard = `              {/* Leverage Simulator */}
              <Card className="bg-card text-card-foreground border border-border dark:border-slate-800/80 shadow-md">
                <CardHeader className="pb-3 border-b border-border">
                  <CardTitle className="text-[10px] font-mono uppercase tracking-widest text-orange-400 font-bold flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Leverage Simulator
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  
                  {/* Exchange & Direction Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Platform</label>
                      <select 
                        className="w-full bg-background dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-lg p-2.5 text-xs text-foreground dark:text-slate-200 font-mono outline-none"
                        value={simPlatform}
                        onChange={(e) => setSimPlatform(e.target.value)}
                      >
                        {LEVERAGE_PLATFORMS.map(p => (
                          <option key={p.name} value={p.name}>{p.name} ({(p.fee * 100).toFixed(3)}%)</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Direction</label>
                      <select 
                        className="w-full bg-background dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-lg p-2.5 text-xs text-foreground dark:text-slate-200 font-mono outline-none"
                        value={simTradeDirection}
                        onChange={(e) => setSimTradeDirection(e.target.value as 'LONG' | 'SHORT')}
                      >
                        <option value="LONG">Long</option>
                        <option value="SHORT">Short</option>
                      </select>
                    </div>
                  </div>

                  {/* Leverage Slider */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                      <span>Leverage Configuration</span>
                      <span className="font-bold text-orange-400">{strategyLeverage}x</span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={100} 
                      step={1} 
                      value={strategyLeverage} 
                      onChange={(e) => setStrategyLeverage(Number(e.target.value))} 
                      className="w-full accent-orange-500 h-1 bg-muted dark:bg-[#07090e] rounded-lg cursor-pointer" 
                    />
                  </div>

                  {/* Trade Parameters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Start Price</label>
                      <div className="relative flex items-center">
                        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground" />
                        <input 
                          type="number"
                          value={simStartPrice}
                          onChange={(e) => setSimStartPrice(Number(e.target.value))}
                          className="w-full bg-background dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-lg p-2.5 pl-8 text-xs text-foreground dark:text-slate-200 font-mono outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">End Price</label>
                      <div className="relative flex items-center">
                        <DollarSign className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground" />
                        <input 
                          type="number"
                          value={simEndPrice}
                          onChange={(e) => setSimEndPrice(Number(e.target.value))}
                          className="w-full bg-background dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-lg p-2.5 pl-8 text-xs text-foreground dark:text-slate-200 font-mono outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider block">Margin Size (USD)</label>
                    <div className="relative flex items-center">
                      <DollarSign className="w-3.5 h-3.5 absolute left-2.5 text-muted-foreground" />
                      <input 
                        type="number"
                        value={simPositionSize}
                        onChange={(e) => setSimPositionSize(Number(e.target.value))}
                        className="w-full bg-background dark:bg-[#07090e] border border-border dark:border-slate-800 rounded-lg p-2.5 pl-8 text-xs text-foreground dark:text-slate-200 font-mono outline-none focus:border-orange-500"
                      />
                    </div>
                  </div>

                  {/* Result Dashboard */}
                  <div className="bg-muted/50 dark:bg-[#07090e] border border-border/50 dark:border-slate-800/50 rounded-xl p-4 flex flex-col gap-3 relative overflow-hidden">
                    <div className="flex justify-between items-center pb-2 border-b border-border/50 dark:border-slate-800/50">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Estimated PnL</span>
                      <span className={\`text-sm font-bold font-mono \${calculatedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}\`}>
                        {calculatedPnl >= 0 ? '+' : ''}{calculatedPnl.toFixed(2)} USD ({pnlPercentage.toFixed(2)}%)
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Est. Fees</span>
                      <span className="text-[11px] font-mono text-amber-500">\${calculatedFees.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-mono text-muted-foreground uppercase">Liquidation Price</span>
                      <span className="text-[11px] font-mono text-red-500">\${liquidationPrice.toFixed(2)}</span>
                    </div>
                  </div>

                </CardContent>
              </Card>`;

code = code.replace(/\{\/\* Status and Action execution \*\/\}(.|\n)*?\{\/\* COLUMN 2: FIBONACCI RETRACEMENT GAUGE/, simCard + '\n\n            {/* COLUMN 2: FIBONACCI RETRACEMENT GAUGE');

fs.writeFileSync('src/components/StrategyBuilder.tsx', code);
