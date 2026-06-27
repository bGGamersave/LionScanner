export interface StrategyAnalysis {
  timeframe: string;
  label: string;
  lastUpdated: string;
  bias: 'LONG' | 'SHORT' | 'BUY' | 'SELL' | 'NEUTRAL';
  confidence: number;
  marketCipher: {
    momentum: string;
    moneyFlow: string;
    signals: string[];
    rsiState: string;
  };
  fibonacci: {
    low: string;
    high: string;
    levels: { label: string; value: string; desc: string }[];
  };
  fvrp: {
    vah: string;
    poc: string;
    val: string;
    volumeProfile: string;
  };
  tradePlan: {
    action: string;
    entry: string;
    stopLoss: string;
    takeProfit: string;
    justification: string;
  };
}

export const TIMEFRAME_ANALYSIS: Record<string, StrategyAnalysis> = {
  '60': {
    timeframe: '60',
    label: '1H',
    lastUpdated: '1 hour ago',
    bias: 'LONG',
    confidence: 81,
    marketCipher: {
      momentum: 'Momentum wave is curving upward from oversold territory. A local bottom is forming.',
      moneyFlow: 'Money flow is crossing into positive (Green) area on the 1H timeframe.',
      signals: ['Green Dot triggered' , 'VWAP crossing over the zero line'],
      rsiState: 'Stochastic RSI has fully reset and is pointing bullishly upward.'
    },
    fibonacci: {
      low: '$62,800',
      high: '$65,400',
      levels: [
        { label: '0.382 Level', value: '$64,400', desc: 'Immediate Resistance' },
        { label: '0.500 Level', value: '$64,100', desc: 'Mid-point Retest Support' },
        { label: '0.618 Golden Pocket', value: '$63,790', desc: 'Strong Buy Confluence Zone' }
      ]
    },
    fvrp: {
      vah: '$65,100',
      poc: '$64,250',
      val: '$63,400',
      volumeProfile: 'High cluster of trading volume witnessed at POC. VAL acts as the primary demand floor.'
    },
    tradePlan: {
      action: 'Aggressive LONG on local dip',
      entry: '$63,850 - $64,100',
      stopLoss: '$63,300 (below VAL)',
      takeProfit: '$65,100 - $65,500',
      justification: 'The 1H green dot confluence with the 0.618 Fib line and Point of Control liquidity makes an excellent high-R:R scalp setup.'
    }
  },
  '240': {
    timeframe: '240',
    label: '4H',
    lastUpdated: '4 hours ago',
    bias: 'LONG',
    confidence: 85,
    marketCipher: {
      momentum: 'Wave B is creating a series of higher lows. Double green dot confirmed on momentum waves.',
      moneyFlow: 'Thick green money flow indicates heavy accumulation by the swarm on larger intraday cycles.',
      signals: ['Dual Bullish Div' , 'Green Dot Confirmed' , 'VWAP acceleration'],
      rsiState: 'RSI trending at 58, indicating high potential room for expansion before overbought.'
    },
    fibonacci: {
      low: '$61,200',
      high: '$66,100',
      levels: [
        { label: '0.236 Level', value: '$64,950', desc: 'Local resistance turned support' },
        { label: '0.500 Level', value: '$63,650', desc: 'Core consolidation layer' },
        { label: '0.618 Golden Pocket', value: '$63,070', desc: 'Ultimate Trend Inception Support' }
      ]
    },
    fvrp: {
      vah: '$65,800',
      poc: '$63,900',
      val: '$62,100',
      volumeProfile: 'Extremely strong support shelf built near the $63.9K POC. Any drop is quickly absorbed.'
    },
    tradePlan: {
      action: 'Swing LONG',
      entry: '$63,900 - $64,200',
      stopLoss: '$62,950 (below the Golden Pocket)',
      takeProfit: '$65,800 - $66,900',
      justification: 'Perfect confluence of 4H POC absorption with dual green dots on Market Cipher B supporting the long bias.'
    }
  },
  '720': {
    timeframe: '720',
    label: '12H',
    lastUpdated: '12 hours ago',
    bias: 'BUY',
    confidence: 78,
    marketCipher: {
      momentum: 'Momentum anchors have flattened, and a larger trigger wave is forming to push past $66K.',
      moneyFlow: 'Money flow is recovering from temporary red into transition zone (neutral).',
      signals: ['Green anchor wave confirmed' , 'Momentum crossover upward'],
      rsiState: 'RSI at 52, holding securely above the median line.'
    },
    fibonacci: {
      low: '$59,500',
      high: '$68,200',
      levels: [
        { label: '0.382 Level', value: '$64,880', desc: 'Local inflection zone' },
        { label: '0.500 Level', value: '$63,850', desc: 'Swarm volume pivot' },
        { label: '0.618 Golden Pocket', value: '$62,820', desc: 'Macro accumulation base' }
      ]
    },
    fvrp: {
      vah: '$67,100',
      poc: '$63,200',
      val: '$60,400',
      volumeProfile: 'Low Volume Node exists between $64.8K and $66K; a break above $64.8K will cause a rapidly violent expansion upward.'
    },
    tradePlan: {
      action: 'Limit BUY accumulation',
      entry: '$63,200 - $63,850',
      stopLoss: '$62,300',
      takeProfit: '$67,100 - $68,500',
      justification: 'Volume profile indicates a major supply void above the current range. Once we clear the 0.382 Fib, the price should quickly expand back to VAH.'
    }
  },
  'D': {
    timeframe: 'D',
    label: '1D',
    lastUpdated: '18 hours ago',
    bias: 'BUY',
    confidence: 90,
    marketCipher: {
      momentum: 'Major daily anchor wave curving strongly upward. Green dot confirmed on the daily close.',
      moneyFlow: 'Steady bullish money flow expanding since two weeks ago. Strong institutional presence.',
      signals: ['Premium Daily Green Dot' , 'VWAP breakout above outer boundary'],
      rsiState: 'Daily RSI breakout from a descending channel, currently resting at 62.'
    },
    fibonacci: {
      low: '$56,000',
      high: '$73,800',
      levels: [
        { label: '0.382 Level', value: '$67,000', desc: 'Major trend accelerant level' },
        { label: '0.500 Level', value: '$64,900', desc: 'Key psychological retest support' },
        { label: '0.618 Golden Pocket', value: '$62,800', desc: 'Macro trend pivot floor' }
      ]
    },
    fvrp: {
      vah: '$71,500',
      poc: '$62,800',
      val: '$58,200',
      volumeProfile: 'Point of Control aligns perfectly with the 0.618 Golden Pocket on the daily chart, confirming the ultimate macro support area.'
    },
    tradePlan: {
      action: 'Macro BUY',
      entry: '$62,800 - $64,900',
      stopLoss: '$59,800',
      takeProfit: '$71,500 - $74,000',
      justification: 'The confluence of a daily green dot and POC/Golden Pocket alignment is the highest probability setup in the trading strategy.'
    }
  },
  'W': {
    timeframe: 'W',
    label: '1W',
    lastUpdated: '23 hours ago',
    bias: 'LONG',
    confidence: 76,
    marketCipher: {
      momentum: 'Weekly waves remain elevated in the upper channel, continuing macro structural uptrend.',
      moneyFlow: 'Broad green money flow indicates healthy long-term storage and spot accumulation.',
      signals: ['Bullish structural retest' , 'Weekly VWAP bouncing from zero bounds'],
      rsiState: 'RSI resting at 64, maintaining strong bullish momentum territory.'
    },
    fibonacci: {
      low: '$38,500',
      high: '$73,800',
      levels: [
        { label: '0.382 Level', value: '$60,300', desc: 'Macro weekly structural support' },
        { label: '0.500 Level', value: '$56,150', desc: 'Mid-cycle pullback bottom' },
        { label: '0.618 Golden Pocket', value: '$52,000', desc: 'Primary bull market defense floor' }
      ]
    },
    fvrp: {
      vah: '$69,200',
      poc: '$43,500',
      val: '$39,800',
      volumeProfile: 'Historical volume POC is situated low, signifying deep underlying global support.'
    },
    tradePlan: {
      action: 'Macro position LONG',
      entry: '$60,300 - $62,500',
      stopLoss: '$55,000',
      takeProfit: '$73,800 - $82,000',
      justification: 'Weekly structural support holds strong. Spot buyers can accumulate on any pullbacks to weekly SMA and 0.382 Fib targets.'
    }
  },
  'M': {
    timeframe: 'M',
    label: '1M',
    lastUpdated: '24 hours ago',
    bias: 'LONG',
    confidence: 83,
    marketCipher: {
      momentum: 'Monthly anchor waves starting third wave upward of the current macro cycle.',
      moneyFlow: 'Deep green ocean of money flow indicating multi-year capital injection.',
      signals: ['Macro Green dot in early cycle expansion'],
      rsiState: 'RSI holds at 70, reflecting healthy bull market velocity.'
    },
    fibonacci: {
      low: '$16,200',
      high: '$73,800',
      levels: [
        { label: '0.382 Level', value: '$51,800', desc: 'Ultra-secure historical cycle floor' },
        { label: '0.500 Level', value: '$45,000', desc: 'Cycle median value' },
        { label: '0.618 Golden Pocket', value: '$38,200', desc: 'Ultimate absolute cycle bottom' }
      ]
    },
    fvrp: {
      vah: '$64,900',
      poc: '$28,400',
      val: '$19,500',
      volumeProfile: 'Trading profile clearly highlights that current levels above $60K represent a major price discovery phase with strong validation.'
    },
    tradePlan: {
      action: 'Strategic SPOT Accumulation',
      entry: '$58,000 - $64,000',
      stopLoss: 'No leverage (spot macro only)',
      takeProfit: '$88,000 - $120,000',
      justification: 'Monthly momentum points to long term extension. Current levels represent safe spots to build position for higher cycle peaks.'
    }
  }
};
