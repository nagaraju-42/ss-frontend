import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Calendar, Download, IndianRupee, RefreshCw, ShoppingBag, TrendingUp, Trash2, Sparkles } from 'lucide-react';
import { api } from '../api';

const PAID = ['PAID_CASH','PAID_ONLINE'];

function StatCard({ icon, label, value, accent, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className="stat-card text-left w-full"
      style={active ? {borderColor: accent, background:`rgba(${accent},0.05)`} : {}}
    >
      <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-3" style={{background:`${accent}22`}}>
        {icon}
      </div>
      <p className="text-sm font-black uppercase tracking-wide mb-1" style={{color:'#6b7280'}}>{label}</p>
      <p className="text-3xl font-black" style={{color:'#f9fafb'}}>{value}</p>
    </button>
  );
}

const PAYMENT_BADGE = {
  PAID_CASH:   'badge-green', PAID_ONLINE: 'badge-green',
  PENDING_CASH:'badge-amber', PENDING_ONLINE:'badge-blue',
  FAILED:      'badge-red',
};
const ORDER_BADGE = {
  PLACED:'badge-blue', PACKING:'badge-amber', READY:'badge-green', HANDED_OVER:'badge-purple', CANCELLED:'badge-red',
};

export default function OwnerView() {
  const [orders, setOrders]         = useState([]);
  const [showFailed, setShowFailed] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [date, setDate]             = useState(new Date().toISOString().split('T')[0]);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/orders/history?date=${date}`);
      setOrders(res.data);
    } finally { setLoading(false); }
  }, [date]);

  useEffect(() => {
    fetch();
    const isToday = date === new Date().toISOString().split('T')[0];
    if (!isToday) return;
    const id = setInterval(fetch, 15000);
    return () => clearInterval(id);
  }, [date, fetch]);

  const revenue   = orders.filter(o => PAID.includes(o.paymentStatus)).reduce((s,o) => s+o.totalAmount, 0);
  const paid      = orders.filter(o => PAID.includes(o.paymentStatus));
  const failed    = orders.filter(o => o.paymentStatus === 'FAILED' || o.orderStatus === 'CANCELLED');
  const display   = showFailed
    ? failed
    : orders.filter(o => o.paymentStatus !== 'FAILED' && o.orderStatus !== 'CANCELLED');

  const avgOrder  = paid.length ? revenue / paid.length : 0;

  const exportCsv = () => {
    const hdr = ['Token','Customer','Time','Amount','Payment','Status','Items'];
    const rows = display.map(o => [
      o.tokenNumber, o.customerName,
      new Date(o.createdAt).toLocaleTimeString('en-IN'),
      o.totalAmount, o.paymentStatus, o.orderStatus, o.itemsSummary||''
    ]);
    const csv = [hdr,...rows].map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
    a.download = `Softy Bakeries_${date}.csv`; a.click();
  };

  const clearOrders = async () => {
    if (!window.confirm('Delete all demo orders? Products stay.')) return;
    await api.delete('/api/orders/clear-test');
    fetch();
  };

  return (
    <main className="min-h-screen p-4" style={{background:'#0a0f1a'}}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 animate-fadeInUp">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
            <h1 className="text-2xl font-black" style={{color:'#f9fafb'}}>Owner Dashboard</h1>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af',cursor:'pointer'}}>
              <Calendar size={14} style={{color:'#f59e0b'}} />
              <input
                type="date"
                value={date}
                max={new Date().toISOString().split('T')[0]}
                onChange={e => setDate(e.target.value)}
                className="bg-transparent outline-none text-sm font-bold"
                style={{color:'#f9fafb'}}
                id="analytics-date"
              />
            </label>
            <button onClick={fetch} className="p-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af'}} id="refresh-analytics-btn">
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={exportCsv} className="btn btn-green px-4 py-2.5 text-sm" id="export-csv-btn">
              <Download size={14} /> Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6 animate-fadeInUp delay-1">
          <StatCard
            icon={<IndianRupee size={20} color="#10b981" />}
            label="Revenue"
            value={`₹${revenue.toFixed(0)}`}
            accent="#10b981"
          />
          <StatCard
            icon={<TrendingUp size={20} color="#3b82f6" />}
            label="Paid Orders"
            value={paid.length}
            accent="#3b82f6"
          />
          <StatCard
            icon={<ShoppingBag size={20} color="#f59e0b" />}
            label="Avg Order"
            value={`₹${avgOrder.toFixed(0)}`}
            accent="#f59e0b"
          />
          <StatCard
            icon={<AlertTriangle size={20} color="#ef4444" />}
            label={showFailed ? 'Showing Failed' : 'Failed/Cancelled'}
            value={failed.length}
            accent="#ef4444"
            onClick={() => setShowFailed(v => !v)}
            active={showFailed}
          />
        </div>

        {/* 18. Predictive AI Demand Forecasting & 9. Kitchen Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 animate-fadeInUp delay-2">
          {/* AI Demand Forecast Widget */}
          <div className="glass-card p-4 flex flex-col justify-between" style={{background:'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(236,72,153,0.02))', borderColor:'rgba(236,72,153,0.2)'}}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1 flex items-center gap-1" style={{color:'#f472b6'}}>
                  <Sparkles size={12} /> AI Demand Forecast
                </p>
                <h3 className="text-lg font-black leading-tight" style={{color:'#f9fafb'}}>
                  📍 Jodimetla, Pocharam
                </h3>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:'rgba(236,72,153,0.15)'}}>
                <span className="text-lg">🌧️</span>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs font-bold leading-relaxed" style={{color:'#9ca3af'}}>
                <strong style={{color:'#f9fafb'}}>Weather Alert:</strong> 80% chance of rain tomorrow evening.
                Historical data for your location shows <span style={{color:'#ef4444'}}>Cold Coffee drops 40%</span> while <span style={{color:'#10b981'}}>Puff sales rise 30%</span>.
              </p>
              <div className="mt-2 text-xs font-black px-2 py-1 inline-block rounded" style={{background:'#f472b6', color:'#0a0f1a'}}>
                ACTION: Bake 20% more puffs tonight.
              </div>
            </div>
          </div>

          {/* Kitchen Performance */}
          <div className="glass-card p-4 flex flex-col justify-between" style={{background:'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(168,85,247,0.02))', borderColor:'rgba(168,85,247,0.2)'}}>
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-1" style={{color:'#c084fc'}}>Kitchen Performance</p>
                <h3 className="text-xl font-black" style={{color:'#f9fafb'}}>Avg: <span style={{color:'#10b981'}}>4.2 mins</span></h3>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:'rgba(168,85,247,0.15)'}}>
                <span className="text-lg">⏱️</span>
              </div>
            </div>
            <div className="mt-1">
              <p className="text-xs font-bold leading-relaxed" style={{color:'#9ca3af'}}>
                Target is &lt; 5 mins. You are <strong style={{color:'#10b981'}}>on track</strong>. 
                However, Custom Cakes are averaging 12 mins. Consider pre-basing sponges.
              </p>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="data-table animate-fadeInUp delay-2">
          <div className="p-4 flex items-center justify-between" style={{borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
            <p className="text-sm font-black" style={{color:'#9ca3af'}}>
              {showFailed ? 'Failed / Cancelled' : 'All Orders'} — {display.length} records
            </p>
            {showFailed && (
              <button onClick={() => setShowFailed(false)} className="text-xs font-black" style={{color:'#f59e0b'}}>← Show All</button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Customer</th>
                  <th className="hidden md:table-cell">Items</th>
                  <th>Amount</th>
                  <th>Payment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-12">
                    <span className="spinner mx-auto block" />
                  </td></tr>
                ) : display.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 font-black" style={{color:'#374151'}}>No orders found</td></tr>
                ) : display.map(o => (
                  <tr key={o.id}>
                    <td><span className="font-black text-base" style={{color:'#fbbf24'}}>{o.tokenNumber}</span></td>
                    <td>
                      <p className="font-bold text-sm" style={{color:'#f9fafb'}}>{o.customerName}</p>
                      {o.customerPhone && <p className="text-xs" style={{color:'#6b7280'}}>{o.customerPhone}</p>}
                    </td>
                    <td className="hidden md:table-cell max-w-xs">
                      <p className="text-xs font-semibold truncate" style={{color:'#6b7280'}} title={o.itemsSummary}>{o.itemsSummary}</p>
                    </td>
                    <td><span className="font-black" style={{color:'#10b981'}}>₹{o.totalAmount.toFixed(0)}</span></td>
                    <td><span className={`badge ${PAYMENT_BADGE[o.paymentStatus]||'badge-purple'}`}>{o.paymentStatus?.replace('_',' ')}</span></td>
                    <td><span className={`badge ${ORDER_BADGE[o.orderStatus]||'badge-purple'}`}>{o.orderStatus}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Danger zone */}
        <div className="mt-4 flex justify-end animate-fadeInUp delay-3">
          <button onClick={clearOrders} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-black" style={{background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',color:'#f87171'}} id="clear-orders-btn">
            <Trash2 size={14} /> Delete Demo Orders
          </button>
        </div>
      </div>
    </main>
  );
}
