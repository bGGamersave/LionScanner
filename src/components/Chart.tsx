import React, { useState, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';

interface ChartProps {
  interval?: string;
  symbol?: string;
  height?: number | string;
}

export default function Chart({ interval = 'D', symbol = 'BINANCE:BTCUSDT', height }: ChartProps) {
  const [chartHeight, setChartHeight] = useState<number | string>(350);

  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth < 640 ? 350 : 520);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const finalHeight = height || chartHeight;

  return (
    <div className="w-full transition-all duration-300" style={{ height: finalHeight }} key={`${symbol}_${interval}`}>
      <AdvancedRealTimeChart
        theme="dark"
        autosize
        symbol={symbol}
        interval={interval}
        timezone="Etc/UTC"
        style="1"
        locale="en"
        allow_symbol_change={true}
        calendar={false}
        hide_top_toolbar={false}
        hide_legend={false}
        save_image={true}
        toolbar_bg="#050505"
        container_id={`tradingview_${symbol.replace(':', '_')}_${interval}`}
      />
    </div>
  );
}
