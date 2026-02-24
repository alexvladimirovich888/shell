import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Cpu, 
  Wallet, 
  Twitter, 
  Terminal, 
  ChevronRight, 
  Shield, 
  Zap, 
  BarChart3,
  Search,
  Settings,
  Power
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateAgentThought } from './services/gemini';
import { format } from 'date-fns';

// --- Types ---
interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'scan';
}

interface Thought {
  id: string;
  timestamp: Date;
  content: string;
}

// --- Components ---

const StatusBadge = ({ active }: { active: boolean }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-black animate-pulse' : 'bg-gray-300'}`} />
    <span className="text-[10px] uppercase tracking-widest font-semibold">
      {active ? 'Autonomous Mode Active' : 'Manual / Training Mode'}
    </span>
  </div>
);

const SectionHeader = ({ title, icon: Icon }: { title: string, icon: any }) => (
  <div className="flex items-center gap-2 mb-4 border-b border-black pb-2">
    <Icon size={14} />
    <h2 className="text-xs uppercase tracking-[0.2em] font-bold">{title}</h2>
  </div>
);

const ShellIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M12 22c-2-2-4-4-4-8a4 4 0 0 1 8 0c0 4-2 6-4 8z" />
    <path d="M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
  </svg>
);

interface TokenData {
  id: number;
  name: string;
  ticker: string;
  price: number;
  age: string;
  txns: number;
  volume: string;
  makers: number;
  change5m: number;
  change1h: number;
  change6h: number;
  change24h: number;
  liquidity: string;
  mcap: string;
  icon?: string;
}

