import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Image as ImageIcon, X, Bot, User } from 'lucide-react';
import type { SnapshotData } from './Snapshots';
import { SEARCHABLE_MARKETS, MarketAsset } from '../data/markets';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  image?: string;
  isSystem?: boolean;
}

function detectSymbolInText(text: string): MarketAsset | null {
  if (!text) return null;
  const upperText = text.toUpperCase();
  for (const market of SEARCHABLE_MARKETS) {
    const ticker = market.id.toUpperCase();
    const regex = new RegExp(`\\b${ticker}\\b|\\b${market.symbol.toUpperCase()}\\b`, 'i');
    if (regex.test(upperText)) {
      return market;
    }
  }
  return null;
}

const INITIAL_MESSAGE: Message = {
  id: 'init',
  sender: 'ai',
  text: "Hello! I am The Lion Scanner AI. I can analyze TradingView snapshots using Market Cipher B, Fibonacci retracements, and FVRP. I can also evaluate any Top 300 CoinGecko token to tell you if it's a good time to BUY, SELL, LONG, or SHORT today.\n\nTo better assist you, I have a few clarifying questions about your strategy:\n1. What timeframe do you primarily trade (e.g., 5m, 1H, Daily)?\n2. What is your preferred Risk-to-Reward ratio?\n3. Do you rely on any additional confluence indicators besides Market Cipher B when taking a trade?\n4. Are you predominantly scalping, day trading, or swing trading?"
};

