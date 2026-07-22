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

export default function MarketTicker() {
  const [data, setData] = useState<MarketMoversData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/coingecko/market-movers');
        if (response.ok) {
          const result = await response.json();
          setData(result);
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

  if (!data) return null;

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