const INITIAL_TOKENS: TokenData[] = [
  { id: 1, name: "Punch", ticker: "PUNCH", price: 0.02340, age: "19d", txns: 42658, volume: "9.1M", makers: 6699, change5m: -1.33, change1h: -16.58, change6h: -2.56, change24h: -31.75, liquidity: "674K", mcap: "23.4M", icon: "https://cdn.dexscreener.com/cms/images/91da26a8f6bb6493c28e76be1d9f1b952fc00a3ff9f20c0f20d42a85bbb166f1?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 2, name: "Autism Coin", ticker: "AUTISM", price: 0.001262, age: "15h", txns: 152090, volume: "3.0M", makers: 44588, change5m: 3.69, change1h: 19.19, change6h: 178, change24h: 3601, liquidity: "93K", mcap: "1.2M", icon: "https://cdn.dexscreener.com/cms/images/2j1F8Jkhj7eq8bak?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 3, name: "NoLimitGains", ticker: "NoLimit", price: 0.0008859, age: "1d", txns: 53718, volume: "4.5M", makers: 9005, change5m: -5.51, change1h: -0.14, change6h: 17.89, change24h: -27.76, liquidity: "87K", mcap: "885K", icon: "https://cdn.dexscreener.com/cms/images/5bwrjcsUj89JVxoA?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 4, name: "Lobstar", ticker: "Lobstar", price: 0.009431, age: "4d", txns: 47829, volume: "8.0M", makers: 6647, change5m: 2.83, change1h: 12.45, change6h: 9.60, change24h: -21.90, liquidity: "405K", mcap: "9.4M", icon: "https://cdn.dexscreener.com/cms/images/AeVl4qS8tQ58VClG?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 5, name: "CLUDE", ticker: "Clude", price: 0.001539, age: "10h", txns: 52424, volume: "4.9M", makers: 7201, change5m: 2.02, change1h: -10.98, change6h: -34.11, change24h: 4035, liquidity: "104K", mcap: "1.5M", icon: "https://cdn.dexscreener.com/cms/images/u3KkWN5ED0uAmCb2?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 6, name: "Moss Y. Gravel", ticker: "MOSS", price: 0.001235, age: "15h", txns: 81270, volume: "10.2M", makers: 8852, change5m: -5.66, change1h: -7.48, change6h: 28.91, change24h: 3141, liquidity: "102K", mcap: "1.2M", icon: "https://cdn.dexscreener.com/cms/images/_J_Pyhrq4yzoLrga?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 7, name: "Dog saved by Grok", ticker: "LIA", price: 0.0001568, age: "17h", txns: 91200, volume: "7.1M", makers: 10920, change5m: -8.34, change1h: -0.01, change6h: -9.62, change24h: 387, liquidity: "38K", mcap: "156K", icon: "https://cdn.dexscreener.com/cms/images/1gx_jMxTUd7twmcX?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 8, name: "Claw Mode", ticker: "CLAW", price: 0.0001304, age: "1d", txns: 28941, volume: "723K", makers: 19766, change5m: -5.53, change1h: -22.54, change6h: -31.54, change24h: -34.67, liquidity: "27K", mcap: "130K", icon: "https://cdn.dexscreener.com/cms/images/Q-Fjf4IKJwiiysMV?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 9, name: "Pippkin The Horse", ticker: "Pippkin", price: 0.001350, age: "5d", txns: 18877, volume: "914K", makers: 9635, change5m: -2.30, change1h: 11.36, change6h: 26.91, change24h: 267, liquidity: "95K", mcap: "1.3M", icon: "https://cdn.dexscreener.com/cms/images/VAnXFqywHy8wAFqm?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 10, name: "Grokius Maximus", ticker: "GROKIUS", price: 0.003257, age: "5d", txns: 19693, volume: "1.7M", makers: 4355, change5m: -0.84, change1h: 25.40, change6h: 70.38, change24h: 146, liquidity: "176K", mcap: "3.2M", icon: "https://cdn.dexscreener.com/cms/images/kxqL1VXzBxrotfrV?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 11, name: "Pippin", ticker: "pippin", price: 0.7688, age: "1y", txns: 64846, volume: "28.7M", makers: 1468, change5m: -0.66, change1h: 7.31, change6h: 2.94, change24h: 7.42, liquidity: "16.9M", mcap: "768.8M", icon: "https://cdn.dexscreener.com/cms/images/d237de55618e54fd7d66593ff2adf3ad8c092398f9049a31f1dcb1b23ad1dff8?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 12, name: "ONE PIECE UNIVERSE", ticker: "ONE", price: 0.004042, age: "8h", txns: 28512, volume: "8.3M", makers: 3542, change5m: -3.18, change1h: 0.53, change6h: -15.27, change24h: -25.31, liquidity: "214K", mcap: "4.0M", icon: "https://cdn.dexscreener.com/cms/images/SQayz8jGC8MXnuwA?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 13, name: "NotInEmploymentEducationTraining", ticker: "neet", price: 0.02051, age: "9mo", txns: 7364, volume: "2.3M", makers: 1278, change5m: -0.25, change1h: 0.95, change6h: 1.01, change24h: -16.12, liquidity: "1.0M", mcap: "20.5M", icon: "https://cdn.dexscreener.com/cms/images/d5d7bfff13c5cc762c020b4414e4493a8eb19d4bdcfb51957da58e9c471d43dd?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 14, name: "Scrapling", ticker: "Scrapling", price: 0.0001220, age: "1d", txns: 33173, volume: "2.5M", makers: 4745, change5m: 0.65, change1h: 14.88, change6h: 9.52, change24h: 586, liquidity: "29K", mcap: "122K", icon: "https://cdn.dexscreener.com/cms/images/eac4af8656148eb230ac19b54c134a0f02348dd4062b31019711128f1e2f4961?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 15, name: "level941", ticker: "Pigeon", price: 0.002166, age: "18d", txns: 9458, volume: "822K", makers: 1419, change5m: 0.94, change1h: -7.12, change6h: -6.84, change24h: 119, liquidity: "172K", mcap: "2.1M", icon: "https://cdn.dexscreener.com/cms/images/eac4af8656148eb230ac19b54c134a0f02348dd4062b31019711128f1e2f4961?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 16, name: "Zoe", ticker: "Zoe", price: 0.0008405, age: "8h", txns: 29333, volume: "1.5M", makers: 4539, change5m: -12.55, change1h: -18.25, change6h: -35.62, change24h: 161, liquidity: "23K", mcap: "84K", icon: "https://cdn.dexscreener.com/cms/images/oemlzJvNke7jlU4c?width=128&height=128&fit=crop&quality=95&format=auto" },
  { id: 17, name: "Xingxing", ticker: "Xingxing", price: 0.0001301, age: "2d", txns: 9033, volume: "488K", makers: 2267, change5m: -8.28, change1h: -26.03, change6h: -12.41, change24h: -61.11, liquidity: "32K", mcap: "128K", icon: "https://cdn.dexscreener.com/cms/images/P31JqbOpYb9Qvblt?width=128&height=128&fit=crop&quality=95&format=auto" },
];

export default function App() {
  const [isAutonomous, setIsAutonomous] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [tokens, setTokens] = useState<TokenData[]>(INITIAL_TOKENS);
  const [showWelcome, setShowWelcome] = useState(true);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Initial logs
  useEffect(() => {
    const initialLogs: LogEntry[] = [
      { id: '1', timestamp: new Date(), message: 'Shellagent Intelligence System v1.0.0 initialized.', type: 'info' },
      { id: '2', timestamp: new Date(), message: 'Awaiting neural network activation...', type: 'info' },
      { id: '3', timestamp: new Date(), message: 'Ready to scan Solana Mainnet.', type: 'info' },
    ];
    setLogs(initialLogs);
  }, []);

  // Auto-scroll logs (container only, no page jump)
  useEffect(() => {
    if (logContainerRef.current) {
      const container = logContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  // Simulated real-time token updates
  useEffect(() => {
    const interval = setInterval(() => {
      setTokens(prev => prev.map(token => {
        const change = (Math.random() - 0.5) * 0.01; // 1% max change
        const newPrice = token.price * (1 + change);
        return {
          ...token,
          price: newPrice,
          change5m: token.change5m + (Math.random() - 0.5) * 0.5,
          txns: token.txns + Math.floor(Math.random() * 5),
        };
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Simulated activity
  useEffect(() => {
    const interval = setInterval(() => {
      if (scanning) {
        const messages = [
          'Scanning Raydium pool: PUNCH/SOL...',
          'Analyzing whale movement in $pippin...',
          'Detecting liquidity injection in new pair: $Shellagent...',
          'Cross-referencing Twitter sentiment for $AUTISM...',
          'Calculating risk parameters for sideways market...',
          'Learning from $Lobstar transaction patterns...',
        ];
        const randomMsg = messages[Math.floor(Math.random() * messages.length)];
        addLog(randomMsg, 'scan');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [scanning]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, { id: Math.random().toString(), timestamp: new Date(), message, type }].slice(-50));
  };

  const connectPhantom = async () => {
    try {
      const { solana } = window as any;
      if (solana?.isPhantom) {
        const response = await solana.connect();
        setWalletAddress(response.publicKey.toString());
        addLog(`Phantom wallet connected: ${response.publicKey.toString().slice(0, 8)}...`, 'success');
      } else {
        addLog('Phantom wallet not found. Please install the extension.', 'error');
        window.open('https://phantom.app/', '_blank');
      }
    } catch (error) {
      console.error(error);
      addLog('Connection to Phantom failed.', 'error');
    }
  };

  return (
    <div className="h-screen bg-black text-accent selection:bg-accent selection:text-black overflow-hidden flex flex-col">
      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="max-w-2xl w-full border-2 border-accent p-8 bg-black relative overflow-hidden"
            >
              <div className="scan-line opacity-30" />
              <div className="flex flex-col items-center text-center space-y-6">
                <img 
                  src="https://i.postimg.cc/Kz33B6Bd/photo-2026-02-24-16-45-06.jpg" 
                  alt="Shellagent Logo" 
                  className="w-24 h-24 object-contain glow-accent mb-2"
                  referrerPolicy="no-referrer"
                />
                <h2 className="text-3xl font-bold tracking-tighter uppercase glow-accent">Welcome to Shellagent</h2>
                <div className="space-y-4 text-sm leading-relaxed text-accent/80 font-mono">
                  <p>
                    Shellagent is an autonomous AI intelligence protocol designed to scan, analyze, and learn from the Solana meme coin ecosystem in real-time.
                  </p>
                  <p>
                    <span className="text-accent font-bold uppercase tracking-widest">What's special:</span> It utilizes advanced neural networks to detect liquidity anomalies, whale movements, and social sentiment before they hit the mainstream.
                  </p>
                  <p>
                    <span className="text-accent font-bold uppercase tracking-widest">What it gives you:</span> Unparalleled market insights, automated risk assessment, and a glimpse into the future of autonomous capital management.
                  </p>
                </div>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowWelcome(false)}
                    className="flex-1 px-8 py-4 border-2 border-accent text-black bg-accent font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-accent transition-all duration-300"
                  >
                    Enter Protocol
                  </button>
                  <a 
                    href="https://x.com/shellagents" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-6 py-4 border-2 border-accent text-accent bg-black font-bold uppercase tracking-[0.2em] hover:bg-accent hover:text-black transition-all duration-300 flex items-center justify-center"
                  >
                    <Twitter size={20} />
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Background */}
      <div className="fixed inset-0 grid-lines opacity-20 pointer-events-none" />

      {/* Top Navigation */}
      <header className="relative z-20 max-w-[1600px] w-full mx-auto px-6 py-4 flex justify-between items-center border-b border-accent/10 bg-black/50 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-2">
          <img 
            src="https://i.postimg.cc/Kz33B6Bd/photo-2026-02-24-16-45-06.jpg" 
            alt="Shellagent Logo" 
            className="w-8 h-8 object-contain glow-accent"
            referrerPolicy="no-referrer"
          />
          <span className="text-sm font-bold tracking-widest uppercase glow-accent">Shellagent</span>
        </div>
        <nav className="flex gap-8">
          <a href="#" className="text-[10px] uppercase tracking-widest font-bold hover:glow-accent transition-all">Documentation</a>
          <a href="https://x.com/shellagents" target="_blank" rel="noopener noreferrer" className="text-[10px] uppercase tracking-widest font-bold hover:glow-accent transition-all">X / Twitter</a>
          <a href="#" className="text-[10px] uppercase tracking-widest font-bold hover:glow-accent transition-all">Solana Explorer</a>
        </nav>
      </header>

      {/* Main Layout */}
      <div className="relative z-10 max-w-[1600px] w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        
        {/* Left Column: Identity & Status */}
        <div className="lg:col-span-3 space-y-8 flex flex-col min-h-0">
          <div className="border-2 border-accent p-6 bg-black/80 backdrop-blur-sm shrink-0">
            <div className="mb-6 flex flex-col items-center text-center">
              <div className="w-24 h-24 border-2 border-accent flex items-center justify-center mb-4 overflow-hidden">
                <img 
                  src="https://i.postimg.cc/Kz33B6Bd/photo-2026-02-24-16-45-06.jpg" 
                  alt="Shellagent Logo" 
                  className="w-20 h-20 object-contain glow-accent"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h1 className="text-2xl font-bold tracking-tighter uppercase leading-none mb-1 glow-accent">SHELLAGENT</h1>
              <p className="text-[10px] text-accent/60 uppercase tracking-widest font-mono">Autonomous Intelligence Unit</p>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-end border-b border-accent/20 pb-2">
                <span className="text-[10px] uppercase tracking-wider text-accent/40">Status</span>
                <StatusBadge active={isAutonomous} />
              </div>
              <div className="flex justify-between items-end border-b border-accent/20 pb-2">
                <span className="text-[10px] uppercase tracking-wider text-accent/40">Uptime</span>
                <span className="text-xs font-mono">142:24:09</span>
              </div>
              <div className="flex justify-between items-end border-b border-accent/20 pb-2">
                <span className="text-[10px] uppercase tracking-wider text-accent/40">Network</span>
                <span className="text-xs font-mono">Solana Mainnet</span>
              </div>
            </div>

            <button 
              onClick={() => setIsAutonomous(!isAutonomous)}
              className={`w-full mt-8 py-3 flex items-center justify-center gap-2 border-2 border-accent transition-all duration-300 ${isAutonomous ? 'bg-accent text-black' : 'bg-black text-accent hover:bg-accent/10'}`}
            >
              <Power size={16} />
              <span className="text-xs uppercase tracking-widest font-bold">
                {isAutonomous ? 'Deactivate Auto' : 'Activate Auto'}
              </span>
            </button>
          </div>

          <div className="border border-accent p-4 space-y-4 bg-black/80 backdrop-blur-sm shrink-0">
            <SectionHeader title="Phantom Wallet" icon={Wallet} />
            <div className="space-y-4">
              {walletAddress ? (
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-accent/40 mb-1">Connected Address</div>
                  <div className="text-xs font-mono tracking-tighter break-all text-accent">{walletAddress}</div>
                </div>
              ) : (
                <button 
                  onClick={connectPhantom}
                  className="w-full py-2 border border-accent/50 text-[10px] uppercase tracking-widest font-bold hover:bg-accent hover:text-black transition-all"
                >
                  Connect Phantom
                </button>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="border border-accent/20 p-2 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-accent/40">Daily PnL</div>
                  <div className="text-xs font-mono text-accent">+0.00%</div>
                </div>
                <div className="border border-accent/20 p-2 text-center">
                  <div className="text-[9px] uppercase tracking-widest text-accent/40">Status</div>
                  <div className="text-xs font-mono uppercase">Ready</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column: Scanner & Logs */}
        <div className="lg:col-span-9 flex flex-col min-h-0 gap-8">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 flex-1 min-h-0">
            {/* Main Token Table - Compressed & Scrollable */}
            <div className="xl:col-span-2 border-2 border-accent p-6 bg-black/80 backdrop-blur-sm relative overflow-hidden flex flex-col min-h-0">
              <SectionHeader title="Market Scanner" icon={Search} />
              <div className="scan-line" />
              
              <div className="flex-1 overflow-y-auto mt-4 scrollbar-hide">
                <table className="w-full text-left font-mono text-[11px] border-collapse">
                  <thead className="sticky top-0 bg-black z-10">
                    <tr className="border-b border-accent/20 text-accent/40 uppercase tracking-wider">
                      <th className="py-3 px-2">#</th>
                      <th className="py-3 px-2">Token</th>
                      <th className="py-3 px-2">Price</th>
                      <th className="py-3 px-2">Volume</th>
                      <th className="py-3 px-2">MCAP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tokens.map((token, index) => (
                      <tr key={token.id} className="border-b border-accent/10 hover:bg-accent/5 transition-colors group">
                        <td className="py-3 px-2 text-accent/40">{index + 1}</td>
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            {token.icon && (
                              <img 
                                src={token.icon} 
                                alt={token.name} 
                                className="w-4 h-4 rounded-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-accent group-hover:glow-accent">{token.name}</span>
                              <span className="text-[9px] text-accent/40">{token.ticker}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2">${token.price.toFixed(token.price < 0.001 ? 8 : 4)}</td>
                        <td className="py-3 px-2">${token.volume}</td>
                        <td className="py-3 px-2">${token.mcap}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Activity Log - Scrollable */}
            <div className="border border-accent bg-black p-4 flex flex-col min-h-0">
              <div className="flex items-center gap-2 mb-4 border-b border-accent/20 pb-2">
                <Terminal size={14} />
                <h2 className="text-xs uppercase tracking-[0.2em] font-bold">System Log</h2>
              </div>
              <div 
                ref={logContainerRef}
                className="flex-1 overflow-y-auto font-mono text-[10px] space-y-1 scrollbar-hide"
              >
                {logs.map((log) => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-accent/30">[{format(log.timestamp, 'HH:mm:ss')}]</span>
                    <span className={
                      log.type === 'success' ? 'text-accent glow-accent' :
                      log.type === 'error' ? 'text-red-400' :
                      log.type === 'warning' ? 'text-amber-400' :
                      log.type === 'scan' ? 'text-accent/50' :
                      'text-accent'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Roadmap - Horizontal Section at Bottom */}
          <div className="shrink-0 pt-4 border-t border-accent/10">
            <SectionHeader title="Protocol Roadmap" icon={ChevronRight} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
              <div className="relative pl-6 border-l border-accent">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent glow-accent" />
                <div className="text-[10px] font-bold uppercase mb-1 flex items-center gap-2">
                  Phase 01: Observation
                  <span className="px-2 py-0.5 bg-accent text-black text-[8px] uppercase font-bold">Active</span>
                </div>
                <p className="text-[11px] text-accent/50 leading-tight">Neural training on Solana transaction history. Pattern recognition optimization and liquidity mapping.</p>
              </div>
              <div className="relative pl-6 border-l border-accent/20">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/20" />
                <div className="text-[10px] font-bold uppercase mb-1 text-accent/40">Phase 02: Simulation</div>
                <p className="text-[11px] text-accent/30 leading-tight">Paper trading with real-time data. Sentiment analysis integration and whale cluster identification.</p>
              </div>
              <div className="relative pl-6 border-l border-accent/20">
                <div className="absolute -left-[5px] top-0 w-2 h-2 rounded-full bg-accent/20" />
                <div className="text-[10px] font-bold uppercase mb-1 text-accent/40">Phase 03: Autonomy</div>
                <p className="text-[11px] text-accent/30 leading-tight">Live execution on Solana DEXs. Fully autonomous capital management and cross-chain expansion.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="max-w-[1600px] w-full mx-auto px-6 py-4 border-t border-accent/10 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold uppercase tracking-widest glow-accent">Shellagent © 2026</div>
          <div className="w-1 h-1 bg-accent/30 rounded-full" />
          <div className="text-[10px] text-accent/40 font-mono">v1.0.0-stable</div>
        </div>
        <div className="text-[10px] text-accent/40 uppercase tracking-widest">
          Autonomous Intelligence Protocol
        </div>
      </footer>
    </div>
  );
}
