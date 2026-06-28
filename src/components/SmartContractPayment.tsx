import React, { useState, useEffect } from 'react';
import { 
  Coins, 
  ArrowRight, 
  Lock, 
  ShieldCheck, 
  CheckCircle2, 
  Wallet, 
  Info, 
  Sparkles, 
  RefreshCw, 
  HelpCircle, 
  X, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface SmartContractPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  tier: 'basic' | 'pro' | 'ultimate';
  price: number;
  walletAddress: string | null;
  onConnectWallet: () => void;
  usdcBalance: number;
  setUsdcBalance: (b: number) => void;
  solBalance: number;
  setSolBalance: (b: number) => void;
  onSuccess: () => void;
}

export default function SmartContractPayment({
  isOpen,
  onClose,
  tier,
  price,
  walletAddress,
  onConnectWallet,
  usdcBalance,
  setUsdcBalance,
  solBalance,
  setSolBalance,
  onSuccess
}: SmartContractPaymentProps) {
  const [paymentAsset, setPaymentAsset] = useState<'USDC' | 'USDT' | 'SOL' | 'ETH' | 'BTC' | 'DOGE'>('USDC');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authStep, setAuthStep] = useState<number>(0);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [copiedSignature, setCopiedSignature] = useState(false);

  // Cross-chain conversion equivalent rates (highly realistic based on current simulated market rates)
  const equivalentRates = {
    SOL: (price / 138.5).toFixed(4),
    ETH: (price / 3450).toFixed(5),
    BTC: (price / 64200).toFixed(6),
    DOGE: (price / 0.125).toFixed(1),
    LITECOIN: (price / 78.2).toFixed(3),
  };

  const steps = [
    "Checking Solana network congestion & gas pricing...",
    "Requesting transaction approval signature from browser wallet extension...",
    "Validating contract permission with begcoins@trust cross-chain resolver...",
    "Broadcasting transaction to Solana blockchain (mainnet-beta cluster)...",
    "Verifying cross-chain liquidity pool routing (USDC/USDT into destination index)...",
    "Finalizing ledger block. Minting cryptographic subscription key..."
  ];

  useEffect(() => {
    if (!isOpen) {
      setIsAuthorizing(false);
      setAuthStep(0);
      setTxSignature(null);
      setHasPermission(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySignature = () => {
    if (txSignature) {
      navigator.clipboard.writeText(txSignature);
      setCopiedSignature(true);
      setTimeout(() => setCopiedSignature(false), 2000);
    }
  };

  const executeSmartContractPayment = () => {
    if (!walletAddress) return;

    if (paymentAsset === 'USDC' || paymentAsset === 'USDT') {
      if (usdcBalance < price) {
        alert(`Insufficient ${paymentAsset} balance in connected wallet. You need at least $${price} ${paymentAsset} to complete the transaction.`);
        return;
      }
    } else if (paymentAsset === 'SOL') {
      const solRequired = parseFloat(equivalentRates.SOL);
      if (solBalance < solRequired) {
        alert(`Insufficient SOL balance in connected wallet. You need at least ${solRequired} SOL to complete the transaction.`);
        return;
      }
    }

    setIsAuthorizing(true);
    setAuthStep(0);

    const runStep = (currentStep: number) => {
      if (currentStep < steps.length) {
        setAuthStep(currentStep);
        // Vary the delays for realism
        const delay = currentStep === 1 || currentStep === 3 ? 1800 : 1200;
        setTimeout(() => runStep(currentStep + 1), delay);
      } else {
        // Complete the smart contract execution!
        const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
        const mockSig = 'sol_tx_' + Array.from({ length: 44 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        
        setTxSignature(mockSig);
        
        // Deduct balance of selected asset
        if (paymentAsset === 'USDC' || paymentAsset === 'USDT') {
          setUsdcBalance(Number((usdcBalance - price).toFixed(2)));
        } else if (paymentAsset === 'SOL') {
          const solRequired = parseFloat(equivalentRates.SOL);
          setSolBalance(Number((solBalance - solRequired).toFixed(4)));
        }
        
        setIsAuthorizing(false);
        setAuthStep(-1); // -1 marks success
        
        // Let it display the success screen, and the user can click "Done" or auto-close after 3s
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 4000);
      }
    };

    runStep(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-card border border-border w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 text-left">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/45">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-400">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono uppercase text-foreground">Smart Contract Transaction</h3>
              <p className="text-[10px] text-muted-foreground font-mono">SwarmPayRouterv4_1 (EPjF...1x8)</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            disabled={isAuthorizing && authStep >= 0}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isAuthorizing ? (
            /* ACTIVE AUTHORIZATION LOADER */
            <div className="flex flex-col items-center justify-center py-12 space-y-5">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-orange-500/10 border-t-orange-500 animate-spin flex items-center justify-center"></div>
                <Coins className="w-6 h-6 text-orange-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-2 text-center max-w-xs">
                <p className="text-xs font-mono font-bold uppercase text-foreground tracking-wider animate-pulse">
                  Step {authStep + 1} of 6
                </p>
                <p className="text-xs text-muted-foreground font-medium min-h-[40px] leading-relaxed">
                  {steps[authStep]}
                </p>
              </div>

              {/* Transaction Payload Preview */}
              <div className="w-full bg-muted/40 p-4 rounded-xl border border-border/50 text-[11px] font-mono space-y-2 max-w-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Contract Action:</span>
                  <span className="text-orange-400 font-bold">transferWithLiquiditySwap</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Source Asset:</span>
                  <span className="text-foreground font-bold">{paymentAsset} (Solana)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="text-foreground font-bold">${price.toFixed(2)} {paymentAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Smart DNS Destination:</span>
                  <span className="text-primary font-bold">begcoins@trust</span>
                </div>
              </div>
            </div>
          ) : txSignature ? (
            /* TRANSACTION COMPLETED SUCCESS SCREEN */
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1 text-center">
                <h4 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-wide">Transaction Confirmed!</h4>
                <p className="text-xs text-muted-foreground">Lions Swarm AI membership activated successfully.</p>
              </div>

              <div className="w-full bg-muted/40 p-4 rounded-xl border border-border/60 text-xs font-mono space-y-2 max-w-md">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Settled Amount:</span>
                  <span className="text-foreground font-bold">${price.toFixed(2)} {paymentAsset}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gas Paid:</span>
                  <span className="text-muted-foreground">0.000005 SOL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination Router:</span>
                  <span className="text-primary font-bold">begcoins@trust</span>
                </div>
                <Separator className="bg-border/30 my-1" />
                <div className="flex flex-col space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase">Transaction Signature</span>
                  <div className="flex items-center justify-between bg-background border border-border/40 p-2 rounded text-[10px] truncate">
                    <span className="truncate max-w-[280px] text-muted-foreground select-all">{txSignature}</span>
                    <button 
                      onClick={handleCopySignature}
                      className="text-primary hover:text-primary-foreground font-mono font-bold cursor-pointer underline text-[9px]"
                    >
                      {copiedSignature ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* PAYMENT SETUP / CONFIRMATION FORM */
            <div className="space-y-5">
              {/* Wallet Context banner */}
              {!walletAddress ? (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-3">
                  <div className="flex gap-2.5 items-start">
                    <Wallet className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-left">
                      <h4 className="text-xs font-bold font-mono text-amber-500 uppercase">Wallet Not Paired</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        You need to connect a Web3 wallet (e.g. Phantom, MetaMask) to execute this Solana smart contract transaction.
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={onConnectWallet}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs uppercase h-9 tracking-wider cursor-pointer"
                  >
                    Pair Sandbox Wallet Instantly
                  </Button>
                </div>
              ) : (
                <div className="bg-background/40 border border-border/60 p-3 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs">
                      ✓
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono block uppercase">Active Web3 Address</span>
                      <span className="text-xs font-mono font-bold text-foreground truncate max-w-[150px] inline-block">
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-6)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] text-muted-foreground font-mono block uppercase">Your Balance</span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {usdcBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })} USDC
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {solBalance.toFixed(3)} SOL
                    </span>
                  </div>
                </div>
              )}

              {/* Smart Contract Routing Details */}
              <div className="bg-muted/30 border border-border/50 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">Receiver Handle</span>
                  <Badge variant="outline" className="text-xs font-mono font-bold text-primary border-primary/20 bg-primary/5 uppercase">
                    begcoins@trust
                  </Badge>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Equivalent Cross-Chain Coin Settle Rates</span>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                    <div className="bg-background/50 border border-border/40 p-2 rounded text-center">
                      <span className="text-orange-400 block text-[9px] font-bold">DOGE</span>
                      <span className="text-foreground font-bold mt-0.5 block">{equivalentRates.DOGE}</span>
                    </div>
                    <div className="bg-background/50 border border-border/40 p-2 rounded text-center">
                      <span className="text-amber-500 block text-[9px] font-bold">SOL</span>
                      <span className="text-foreground font-bold mt-0.5 block">{equivalentRates.SOL}</span>
                    </div>
                    <div className="bg-background/50 border border-border/40 p-2 rounded text-center">
                      <span className="text-cyan-400 block text-[9px] font-bold">LTC</span>
                      <span className="text-foreground font-bold mt-0.5 block">{equivalentRates.LITECOIN}</span>
                    </div>
                    <div className="bg-background/50 border border-border/40 p-2 rounded text-center">
                      <span className="text-indigo-400 block text-[9px] font-bold">ETH</span>
                      <span className="text-foreground font-bold mt-0.5 block">{equivalentRates.ETH}</span>
                    </div>
                    <div className="bg-background/50 border border-border/40 p-2 rounded text-center col-span-2 sm:col-span-1">
                      <span className="text-yellow-500 block text-[9px] font-bold">BTC</span>
                      <span className="text-foreground font-bold mt-0.5 block">{equivalentRates.BTC}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground italic flex items-center gap-1">
                    <Info className="w-3 h-3 text-primary shrink-0" />
                    <span>The smart contract executes live pool routing swapping your Solana payment into receiver's preferred asset.</span>
                  </p>
                </div>
              </div>

              {/* Payment Asset selector */}
              <div className="space-y-2">
                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Select Payment Asset</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* USDC */}
                  <button
                    onClick={() => setPaymentAsset('USDC')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'USDC'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs">
                        $
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'USDC' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">USDC</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Stablecoin</span>
                    </div>
                  </button>

                  {/* USDT */}
                  <button
                    onClick={() => setPaymentAsset('USDT')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'USDT'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xs">
                        ₮
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'USDT' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">USDT</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">Tether</span>
                    </div>
                  </button>

                  {/* SOL */}
                  <button
                    onClick={() => setPaymentAsset('SOL')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'SOL'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-purple-500/10 flex items-center justify-center text-purple-400 font-bold text-xs">
                        ◎
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'SOL' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">SOL</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{equivalentRates.SOL} SOL</span>
                    </div>
                  </button>

                  {/* ETH */}
                  <button
                    onClick={() => setPaymentAsset('ETH')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'ETH'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-bold text-xs">
                        Ξ
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'ETH' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">ETH</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{equivalentRates.ETH} ETH</span>
                    </div>
                  </button>

                  {/* BTC */}
                  <button
                    onClick={() => setPaymentAsset('BTC')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'BTC'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-yellow-500/10 flex items-center justify-center text-yellow-500 font-bold text-xs">
                        ₿
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'BTC' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">BTC</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{equivalentRates.BTC} BTC</span>
                    </div>
                  </button>

                  {/* DOGE */}
                  <button
                    onClick={() => setPaymentAsset('DOGE')}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between h-[85px] transition-all cursor-pointer ${
                      paymentAsset === 'DOGE'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-background hover:bg-muted/10 border-border/60 text-muted-foreground'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-xs">
                        Ð
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full border ${
                        paymentAsset === 'DOGE' ? 'bg-primary border-primary' : 'border-border'
                      }`}></div>
                    </div>
                    <div className="flex flex-col mt-2">
                      <span className="text-xs font-bold font-mono leading-none">DOGE</span>
                      <span className="text-[9px] text-muted-foreground mt-0.5">{equivalentRates.DOGE} DOGE</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Authorization Permission Grant Checkbox */}
              <div className="p-3.5 bg-muted/45 rounded-xl border border-border/50 flex gap-2.5 text-left">
                <input 
                  type="checkbox" 
                  id="grant-perm" 
                  checked={hasPermission}
                  onChange={(e) => setHasPermission(e.target.checked)}
                  className="mt-0.5 rounded border-border focus:ring-primary h-4 w-4 shrink-0 text-primary cursor-pointer"
                />
                <label htmlFor="grant-perm" className="text-[11px] text-muted-foreground leading-relaxed cursor-pointer select-none">
                  I authorize <strong className="text-foreground">SwarmPayRouterv4_1</strong> smart contract to interact with my wallet and transfer <strong className="text-foreground">${price} {paymentAsset}</strong> to <strong className="text-primary font-mono font-bold">begcoins@trust</strong> index.
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        {!txSignature && !isAuthorizing && (
          <div className="p-5 border-t border-border bg-muted/35 flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="font-mono text-xs uppercase h-10 tracking-wider cursor-pointer border-border text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button 
              disabled={!walletAddress || !hasPermission}
              onClick={executeSmartContractPayment}
              className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs uppercase h-10 tracking-wider cursor-pointer"
            >
              <ShieldCheck className="w-4.5 h-4.5 mr-2 animate-pulse" />
              Approve & Pay ${price}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
