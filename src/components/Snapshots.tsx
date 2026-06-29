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

  useEffect(() => {
    loadSnapshots();
  }, []);

  const getLimitLabel = () => {
    if (userTier === 'free') return '3 per week';
    if (userTier === 'basic') return '10 per month';
    if (userTier === 'pro') return '20 per month';
    return '100 per month';
  };

  const getLimitValue = () => {
    if (userTier === 'free') return 3;
    if (userTier === 'basic') return 10;
    if (userTier === 'pro') return 20;
    return 100;
  };

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

    const limit = getLimitValue();
    if (snapshots.length >= limit) {
      alert(`You have reached the maximum of ${limit} saved snapshots for your ${userTier.toUpperCase()} tier. Please upgrade or delete existing snapshots.`);
      onTriggerUpgrade?.();
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
          <p className="text-muted-foreground text-sm">Save up to {getLimitLabel()} snapshots. ({snapshots.length}/{getLimitValue()})</p>
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
    </div>
  );
}
