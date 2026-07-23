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

fs.writeFileSync('src/components/StrategyBuilder.tsx', code);
