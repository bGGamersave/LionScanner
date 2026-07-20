import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Coins,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Info,
  X,
  Loader2,
  Copy,
  ExternalLink,
  AlertCircle,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

type ProductId = 'basic' | 'pro' | 'ultimate' | 'token_50' | 'token_200' | 'token_500';

interface EntitlementResult {
  entitlement: any;
  claimToken: string;
  email: string;
}

interface SmartContractPaymentProps {
  isOpen: boolean;
  onClose: () => void;
  productId: ProductId;
  price: number;
  packName: string;
  defaultEmail?: string | null;
  onSuccess: (result: EntitlementResult) => void;
}

type Stage = 'form' | 'awaiting' | 'success' | 'error';

interface CreatedPayment {
  reference: string;
  url: string;
  amountUsd: number;
  recipient: string;
  productName: string;
}

export default function SmartContractPayment({
  isOpen,
  onClose,
  productId,
  price,
  packName,
  defaultEmail,
  onSuccess,
}: SmartContractPaymentProps) {
  const [stage, setStage] = useState<Stage>('form');
  const [email, setEmail] = useState(defaultEmail || '');
  const [payment, setPayment] = useState<CreatedPayment | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Reset everything when the modal is closed.
  useEffect(() => {
    if (!isOpen) {
      stopPolling();
      setStage('form');
      setPayment(null);
      setErrorMessage('');
      setIsCreating(false);
      setEmail(defaultEmail || '');
    }
  }, [isOpen, defaultEmail]);

  // Clean up the poller on unmount.
  useEffect(() => () => stopPolling(), []);

  if (!isOpen) return null;

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const createPayment = async () => {
    if (!emailValid) {
      setErrorMessage('Enter a valid email so we can attach your subscription to it.');
      return;
    }
    setIsCreating(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/payments/solana/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, email: email.trim().toLowerCase() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStage('error');
        setErrorMessage(data.error || 'Could not start the payment. Please try again.');
        return;
      }
      setPayment(data);
      setStage('awaiting');
      startPolling(data.reference);
    } catch {
      setStage('error');
      setErrorMessage('Could not reach the payment server. Check your connection and try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const startPolling = (reference: string) => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/payments/solana/verify?reference=${encodeURIComponent(reference)}`);
        const data = await res.json().catch(() => ({}));
        if (data.status === 'confirmed') {
          stopPolling();
          setStage('success');
          onSuccess({
            entitlement: data.entitlement,
            claimToken: data.claimToken,
            email: email.trim().toLowerCase(),
          });
        }
      } catch {
        /* keep polling; transient network errors are expected */
      }
    }, 3000);
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
              <h3 className="text-sm font-bold font-mono uppercase text-foreground">Solana Pay Checkout</h3>
              <p className="text-[10px] text-muted-foreground font-mono">USDC on Solana · on-chain settlement</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Product summary (always visible) */}
          <div className="bg-muted/30 border border-border/50 p-4 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">Product</span>
              <span className="text-sm font-bold text-foreground">{packName}</span>
            </div>
            <Badge variant="outline" className="text-sm font-mono font-bold text-primary border-primary/20 bg-primary/5">
              ${price.toFixed(2)} USDC
            </Badge>
          </div>

          {stage === 'form' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block">
                  Email for your subscription
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-orange-500/70" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (errorMessage) setErrorMessage(''); }}
                    placeholder="you@email.com"
                    className="w-full pl-9 h-11 bg-background border border-border rounded-lg text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3 text-primary shrink-0" />
                  <span>Your access is tied to this email. Use it to restore your plan on any device.</span>
                </p>
              </div>

              {errorMessage && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {errorMessage}
                </div>
              )}
            </div>
          )}

          {stage === 'awaiting' && payment && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="bg-white p-3 rounded-xl">
                  <QRCodeSVG value={payment.url} size={200} level="M" includeMargin={false} />
                </div>
                <p className="text-xs text-muted-foreground text-center max-w-xs">
                  Scan with any Solana Pay wallet (Phantom, Solflare, …), or open it on this device.
                </p>
                <a
                  href={payment.url}
                  className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open in wallet
                </a>
              </div>

              <div className="bg-muted/40 p-4 rounded-xl border border-border/50 text-[11px] font-mono space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="text-foreground font-bold">${payment.amountUsd.toFixed(2)} USDC</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-muted-foreground shrink-0">Recipient</span>
                  <button
                    onClick={() => handleCopy(payment.recipient)}
                    className="flex items-center gap-1 text-foreground truncate hover:text-primary cursor-pointer"
                    title="Copy recipient address"
                  >
                    <span className="truncate max-w-[220px]">{payment.recipient}</span>
                    <Copy className="w-3 h-3 shrink-0" />
                  </button>
                </div>
                {copied && <p className="text-[10px] text-emerald-400 text-right">Copied</p>}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Waiting for on-chain confirmation… this can take a few seconds after you pay.</span>
              </div>
            </div>
          )}

          {stage === 'success' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="text-center space-y-1">
                <h4 className="text-sm font-bold font-mono text-emerald-400 uppercase tracking-wide">Payment Confirmed</h4>
                <p className="text-xs text-muted-foreground">{packName} is now active on <strong className="text-foreground">{email}</strong>.</p>
              </div>
              <Separator className="bg-border/30" />
              <p className="text-[11px] text-muted-foreground text-center max-w-xs">
                Keep using Lion Scanner here. On another device, choose “Restore purchase” and verify this email to unlock your plan.
              </p>
            </div>
          )}

          {stage === 'error' && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                <AlertCircle className="w-7 h-7" />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-xs">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border bg-muted/35 flex justify-between gap-3">
          {stage === 'success' ? (
            <Button
              onClick={onClose}
              className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs uppercase h-10 tracking-wider cursor-pointer"
            >
              Done
            </Button>
          ) : stage === 'awaiting' ? (
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 font-mono text-xs uppercase h-10 tracking-wider cursor-pointer border-border text-muted-foreground hover:text-foreground"
            >
              Cancel — I'll pay later
            </Button>
          ) : stage === 'error' ? (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="font-mono text-xs uppercase h-10 tracking-wider cursor-pointer border-border text-muted-foreground hover:text-foreground"
              >
                Close
              </Button>
              <Button
                onClick={() => { setStage('form'); setErrorMessage(''); }}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs uppercase h-10 tracking-wider cursor-pointer"
              >
                Try Again
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={onClose}
                className="font-mono text-xs uppercase h-10 tracking-wider cursor-pointer border-border text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
              <Button
                disabled={!emailValid || isCreating}
                onClick={createPayment}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-mono text-xs uppercase h-10 tracking-wider cursor-pointer"
              >
                {isCreating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating…</>
                ) : (
                  <><ShieldCheck className="w-4.5 h-4.5 mr-2" /> Pay ${price} with Solana</>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
