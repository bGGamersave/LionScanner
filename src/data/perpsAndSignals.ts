export interface PerpAsset {
  symbol: string;
  name: string;
  tvSymbol: string;
  category: 'Crypto' | 'Stocks' | 'Commodities' | 'Forex';
  price: number;
  change24h: number;
  fundingRate: string;
  openInterest: string;
}

export interface ProSignal {
  id: string;
  asset: string; // e.g. BTC/USD
  category: 'Crypto' | 'Stocks' | 'Commodities' | 'Forex';
  type: 'Long' | 'Short';
  entry: string;
  target: string;
  stopLoss: string;
  status: 'Active' | 'Pending' | 'Closed (Win)' | 'Closed (Loss)';
  time: string;
  confidence: number;
  timeframe: string;
  confluenceFactors: string[];
}

export const PERP_ASSETS: PerpAsset[] = [
  // Crypto
  {
    symbol: 'BTC/USD',
    name: 'Bitcoin',
    tvSymbol: 'BINANCE:BTCUSDT',
    category: 'Crypto',
    price: 64212.45,
    change24h: 2.45,
    fundingRate: '+0.012%',
    openInterest: '$1.42B'
  },
  {
    symbol: 'ETH/USD',
    name: 'Ethereum',
    tvSymbol: 'BINANCE:ETHUSDT',
    category: 'Crypto',
    price: 3452.10,
    change24h: 1.84,
    fundingRate: '+0.008%',
    openInterest: '$890M'
  },
  {
    symbol: 'SOL/USD',
    name: 'Solana',
    tvSymbol: 'BINANCE:SOLUSDT',
    category: 'Crypto',
    price: 145.82,
    change24h: 5.12,
    fundingRate: '+0.045%',
    openInterest: '$450M'
  },
  {
    symbol: 'XRP/USD',
    name: 'Ripple',
    tvSymbol: 'BINANCE:XRPUSDT',
    category: 'Crypto',
    price: 0.6212,
    change24h: -0.32,
    fundingRate: '+0.005%',
    openInterest: '$120M'
  },
  {
    symbol: 'LINK/USD',
    name: 'Chainlink',
    tvSymbol: 'BINANCE:LINKUSDT',
    category: 'Crypto',
    price: 18.45,
    change24h: -1.15,
    fundingRate: '+0.010%',
    openInterest: '$95M'
  },
  // Stocks
  {
    symbol: 'TSLA/USD',
    name: 'Tesla, Inc.',
    tvSymbol: 'NASDAQ:TSLA',
    category: 'Stocks',
    price: 175.20,
    change24h: 3.65,
    fundingRate: '+0.002%',
    openInterest: '$210M'
  },
  {
    symbol: 'AAPL/USD',
    name: 'Apple Inc.',
    tvSymbol: 'NASDAQ:AAPL',
    category: 'Stocks',
    price: 189.10,
    change24h: 0.95,
    fundingRate: '+0.001%',
    openInterest: '$340M'
  },
  {
    symbol: 'NVDA/USD',
    name: 'NVIDIA Corp.',
    tvSymbol: 'NASDAQ:NVDA',
    category: 'Stocks',
    price: 935.50,
    change24h: 6.74,
    fundingRate: '+0.003%',
    openInterest: '$480M'
  },
  {
    symbol: 'MSFT/USD',
    name: 'Microsoft Corp.',
    tvSymbol: 'NASDAQ:MSFT',
    category: 'Stocks',
    price: 421.90,
    change24h: 1.12,
    fundingRate: '+0.001%',
    openInterest: '$280M'
  },
  // Commodities
  {
    symbol: 'GOLD/USD',
    name: 'Gold Spot',
    tvSymbol: 'OANDA:XAUUSD',
    category: 'Commodities',
    price: 2412.50,
    change24h: 0.45,
    fundingRate: '+0.000%',
    openInterest: '$620M'
  },
  {
    symbol: 'SILVER/USD',
    name: 'Silver Spot',
    tvSymbol: 'OANDA:XAGUSD',
    category: 'Commodities',
    price: 28.64,
    change24h: 1.22,
    fundingRate: '+0.000%',
    openInterest: '$180M'
  },
  {
    symbol: 'CRUDE_OIL/USD',
    name: 'WTI Crude Oil',
    tvSymbol: 'OANDA:WTICOUSD',
    category: 'Commodities',
    price: 78.40,
    change24h: -1.82,
    fundingRate: '+0.004%',
    openInterest: '$240M'
  },
  // Forex
  {
    symbol: 'EUR/USD',
    name: 'Euro / US Dollar',
    tvSymbol: 'FX:EURUSD',
    category: 'Forex',
    price: 1.0820,
    change24h: -0.12,
    fundingRate: '+0.002%',
    openInterest: '$550M'
  },
  {
    symbol: 'GBP/USD',
    name: 'British Pound / USD',
    tvSymbol: 'FX:GBPUSD',
    category: 'Forex',
    price: 1.2742,
    change24h: 0.15,
    fundingRate: '+0.003%',
    openInterest: '$410M'
  }
];

