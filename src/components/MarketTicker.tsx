import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface TickerItem {
  symbol: string;
  price: number;
  change24h: number;
}

interface MarketMoversData {
  top10MarketCap: TickerItem[];
  top10Gainers: TickerItem[];
  top10Losers: TickerItem[];
}

const DEFAULT_MARKET_MOVERS: MarketMoversData = {
  top10MarketCap: [
    { symbol: 'BTC', price: 91450, change24h: 3.42 },
    { symbol: 'ETH', price: 3340, change24h: 2.18 },
    { symbol: 'SOL', price: 188.50, change24h: 5.61 },
    { symbol: 'BNB', price: 645.20, change24h: 1.15 },
    { symbol: 'XRP', price: 2.45, change24h: 8.90 },
    { symbol: 'DOGE', price: 0.38, change24h: -1.25 },
    { symbol: 'ADA', price: 0.82, change24h: 4.10 },
    { symbol: 'AVAX', price: 34.10, change24h: 6.80 },
    { symbol: 'LINK', price: 18.20, change24h: 0.95 },
    { symbol: 'SUI', price: 3.15, change24h: 12.40 }
  ],
  top10Gainers: [
    { symbol: 'SUI', price: 3.15, change24h: 12.40 },
    { symbol: 'XRP', price: 2.45, change24h: 8.90 },
    { symbol: 'AVAX', price: 34.10, change24h: 6.80 },
    { symbol: 'SOL', price: 188.50, change24h: 5.61 },
    { symbol: 'ADA', price: 0.82, change24h: 4.10 },
    { symbol: 'BTC', price: 91450, change24h: 3.42 },
    { symbol: 'ETH', price: 3340, change24h: 2.18 },
    { symbol: 'BNB', price: 645.20, change24h: 1.15 },
    { symbol: 'LINK', price: 18.20, change24h: 0.95 },
    { symbol: 'NEAR', price: 6.70, change24h: 0.80 }
  ],
  top10Losers: [
    { symbol: 'PEPE', price: 0.000019, change24h: -2.80 },
    { symbol: 'DOGE', price: 0.38, change24h: -1.25 },
    { symbol: 'SHIB', price: 0.000024, change24h: -0.90 },
    { symbol: 'APT', price: 11.20, change24h: -0.45 }
  ]
};

export default function MarketTicker() {
  const [data, setData] = useState<MarketMoversData>(DEFAULT_MARKET_MOVERS);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/coingecko/market-movers');
        if (response.ok) {
          const result = await response.json();
          if (result && result.top10MarketCap && result.top10MarketCap.length > 0) {
            setData(result);
          }
        }
      } catch (error) {
        console.error("Failed to fetch market movers:", error);
      }
    };

    fetchData();
    // Update every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const renderTickerItems = (items: TickerItem[], icon: React.ReactNode, label: string) => (
    <div className="flex items-center gap-6 px-4">
      <div className="flex items-center gap-2 text-muted-foreground font-semibold text-xs whitespace-nowrap uppercase tracking-wider shrink-0">
        {icon}
        {label}
      </div>
      {items.map((item, idx) => (
        <div key={`${item.symbol}-${idx}`} className="flex items-center gap-2 whitespace-nowrap shrink-0">
          <span className="font-mono text-sm font-medium">{item.symbol}</span>
          <span className="font-mono text-sm">${item.price >= 1 ? item.price.toFixed(2) : item.price.toPrecision(4)}</span>
          <span className={`font-mono text-xs font-bold ${item.change24h >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {item.change24h >= 0 ? '+' : ''}{item.change24h?.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full bg-card border-b border-border/50 overflow-hidden py-2 relative flex items-center shrink-0">
      <div className="flex animate-marquee hover:pause select-none">
        <div className="flex items-center min-w-full justify-around gap-12 px-6">
          {renderTickerItems(data.top10MarketCap, <Activity className="w-3.5 h-3.5 text-blue-500" />, "Top 10 Market Cap")}
          {renderTickerItems(data.top10Gainers, <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />, "Top 10 Gainers")}
          {renderTickerItems(data.top10Losers, <TrendingDown className="w-3.5 h-3.5 text-red-500" />, "Top 10 Losers")}
        </div>
        {/* Duplicate for seamless looping */}
        <div className="flex items-center min-w-full justify-around gap-12 px-6" aria-hidden="true">
          {renderTickerItems(data.top10MarketCap, <Activity className="w-3.5 h-3.5 text-blue-500" />, "Top 10 Market Cap")}
          {renderTickerItems(data.top10Gainers, <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />, "Top 10 Gainers")}
          {renderTickerItems(data.top10Losers, <TrendingDown className="w-3.5 h-3.5 text-red-500" />, "Top 10 Losers")}
        </div>
      </div>
    </div>
  );
}
