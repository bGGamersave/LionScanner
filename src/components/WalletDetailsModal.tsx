import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  QrCode, 
  Wallet, 
  ExternalLink, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  Download,
  Shield,
  RefreshCw,
  Camera
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface WalletDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletAddress: string | null;
  usdcBalance: number;
  solBalance: number;
  solPrice: number;
  blockchain: string;
  walletType: string;
  onConnectWallet?: () => void;
}

export default function WalletDetailsModal({
  isOpen,
  onClose,
  walletAddress,
  usdcBalance,
  solBalance,
  solPrice,
  blockchain,
  walletType,
  onConnectWallet
}: WalletDetailsModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  const solValue = solBalance * solPrice;
  const totalValue = usdcBalance + solValue;

  const solPercent = totalValue > 0 ? (solValue / totalValue) * 100 : 0;
  const usdcPercent = totalValue > 0 ? (usdcBalance / totalValue) * 100 : 0;

  useEffect(() => {
    if (isOpen) {
      // Simulate taking a screenshot effect on load
      setIsCapturing(true);
      const timer1 = setTimeout(() => {
        setShowFlash(true);
        const timer2 = setTimeout(() => {
          setShowFlash(false);
          setIsCapturing(false);
        }, 300);
      }, 800);
    } else {
      setCapturedImage(null);
    }
  }, [isOpen]);

  const handleCopy = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const triggerManualCapture = () => {
    setIsCapturing(true);
    setTimeout(() => {
      setShowFlash(true);
      setTimeout(() => {
        setShowFlash(false);
        setIsCapturing(false);
      }, 200);
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden shadow-2xl rounded-2xl">
        
        {/* Screenshot flash effect */}
        {showFlash && (
          <div className="absolute inset-0 bg-white z-[200] opacity-80 pointer-events-none transition-opacity duration-300" />
        )}

        <DialogHeader className="p-5 pb-3 border-b border-zinc-900 bg-zinc-900/40 flex flex-row items-center justify-between">
          <div className="space-y-0.5">
            <DialogTitle className="text-sm font-bold font-mono uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-primary animate-pulse" />
              On-Chain Wallet Screenshot
            </DialogTitle>
            <DialogDescription className="text-[10px] text-zinc-500 font-mono">
              Live ledger snapshot hash: {walletAddress ? `SWARM-${walletAddress.slice(0, 8).toUpperCase()}` : 'DISCONNECTED'}
            </DialogDescription>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {!walletAddress ? (
          <div className="p-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mx-auto">
              <Wallet className="w-8 h-8 text-zinc-600" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-bold font-mono uppercase text-zinc-300">Wallet Disconnected</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                No active Web3 wallet is connected. Please connect a simulated Solana or Ethereum wallet in the strategy room to capture details.
              </p>
            </div>
            {onConnectWallet && (
              <Button 
                onClick={() => {
                  onClose();
                  onConnectWallet();
                }}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase px-6 tracking-wider cursor-pointer h-9 hover:bg-primary/95"
              >
                Connect Wallet Now
              </Button>
            )}
          </div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Captured Device/Mockup Window representing a simulated screenshot */}
            <div className="relative border border-zinc-800 rounded-xl overflow-hidden bg-black/60 shadow-inner">
              
              {/* Screenshot header ornament */}
              <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[9px] font-mono text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>LIVE SCREENSHOT DEPOSIT CAPTURE</span>
                </div>
                <span>{blockchain.toUpperCase()} NETWORK</span>
              </div>

              {/* Simulated Extension Content */}
              <div className="p-5 space-y-5 relative">
                
                {/* Connection metadata */}
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-[8px] uppercase tracking-widest text-zinc-500 font-mono">Connected Client</span>
                    <p className="text-xs font-bold font-mono text-zinc-300 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-primary" />
                      {walletType} Wallet
                    </p>
                  </div>
                  <Badge variant="outline" className="border-primary/20 bg-primary/5 text-primary text-[8px] font-mono uppercase">
                    Verified Holder
                  </Badge>
                </div>

                {/* Primary Balance Section */}
                <div className="space-y-1 py-1">
                  <span className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-mono block">Total Wallet Valuation</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold font-mono text-zinc-100 tracking-tight">
                      ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      +{(totalValue * 0.012).toLocaleString(undefined, { style: 'currency', currency: 'USD' })} today
                    </span>
                  </div>
                </div>

                {/* Account Address Field */}
                <div className="bg-zinc-950/60 border border-zinc-900 rounded-lg p-2.5 flex items-center justify-between font-mono text-[10px]">
                  <div className="space-y-0.5">
                    <span className="text-[7.5px] uppercase text-zinc-500 tracking-wider">Public Key Address</span>
                    <p className="text-zinc-300 font-semibold">{walletAddress.slice(0, 10)}...{walletAddress.slice(-10)}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleCopy}
                    className="h-7 w-7 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>

                {/* Assets Holdings Breakdown */}
                <div className="space-y-3">
                  <span className="text-[8.5px] uppercase tracking-wider text-zinc-500 font-mono block border-b border-zinc-900 pb-1.5">Token Holdings Distribution</span>
                  
                  <div className="space-y-2.5">
                    {/* SOL holding */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-[10px]">
                          ☀️
                        </div>
                        <div>
                          <p className="font-bold font-mono text-zinc-200">SOL</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{solBalance.toFixed(2)} SOL @ ${solPrice.toFixed(2)}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-zinc-100">${solValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-zinc-500 font-mono">{solPercent.toFixed(1)}% weight</p>
                      </div>
                    </div>

                    {/* USDC holding */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center font-bold text-zinc-300 text-[10px]">
                          💵
                        </div>
                        <div>
                          <p className="font-bold font-mono text-zinc-200">USDC</p>
                          <p className="text-[9px] text-zinc-500 font-mono">{usdcBalance.toFixed(2)} USDC @ $1.00</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-zinc-100">${usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p className="text-[9px] text-zinc-500 font-mono">{usdcPercent.toFixed(1)}% weight</p>
                      </div>
                    </div>

                    {/* Dynamic Surprise Bonus: $LION Swarm Token */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center font-bold text-amber-500 text-[10px]">
                          🦁
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold font-mono text-amber-500">LION</p>
                            <span className="text-[7px] uppercase bg-amber-500/10 text-amber-500 px-1 rounded font-extrabold font-mono">AIRDROP</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 font-mono">1,500.00 LION @ $0.082</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold font-mono text-amber-500">$123.00</p>
                        <p className="text-[9px] text-zinc-500 font-mono">&lt; 1% weight</p>
                      </div>
                    </div>
                  </div>

                  {/* Combined Weight visual bar */}
                  <div className="h-1.5 rounded-full bg-zinc-900 overflow-hidden flex mt-2.5">
                    <div className="bg-zinc-200 h-full" style={{ width: `${solPercent}%` }} title="SOL" />
                    <div className="bg-primary h-full" style={{ width: `${usdcPercent}%` }} title="USDC" />
                    <div className="bg-amber-500 h-full" style={{ width: '2%' }} title="LION Airdrop" />
                  </div>
                </div>

                {/* Simulated QR & Metadata stamp on screenshot */}
                <div className="border-t border-zinc-900/60 pt-4 flex items-center justify-between">
                  <div className="space-y-1 font-mono">
                    <span className="text-[7.5px] uppercase text-zinc-500 block">Screenshot Integrity Hash</span>
                    <span className="text-[8.5px] text-zinc-400 select-all tracking-tight break-all">
                      SHA256: {walletAddress ? walletAddress.slice(0, 16) : ''}...[OK]
                    </span>
                    <div className="text-[8px] text-zinc-600">Captured: {new Date().toLocaleString()}</div>
                  </div>
                  <div className="p-1 bg-white rounded-lg border border-zinc-800 shadow-md">
                    <QrCode className="w-12 h-12 text-black" />
                  </div>
                </div>

                {/* Watermark badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-5 border-2 border-primary rotate-12 p-3 rounded-xl uppercase font-extrabold font-sans text-2xl tracking-widest text-primary">
                  Lions Trading Swarm
                </div>
              </div>
            </div>

            {/* Actions panel */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={triggerManualCapture}
                disabled={isCapturing}
                className="flex-1 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-200 font-mono text-xs uppercase h-9 tracking-wider cursor-pointer flex items-center justify-center gap-2"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCapturing ? 'animate-spin' : ''}`} />
                {isCapturing ? 'Recapturing...' : 'Refresh Screenshot'}
              </Button>
              <Button 
                onClick={() => {
                  alert('On-chain wallet receipt and high-resolution screenshot saved to downloads folder (simulated).');
                }}
                className="bg-primary text-primary-foreground font-mono text-xs uppercase h-9 px-4 tracking-wider cursor-pointer flex items-center justify-center gap-1.5 hover:bg-primary/95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save PNG</span>
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
