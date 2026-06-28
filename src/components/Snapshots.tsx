import React, { useState, useEffect, useRef } from 'react';
import localforage from 'localforage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

export interface SnapshotData {
  id: string;
  dataUrl: string;
  date: number;
}

interface SnapshotsProps {
  onAnalyze: (snapshot: SnapshotData) => void;
  onTriggerUpgrade?: () => void;
  userTier?: 'free' | 'basic' | 'pro' | 'ultimate';
}

export default function Snapshots({ onAnalyze, onTriggerUpgrade, userTier = 'free' }: SnapshotsProps) {
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load or set membership expiry timestamp (for realistic countdown simulation)
  const [expiry, setExpiry] = useState<number | null>(() => {
    const saved = localStorage.getItem('swarm_membership_expiry');
    if (saved) return parseInt(saved, 10);
    // Initialize to 15 days, 8 hours, 42 minutes from now
    const val = Date.now() + (15 * 24 * 60 * 60 * 1000) + (8 * 60 * 60 * 1000) + (42 * 60 * 1000);
    localStorage.setItem('swarm_membership_expiry', val.toString());
    return val;
  });

  const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    loadSnapshots();
  }, []);

  useEffect(() => {
    if (!userTier || userTier === 'free') {
      setTimeRemaining(null);
      return;
    }

    const interval = setInterval(() => {
      const savedExpiry = localStorage.getItem('swarm_membership_expiry');
      const target = savedExpiry ? parseInt(savedExpiry, 10) : expiry;
      const diff = (target || Date.now()) - Date.now();

      if (diff <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeRemaining({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userTier, expiry]);

  const loadSnapshots = async () => {
    const keys = await localforage.keys();
    const snapshotKeys = keys.filter(k => k.startsWith('snapshot_'));
    const loaded = await Promise.all(
      snapshotKeys.map(async k => {
        const item = await localforage.getItem<SnapshotData>(k);
        return item;
      })
    );
    // Sort descending by date
    loaded.sort((a, b) => b!.date - a!.date);
    setSnapshots(loaded.filter(Boolean) as SnapshotData[]);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (snapshots.length >= 100) {
      alert("You have reached the maximum of 100 saved snapshots.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      const newSnapshot: SnapshotData = {
        id: 'snapshot_' + Date.now(),
        dataUrl,
        date: Date.now()
      };
      await localforage.setItem(newSnapshot.id, newSnapshot);
      loadSnapshots();
    };
    reader.readAsDataURL(file);
    e.target.value = ''; // Reset
  };

  const deleteSnapshot = async (id: string) => {
    await localforage.removeItem(id);
    loadSnapshots();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-mono">My Snapshots</h2>
          <p className="text-muted-foreground text-sm">Save up to 100 TradingView snapshots. ({snapshots.length}/100)</p>
        </div>
        <div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <Button onClick={() => fileInputRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Upload className="w-4 h-4 mr-2" />
            Upload Snapshot
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 bg-background lg:grid-cols-3 gap-4">
        {snapshots.slice(0, 100).map((snapshot) => (
          <Card key={snapshot.id} className="bg-card border-border overflow-hidden flex flex-col">
            <div className="h-48 bg-muted/20 relative group">
              <img src={snapshot.dataUrl} alt="Chart snapshot" className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-4 flex justify-between items-center bg-card/50">
              <span className="text-xs text-muted-foreground">
                {new Date(snapshot.date).toLocaleString()}
              </span>
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => onAnalyze(snapshot)}>
                  Ask AI
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteSnapshot(snapshot.id)} className="text-destructive hover:text-destructive/90 hover:bg-destructive/10">
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {snapshots.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground border border-dashed border-border rounded-lg">
            No snapshots uploaded yet. Take a snapshot in the TradingView chart, then upload it here.
          </div>
        )}
      </div>

      {/* Membership Management & Countdown Section */}
      <div className="mt-8 border-t border-border/60 pt-6">
        <div className="bg-background/45 border border-border/80 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1.5 text-center sm:text-left">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block">Membership Status</span>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <span className={`w-2 h-2 rounded-full ${userTier === 'free' ? 'bg-muted-foreground' : 'bg-emerald-500'}`}></span>
              <span className="font-mono text-sm font-bold uppercase text-foreground">
                {userTier === 'free' ? 'Free Tier Account' : `${userTier} Plan Membership`}
              </span>
            </div>
            
            {userTier !== 'free' && timeRemaining ? (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Your premium access expires in: <strong className="text-foreground font-mono bg-muted/65 px-1.5 py-0.5 rounded ml-1">
                  {timeRemaining.days}d {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                </strong>
              </p>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Upgrade to a premium membership to unlock continuous swarm searches, strategy room, and real-time forecasts.
              </p>
            )}
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {userTier !== 'free' ? (
              <Button 
                onClick={onTriggerUpgrade}
                className="bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs uppercase h-10 px-5 tracking-wider cursor-pointer"
              >
                Renew / Extend Membership
              </Button>
            ) : (
              <Button 
                onClick={onTriggerUpgrade}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-mono text-xs uppercase h-10 px-5 tracking-wider cursor-pointer"
              >
                Upgrade to Premium
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
