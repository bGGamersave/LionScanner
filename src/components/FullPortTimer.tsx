import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Bell, Check, Loader2, Sparkles, AlertCircle, X, Mail } from 'lucide-react';

interface TimeRemaining {
  days: string;
  hours: string;
  minutes: string;
  seconds: string;
  totalMs: number;
}

export default function FullPortTimer() {
  const [targetDate] = useState(() => new Date('2026-10-01T00:00:00'));
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>({
    days: '000',
    hours: '00',
    minutes: '00',
    seconds: '00',
    totalMs: 0,
  });

  const [email, setEmail] = useState('');
  const [subscribedEmails, setSubscribedEmails] = useState<string[]>(() => {
    const saved = localStorage.getItem('swarm_weekly_reminders');
    return saved ? JSON.parse(saved) : [];
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const uAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobileUA = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(uAgent.toLowerCase());
      const isSmallScreen = window.innerWidth < 768;
      setIsMobile(isMobileUA || isSmallScreen);
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Calculate remaining time
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const difference = targetDate.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: '000',
          hours: '00',
          minutes: '00',
          seconds: '00',
          totalMs: 0,
        });
        return;
      }

      const daysVal = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hoursVal = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutesVal = Math.floor((difference / 1000 / 60) % 60);
      const secondsVal = Math.floor((difference / 1000) % 60);

      setTimeLeft({
        days: String(daysVal).padStart(3, '0'),
        hours: String(hoursVal).padStart(2, '0'),
        minutes: String(minutesVal).padStart(2, '0'),
        seconds: String(secondsVal).padStart(2, '0'),
        totalMs: difference,
      });
    };

    calculateTime();
    const intervalId = setInterval(calculateTime, 1000);

    return () => clearInterval(intervalId);
  }, [targetDate]);

  // Handle reminder subscription
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus('error');
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setPreviewUrl(null);

    // Make API request to send welcome email and register subscription
    fetch('/api/subscribe-clock', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.toLowerCase() }),
    })
    .then(async (response) => {
      const isReplacement = subscribedEmails.length > 0 && !subscribedEmails.includes(email.toLowerCase());
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        const updated = [email.toLowerCase()]; // Keep at most 1 email address
        setSubscribedEmails(updated);
        localStorage.setItem('swarm_weekly_reminders', JSON.stringify(updated));
        setStatus('success');
        setErrorMessage(isReplacement ? 'Your active subscription email has been updated. A welcome confirmation has been sent!' : 'A welcome confirmation email has been sent!');
        if (data.previewUrl) {
          setPreviewUrl(data.previewUrl);
        }
      } else {
        // Do not claim success: the welcome email genuinely was not sent.
        setStatus('error');
        setErrorMessage(data.error || 'Failed to send the welcome email. Please try again.');
      }
      setEmail('');
    })
    .catch((error) => {
      console.error("Subscription API error:", error);
      setStatus('error');
      setErrorMessage('Could not reach the server. Please check your connection and try again.');
    });
  };

  const handleUnsubscribe = (emailToRem: string) => {
    const updated = subscribedEmails.filter(e => e !== emailToRem);
    setSubscribedEmails(updated);
    localStorage.setItem('swarm_weekly_reminders', JSON.stringify(updated));
  };

  return (
    <Card id="full-port-countdown-card" className="bg-card border border-border/80 backdrop-blur rounded-xl p-6 shadow-sm w-full flex flex-col items-center justify-center text-center relative overflow-hidden">
      {/* Visual Ambient Glow Accent to ground the design */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      <CardHeader className="p-0 pb-4 max-w-xl flex flex-col items-center justify-center text-center mx-auto w-full">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-mono uppercase font-bold tracking-widest mb-3 justify-center">
          <Bell className="w-3.5 h-3.5 animate-bounce" />
          Bear Market Bottom Countdown Clock
        </div>
        <CardTitle 
          className="font-bold font-mono text-foreground uppercase tracking-wider leading-tight text-center mx-auto text-lg sm:text-2xl md:text-3xl lg:text-[34px]"
          style={{
            maxWidth: '100%',
            lineHeight: '1.2'
          }}
        >
          The exact time until we go full port back into crypto
        </CardTitle>
        <CardDescription className="text-[10px] sm:text-xs text-muted-foreground/80 font-sans mt-1 text-center mx-auto">
          Target Execution Block Date: <span className="font-mono font-semibold text-foreground/90">October 1, 2026 (00:00:00 Local)</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="w-full p-0 flex flex-col items-center">
        {/* Digital Clock Display - SPREAD OUT AND GLOWING */}
        <div className="flex items-center justify-center gap-1 sm:gap-4 md:gap-8 lg:gap-12 my-4 sm:my-8 py-2 sm:py-4 w-full select-none overflow-x-auto px-1 sm:px-2">
          {/* Days */}
          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-2">
              {timeLeft.days.split('').map((char, idx) => (
                <div 
                  key={`day-${idx}`} 
                  className="w-7 h-11 sm:w-16 sm:h-22 bg-background border border-border/80 rounded-lg sm:rounded-xl flex items-center justify-center font-mono text-lg sm:text-5xl font-black text-orange-500 shadow-inner shadow-black/60 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)] hover:scale-105 transition-transform duration-200"
                >
                  {char}
                </div>
              ))}
            </div>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.25em] text-orange-500/80 uppercase mt-2 sm:mt-3.5 font-black">Days</span>
          </div>

          <div className="text-orange-500/70 text-base sm:text-4xl font-black font-mono self-center mb-3 sm:mb-8 animate-pulse shadow-orange-500/30 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">:</div>

          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-2">
              {timeLeft.hours.split('').map((char, idx) => (
                <div 
                  key={`hour-${idx}`} 
                  className="w-7 h-11 sm:w-16 sm:h-22 bg-background border border-border/80 rounded-lg sm:rounded-xl flex items-center justify-center font-mono text-lg sm:text-5xl font-black text-orange-500 shadow-inner shadow-black/60 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)] hover:scale-105 transition-transform duration-200"
                >
                  {char}
                </div>
              ))}
            </div>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.25em] text-orange-500/80 uppercase mt-2 sm:mt-3.5 font-black">Hours</span>
          </div>

          <div className="text-orange-500/70 text-base sm:text-4xl font-black font-mono self-center mb-3 sm:mb-8 animate-pulse shadow-orange-500/30 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">:</div>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-2">
              {timeLeft.minutes.split('').map((char, idx) => (
                <div 
                  key={`min-${idx}`} 
                  className="w-7 h-11 sm:w-16 sm:h-22 bg-background border border-border/80 rounded-lg sm:rounded-xl flex items-center justify-center font-mono text-lg sm:text-5xl font-black text-orange-500 shadow-inner shadow-black/60 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)] hover:scale-105 transition-transform duration-200"
                >
                  {char}
                </div>
              ))}
            </div>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.25em] text-orange-500/80 uppercase mt-2 sm:mt-3.5 font-black">Minutes</span>
          </div>

          <div className="text-orange-500/70 text-base sm:text-4xl font-black font-mono self-center mb-3 sm:mb-8 animate-pulse shadow-orange-500/30 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]">:</div>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="flex gap-1 sm:gap-2">
              {timeLeft.seconds.split('').map((char, idx) => (
                <div 
                  key={`sec-${idx}`} 
                  className="w-7 h-11 sm:w-16 sm:h-22 bg-background border border-border/80 rounded-lg sm:rounded-xl flex items-center justify-center font-mono text-lg sm:text-5xl font-black text-orange-500 shadow-inner shadow-black/60 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)] hover:scale-105 transition-transform duration-200"
                >
                  {char}
                </div>
              ))}
            </div>
            <span className="text-[8px] sm:text-[10px] font-mono tracking-[0.25em] text-orange-500/80 uppercase mt-2 sm:mt-3.5 font-black">Seconds</span>
          </div>
        </div>

        {/* Weekly reminder subscription form - MORE SPACIOUS & STYLISH */}
        <div className="w-full max-w-xl mt-8 border-t border-border/40 pt-8 px-4 sm:px-6">
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 font-sans max-w-md mx-auto leading-relaxed">
            Add your email address to receive a weekly reminder to hold your dollars until this date.
          </p>

          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-3.5 h-5 w-5 text-orange-500/70" />
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status === 'error') setStatus('idle');
                }}
                placeholder="Enter your email address to receive alerts..."
                className="pl-12 h-12 bg-black/60 border-orange-500/30 focus-visible:ring-1 focus-visible:ring-orange-500/50 text-orange-100 placeholder:text-slate-500 font-mono text-sm shadow-inner rounded-xl transition-all"
              />
            </div>
            <Button 
              type="submit" 
              disabled={status === 'loading' || !email}
              className="h-12 px-8 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-black font-black font-mono tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] rounded-xl shrink-0 cursor-pointer"
            >
              {status === 'loading' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Securing...
                </>
              ) : (
                <>
                  REMIND ME <Sparkles className="w-4 h-4 ml-2 text-black/80" />
                </>
              )}
            </Button>
          </form>

          {/* Toast / Status States */}
          {status === 'success' && (
            <div className="mt-4 flex flex-col items-start gap-2 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs text-left">
              <div className="flex items-center gap-3">
                <Check className="w-5 h-5 shrink-0" />
                <div>
                  <span className="font-bold block mb-0.5">
                    {errorMessage ? 'Subscription Updated!' : 'Subscription Confirmed!'}
                  </span> 
                  {errorMessage || 'You will receive weekly reminders on your email to hold your dollars until October 1, 2026.'}
                  <span className="block mt-1 text-[10px] text-emerald-500/80 italic font-mono">Limit: 1 email address per account</span>
                </div>
              </div>
              {previewUrl && (
                <div className="mt-2 w-full pt-2 border-t border-emerald-500/20">
                  <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-mono text-[10px] uppercase text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4">
                    <Sparkles className="w-3 h-3" /> View test email generated for you
                  </a>
                </div>
              )}
            </div>
          )}

          {status === 'error' && (
            <div className="mt-4 flex items-center gap-3 p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-left">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <div>
                <span className="font-bold block mb-0.5">Execution Error:</span> {errorMessage}
              </div>
            </div>
          )}

          {/* Subscribed Reminders Ledger - BEAUTIFIED */}
          {subscribedEmails.length > 0 && (
            <div className="mt-8 text-left bg-muted/20 border border-border/50 rounded-xl p-4 sm:p-5">
              <div className="flex items-center justify-between border-b border-border/30 pb-3 mb-3">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  Active Reminders ({subscribedEmails.length})
                </span>
              </div>
              <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto">
                {subscribedEmails.map((subEmail) => (
                  <div 
                    key={subEmail} 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-border text-[11px] font-mono text-muted-foreground hover:border-orange-500/30 hover:text-foreground transition-all duration-200"
                  >
                    <span>{subEmail}</span>
                    <button 
                      type="button" 
                      onClick={() => handleUnsubscribe(subEmail)}
                      className="text-muted-foreground hover:text-red-500 transition-colors ml-1 p-0.5 cursor-pointer rounded"
                      title="Remove reminder"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