export const PRO_SIGNALS: ProSignal[] = [
  // Crypto Signals
  {
    id: 'SIG-CRY-101',
    asset: 'BTC/USD',
    category: 'Crypto',
    type: 'Long',
    entry: '$64,230.00',
    target: '$67,000.00',
    stopLoss: '$62,800.00',
    status: 'Active',
    time: '2m ago',
    confidence: 85,
    timeframe: '4H',
    confluenceFactors: ['Market Cipher B Green Dot', '0.618 Fib Support', 'POC Absorption']
  },
  {
    id: 'SIG-CRY-102',
    asset: 'SOL/USD',
    category: 'Crypto',
    type: 'Long',
    entry: '$145.80',
    target: '$162.00',
    stopLoss: '$139.50',
    status: 'Closed (Win)',
    time: '1h ago',
    confidence: 91,
    timeframe: '12H',
    confluenceFactors: ['Dual Bullish Div', 'Stoch RSI upward crossover', 'VAL Golden Pocket retest']
  },
  {
    id: 'SIG-CRY-103',
    asset: 'ETH/USD',
    category: 'Crypto',
    type: 'Short',
    entry: '$3,450.25',
    target: '$3,250.00',
    stopLoss: '$3,530.00',
    status: 'Pending',
    time: '5m ago',
    confidence: 62,
    timeframe: '1H',
    confluenceFactors: ['VHF Resistance', 'VWAP breakdown below zero line']
  },
  
  // Stock Perps Signals
  {
    id: 'SIG-STK-201',
    asset: 'NVDA/USD',
    category: 'Stocks',
    type: 'Long',
    entry: '$935.50',
    target: '$990.00',
    stopLoss: '$912.00',
    status: 'Active',
    time: '12m ago',
    confidence: 88,
    timeframe: '1D',
    confluenceFactors: ['Institutional accumulation cluster', 'Thick Green money flow', '0.382 Fib hold']
  },
  {
    id: 'SIG-STK-202',
    asset: 'TSLA/USD',
    category: 'Stocks',
    type: 'Short',
    entry: '$175.20',
    target: '$162.00',
    stopLoss: '$181.50',
    status: 'Active',
    time: '45m ago',
    confidence: 73,
    timeframe: '4H',
    confluenceFactors: ['Descending channel boundary retest', 'Red momentum wave forming', 'POC supply cluster']
  },
  {
    id: 'SIG-STK-203',
    asset: 'AAPL/USD',
    category: 'Stocks',
    type: 'Long',
    entry: '$189.10',
    target: '$198.00',
    stopLoss: '$185.00',
    status: 'Closed (Win)',
    time: '2h ago',
    confidence: 82,
    timeframe: '1H',
    confluenceFactors: ['Weekly Support validation', 'Anchor wave curvature upward', 'Bullish wedge breakout']
  },

  // Commodity / Forex Signals
  {
    id: 'SIG-COM-301',
    asset: 'GOLD/USD',
    category: 'Commodities',
    type: 'Long',
    entry: '$2,412.50',
    target: '$2,450.00',
    stopLoss: '$2,395.00',
    status: 'Active',
    time: '15m ago',
    confidence: 89,
    timeframe: '12H',
    confluenceFactors: ['Stochastic RSI reset', 'POC liquidity bounce', 'Safe-haven accumulation trigger']
  },
  {
    id: 'SIG-COM-302',
    asset: 'CRUDE_OIL/USD',
    category: 'Commodities',
    type: 'Short',
    entry: '$78.40',
    target: '$74.00',
    stopLoss: '$80.20',
    status: 'Pending',
    time: '30m ago',
    confidence: 67,
    timeframe: '4H',
    confluenceFactors: ['VAH exhaustion', 'Stall in volume demand profile', 'Macro supply surplus data']
  },
  {
    id: 'SIG-FOR-401',
    asset: 'EUR/USD',
    category: 'Forex',
    type: 'Long',
    entry: '$1.0820',
    target: '$1.0910',
    stopLoss: '$1.0785',
    status: 'Active',
    time: '1h ago',
    confidence: 71,
    timeframe: '1H',
    confluenceFactors: ['Double Bottom formation', 'VWAP acceleration crossing zero', 'Green Dot trigger']
  }
];
