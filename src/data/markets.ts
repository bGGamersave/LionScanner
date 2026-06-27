export interface MarketAsset {
  id: string;
  name: string;
  symbol: string; // TradingView symbol
  label: string;  // Human-readable label
  category: 'Crypto' | 'Stock' | 'Metal';
}

export const SEARCHABLE_MARKETS: MarketAsset[] = [
  // Crypto
  { id: 'btc', name: 'Bitcoin', symbol: 'BINANCE:BTCUSDT', label: 'BTC / USDT', category: 'Crypto' },
  { id: 'eth', name: 'Ethereum', symbol: 'BINANCE:ETHUSDT', label: 'ETH / USDT', category: 'Crypto' },
  { id: 'sol', name: 'Solana', symbol: 'BINANCE:SOLUSDT', label: 'SOL / USDT', category: 'Crypto' },
  { id: 'xrp', name: 'Ripple', symbol: 'BINANCE:XRPUSDT', label: 'XRP / USDT', category: 'Crypto' },
  { id: 'ada', name: 'Cardano', symbol: 'BINANCE:ADAUSDT', label: 'ADA / USDT', category: 'Crypto' },
  { id: 'dot', name: 'Polkadot', symbol: 'BINANCE:DOTUSDT', label: 'DOT / USDT', category: 'Crypto' },
  // Stocks
  { id: 'tsla', name: 'Tesla, Inc.', symbol: 'NASDAQ:TSLA', label: 'TSLA (Tesla)', category: 'Stock' },
  { id: 'aapl', name: 'Apple Inc.', symbol: 'NASDAQ:AAPL', label: 'AAPL (Apple)', category: 'Stock' },
  { id: 'nvda', name: 'NVIDIA Corporation', symbol: 'NASDAQ:NVDA', label: 'NVDA (NVIDIA)', category: 'Stock' },
  { id: 'msft', name: 'Microsoft Corporation', symbol: 'NASDAQ:MSFT', label: 'MSFT (Microsoft)', category: 'Stock' },
  { id: 'amzn', name: 'Amazon.com, Inc.', symbol: 'NASDAQ:AMZN', label: 'AMZN (Amazon)', category: 'Stock' },
  { id: 'meta', name: 'Meta Platforms, Inc.', symbol: 'NASDAQ:META', label: 'META (Meta)', category: 'Stock' },
  { id: 'googl', name: 'Alphabet Inc.', symbol: 'NASDAQ:GOOGL', label: 'GOOGL (Google)', category: 'Stock' },
  // Metals
  { id: 'gold', name: 'Gold Spot', symbol: 'OANDA:XAUUSD', label: 'GOLD (XAU/USD)', category: 'Metal' },
  { id: 'silver', name: 'Silver Spot', symbol: 'OANDA:XAGUSD', label: 'SILVER (XAG/USD)', category: 'Metal' },
  { id: 'platinum', name: 'Platinum Spot', symbol: 'OANDA:XPTUSD', label: 'PLATINUM (XPT/USD)', category: 'Metal' },
  { id: 'palladium', name: 'Palladium Spot', symbol: 'OANDA:XPDUSD', label: 'PALLADIUM (XPD/USD)', category: 'Metal' },
  { id: 'copper', name: 'Copper Spot', symbol: 'COMEX:HG1!', label: 'COPPER', category: 'Metal' }
];
