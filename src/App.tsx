import { useState, useEffect } from 'react';
import { ShoppingBag, Users, Package, Activity, Terminal, Database } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState('products');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (endpoint: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/${endpoint}`);
      if (!response.ok) throw new Error('Failed to fetch data');
      const json = await response.json();
      setData(json);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'products') fetchData('products');
    if (activeTab === 'health') fetchData('health');
    if (activeTab === 'orders') fetchData('orders/user/1'); // Mock user ID 1
  }, [activeTab]);

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'health', label: 'System Health', icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-400 font-sans selection:bg-emerald-500/30">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Database className="w-5 h-5 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-white font-semibold tracking-tight">E-Commerce API</h1>
              <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Backend Control Center</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/5 p-1 rounded-lg border border-white/5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                  activeTab === tab.id 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'hover:bg-white/5 text-zinc-500'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: API Info */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
              <h2 className="text-white font-medium mb-4 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-500" />
                Endpoint Details
              </h2>
              <div className="space-y-4">
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-xs font-mono text-emerald-500 mb-1">GET /api/products</p>
                  <p className="text-xs text-zinc-500">Retrieves all products from the SQLite database.</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-xs font-mono text-emerald-500 mb-1">POST /api/orders</p>
                  <p className="text-xs text-zinc-500">Creates a new order and updates product stock levels.</p>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                  <p className="text-xs font-mono text-emerald-500 mb-1">GET /api/health</p>
                  <p className="text-xs text-zinc-500">Checks server and database connection status.</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
              <h3 className="text-emerald-400 font-medium mb-2 text-sm">Database Engine</h3>
              <p className="text-xs text-emerald-400/60 leading-relaxed">
                Currently using <span className="text-emerald-400 font-bold">SQLite</span> via better-sqlite3. 
                This provides a robust SQL interface compatible with standard relational patterns, 
                ideal for e-commerce logic like transactions and foreign keys.
              </p>
            </div>
          </div>

          {/* Right Column: Data Preview */}
          <div className="lg:col-span-2">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <h2 className="text-white font-medium capitalize">{activeTab} Response</h2>
                {loading && <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />}
              </div>
              
              <div className="p-6">
                {error ? (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                    {error}
                  </div>
                ) : (
                  <pre className="font-mono text-xs text-emerald-400/80 bg-black/40 p-6 rounded-xl overflow-auto max-h-[500px] scrollbar-thin scrollbar-thumb-white/10">
                    {JSON.stringify(data, null, 2)}
                  </pre>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