export default function AIChat({
  selectedSnapshot,
  onClearSnapshot, 
  onClose,
  initialPrompt,
  onClearInitialPrompt,
  onSelectSymbol,
  userTier = 'free',
  dailyChatCount = 0,
  onIncrementChatCount,
  onTriggerUpgrade,
  dailyApiCount = 0,
  maxApiRequests = 100,
  onIncrementApiCount
}: { 
  selectedSnapshot?: SnapshotData | null; 
  onClearSnapshot: () => void; 
  onClose: () => void;
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
  onSelectSymbol?: (symbol: string, label: string) => void;
  userTier?: 'free' | 'basic' | 'pro' | 'ultimate';
  dailyChatCount?: number;
  onIncrementChatCount?: () => void;
  onTriggerUpgrade?: () => void;
  dailyApiCount?: number;
  maxApiRequests?: number;
  onIncrementApiCount?: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'SAVE' | 'SAVED!'>('SAVE');
  const chatFileInputRef = useRef<HTMLInputElement>(null);

  // Maintain internal chat history (Gemini `contents` format) sent to the server on each turn.
  const chatHistoryRef = useRef<any[]>([]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (selectedSnapshot) {
      handleSend("Please analyze this chart snapshot using Market Cipher B, Fibonacci Retracement common levels, and Fixed Volume Profile (VAL, VAH, POC).", selectedSnapshot.dataUrl);
    }
  }, [selectedSnapshot]);

  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
      if (onClearInitialPrompt) {
        onClearInitialPrompt();
      }
    }
  }, [initialPrompt]);

  const handleSaveLocal = () => {
    try {
      const dataToSave = {
        messages,
        chatHistory: chatHistoryRef.current
      };
      localStorage.setItem('swarm_ai_saved_chat', JSON.stringify(dataToSave));
      setSaveStatus('SAVED!');
      setTimeout(() => setSaveStatus('SAVE'), 2000);
    } catch (error) {
      console.error('Failed to save chat:', error);
    }
  };

  const handleImportLocal = () => {
    try {
      const saved = localStorage.getItem('swarm_ai_saved_chat');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.messages && parsed.chatHistory) {
          setMessages(parsed.messages);
          chatHistoryRef.current = parsed.chatHistory;
        }
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  const handleSend = async (messageText: string = input, imageUrl?: string) => {
    const finalImage = imageUrl || localImage || selectedSnapshot?.dataUrl || undefined;
    if (!messageText.trim() && !finalImage) return;

    // Verify API limits first
    if (dailyApiCount >= maxApiRequests) {
      if (onTriggerUpgrade) {
        onTriggerUpgrade();
      }
      return;
    }

    // Verify AI chatting limits
    if (onIncrementChatCount && onTriggerUpgrade) {
      const limits = { free: 2, basic: 10, pro: 20, ultimate: 999999 };
      const maxAllowed = limits[userTier];
      if (dailyChatCount >= maxAllowed) {
        onTriggerUpgrade();
        return;
      }
      onIncrementChatCount();
    }

    // Increment API count
    if (onIncrementApiCount) {
      onIncrementApiCount();
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      image: finalImage
    };

    const userDetected = detectSymbolInText(messageText);
    if (userDetected && onSelectSymbol) {
      onSelectSymbol(userDetected.symbol, userDetected.label);
    }

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLocalImage(null);
    onClearSnapshot();
    setIsLoading(true);

    try {
      const parts: any[] = [];
      
      if (finalImage) {
        // Extract base64 part
        const base64Data = finalImage.split(',')[1];
        const mimeType = finalImage.split(';')[0].split(':')[1];
        parts.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType || "image/png"
          }
        });
        
        // Push the image analysis prompt
        parts.push({
          text: messageText + "\n\nSYSTEM INSTRUCTION: You are a professional day trader. Analyze the provided chart image specifically using ONLY Market Cipher B, Fibonacci Retracement common levels, and Fixed Range Volume Profile (FVRP: VAL, VAH, POC). State clear support and resistance based on these metrics. Base your analysis completely on the visual information and your expert knowledge. Provide a comprehensive breakdown of findings and outline the next high-probability recommended trade setup to take (including exact Entry, Stop Loss, and Take Profit targets)."
        });
      } else {
        parts.push({
          text: messageText
        });
      }

      // Add this turn to history, then send the whole conversation to the server.
      // The server holds GEMINI_API_KEY and runs the function-calling loop, so the
      // key is never exposed to the browser.
      chatHistoryRef.current.push({ role: 'user', parts });

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: chatHistoryRef.current }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || `Swarm AI request failed (${res.status})`);
      }

      const responseText = data.text || "I couldn't process that request.";

      // Persist the server-computed history (includes any tool calls + the model reply)
      if (Array.isArray(data.history)) {
        chatHistoryRef.current = data.history;
      }

      const aiDetected = detectSymbolInText(responseText);
      if (aiDetected && onSelectSymbol) {
        onSelectSymbol(aiDetected.symbol, aiDetected.label);
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: responseText
      }]);

    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: error.message ? `Swarm AI Error: ${error.message}` : "Sorry, I ran into an error communicating with the market intelligence network."
      }]);
    } finally {
      setIsLoading(false);
      onClearSnapshot();
    }
  };

  return (
    <Card className="flex flex-col h-full min-h-0 bg-background border-none shadow-none rounded-none">
      <CardHeader className="border-b border-border py-2.5 shrink-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-mono flex items-center gap-2 text-primary m-0">
          <Bot className="w-5 h-5" />
          Swarm AI
        </CardTitle>
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" onClick={handleSaveLocal} className={`h-7 text-[10px] font-mono px-2 ${saveStatus === 'SAVED!' ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' : 'text-muted-foreground'}`}>
            {saveStatus}
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportLocal} className="h-7 text-[10px] font-mono px-2 text-muted-foreground">
            IMPORT
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full ml-1">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <div className="flex-1 overflow-y-auto p-4 w-full" ref={scrollRef}>
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className={`max-w-[80%] rounded-lg p-3 text-sm whitespace-pre-wrap ${msg.sender === 'user' ? 'bg-primary/20 text-foreground border border-primary/30' : 'bg-muted text-muted-foreground border border-border'}`}>
                {msg.image && (
                  <img src={msg.image} alt="Chart Snapshot" className="max-w-full rounded mb-2 border border-border" />
                )}
                {msg.text}
                {(() => {
                  const detected = detectSymbolInText(msg.text);
                  if (detected && onSelectSymbol) {
                    return (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2.5 w-full text-[11px] font-mono h-7 border-primary/20 bg-primary/5 hover:bg-primary/20 text-primary flex items-center justify-center gap-1 cursor-pointer"
                        onClick={() => onSelectSymbol(detected.symbol, detected.label)}
                      >
                        📊 Load {detected.label} Chart
                      </Button>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-muted text-muted-foreground border border-border rounded-lg p-3 text-sm">
                <span className="animate-pulse">Analyzing market data...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <CardFooter className="p-3 border-t border-border bg-background shrink-0">
        <div className="flex w-full items-center gap-2 relative">
          {(localImage || selectedSnapshot) && (
             <div className="absolute -top-14 left-0 bg-muted border border-border rounded-md p-1.5 flex items-center gap-2 z-10 shadow">
               <ImageIcon className="w-4 h-4 text-primary animate-pulse" />
               <span className="text-xs font-mono max-w-[120px] truncate">
                 {localImage ? 'Uploaded Chart' : 'Snapshot Queued'}
               </span>
               <button 
                 onClick={() => {
                   setLocalImage(null);
                   onClearSnapshot();
                 }} 
                 className="p-0.5 hover:bg-background rounded text-destructive"
                 title="Remove queued image"
               >
                 <X className="w-3 h-3" />
               </button>
             </div>
          )}
          <input
            type="file"
            accept="image/*"
            ref={chatFileInputRef}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setLocalImage(dataUrl);
              };
              reader.readAsDataURL(file);
              e.target.value = ''; // Reset
            }}
            className="hidden"
          />
          <Button 
            type="button"
            variant="ghost" 
            size="icon" 
            onClick={() => chatFileInputRef.current?.click()} 
            className="h-9 w-9 text-muted-foreground hover:text-primary hover:bg-muted shrink-0"
            title="Upload snapshot directly"
          >
            <ImageIcon className="w-4 h-4" />
          </Button>
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask about a top 300 token or upload a chart..."
            className="flex-1 bg-background border-border"
          />
          <Button 
            onClick={() => handleSend()} 
            disabled={isLoading || (!input.trim() && !localImage && !selectedSnapshot)} 
            size="icon" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
