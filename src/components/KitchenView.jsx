import { useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Bell, CheckCircle2, Clock, Package, PackageCheck, Timer, Volume2, VolumeX } from 'lucide-react';
import { api, API_BASE } from '../api';

/* ── Live elapsed timer ─────────────────────────────────────────────── */
function LiveTimer({ createdAt }) {
  const [elapsed, setElapsed] = useState('');
  const [late, setLate]       = useState(false);

  useEffect(() => {
    const tick = () => {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(createdAt)) / 1000));
      const m = Math.floor(diff / 60), s = diff % 60;
      setElapsed(`${m}m ${s}s`);
      setLate(m >= 5);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [createdAt]);

  return (
    <span className={`flex items-center gap-1 text-xs font-black ${late ? 'text-red-400' : 'text-gray-500'}`}>
      <Timer size={12} /> {elapsed}
    </span>
  );
}

/* ── Notification sound ─────────────────────────────────────────────── */
function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.55, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.55);
  } catch {}
}

/* ── Status config ──────────────────────────────────────────────────── */
const STATUS_CONFIG = {
  PLACED:  { label:'Placed',   color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  border:'rgba(59,130,246,0.3)',  dot:'#3b82f6' },
  PACKING: { label:'Packing',  color:'#f59e0b', bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.3)',  dot:'#f59e0b' },
  READY:   { label:'Ready',    color:'#10b981', bg:'rgba(16,185,129,0.12)', border:'rgba(16,185,129,0.3)',  dot:'#10b981' },
};
const PAYMENT_CONFIG = {
  PENDING_CASH:   { label:'Cash Pending', cls:'badge-amber' },
  PENDING_ONLINE: { label:'Awaiting Pay', cls:'badge-blue'  },
  PAID_CASH:      { label:'Cash Paid',    cls:'badge-green' },
  PAID_ONLINE:    { label:'Online Paid',  cls:'badge-green' },
  FAILED:         { label:'Failed',       cls:'badge-red'   },
};

/* ── Single Order Card ──────────────────────────────────────────────── */
function OrderCard({ order, onUpdateStatus }) {
  const [busy, setBusy] = useState(false);
  const sc = STATUS_CONFIG[order.orderStatus] || STATUS_CONFIG.PLACED;
  const pc = PAYMENT_CONFIG[order.paymentStatus] || { label: order.paymentStatus, cls:'badge-purple' };
  const isPendingOnline = order.paymentStatus === 'PENDING_ONLINE';

  const act = async (status) => {
    setBusy(true);
    try { await onUpdateStatus(order.id, status); }
    finally { setBusy(false); }
  };

  return (
    <article
      className="order-card animate-fadeInUp"
      style={{borderLeft:`4px solid ${sc.color}`}}
    >
      {/* Header */}
      <div className="p-4 pb-0">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <span className="text-4xl font-black block" style={{color:'#fbbf24',letterSpacing:'-0.02em'}}>{order.tokenNumber}</span>
            <span className="text-sm font-bold block mt-0.5" style={{color:'#9ca3af'}}>
              {order.customerName}{order.customerPhone ? ` · ${order.customerPhone}` : ''}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className={`badge ${pc.cls}`}>{pc.label}</span>
            <span className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg" style={{background:sc.bg,color:sc.color}}>
              <span className="w-1.5 h-1.5 rounded-full" style={{background:sc.dot}} /> {sc.label}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between mb-3">
          <LiveTimer createdAt={order.createdAt} />
          <span className="text-xs font-bold" style={{color:'#6b7280'}}>
            {new Date(order.createdAt).toLocaleTimeString('en-IN', {hour:'2-digit',minute:'2-digit'})}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="px-4 pb-3 space-y-1.5">
        {(order.items || []).map(item => (
          <div key={item.id} className="flex justify-between items-center rounded-xl px-3 py-2" style={{background:'rgba(255,255,255,0.04)'}}>
            <span className="text-sm font-black" style={{color:'#f9fafb'}}>{item.quantity}× {item.productName}</span>
            <span className="text-sm font-bold" style={{color:'#fbbf24'}}>₹{item.lineTotal.toFixed(0)}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="mx-4 rounded-2xl p-3 text-center mb-3" style={{background:'rgba(255,255,255,0.04)',border:'1px dashed rgba(255,255,255,0.1)'}}>
        <p className="text-xs font-black uppercase tracking-wider mb-0.5" style={{color:'#6b7280'}}>Total</p>
        <p className="text-2xl font-black" style={{color:'#fbbf24'}}>₹{order.totalAmount.toFixed(0)}</p>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 space-y-2">
        {isPendingOnline && (
          <div className="rounded-xl p-3 text-center text-sm font-black" style={{background:'rgba(59,130,246,0.1)',color:'#60a5fa',border:'1px solid rgba(59,130,246,0.2)'}}>
            ⏳ Waiting for online payment...
          </div>
        )}
        {order.orderStatus === 'PLACED' && !isPendingOnline && (
          <button
            disabled={busy}
            onClick={() => act('PACKING')}
            className="btn btn-primary w-full"
            id={`start-packing-${order.id}`}
          >
            {busy ? <span className="spinner" /> : <Package size={16} />}
            {order.paymentStatus === 'PENDING_CASH' ? 'Confirm Cash & Pack' : 'Start Packing'}
          </button>
        )}
        {order.orderStatus === 'PACKING' && (
          <button
            disabled={busy}
            onClick={() => act('READY')}
            className="btn w-full"
            id={`mark-ready-${order.id}`}
            style={{background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'#fff',boxShadow:'0 4px 20px rgba(59,130,246,0.3)'}}
          >
            {busy ? <span className="spinner" /> : <PackageCheck size={16} />}
            Mark Ready
          </button>
        )}
        {order.orderStatus === 'READY' && (
          <button
            disabled={busy}
            onClick={() => act('HANDED_OVER')}
            className="btn btn-green w-full"
            id={`handed-over-${order.id}`}
          >
            {busy ? <span className="spinner" /> : <CheckCircle2 size={16} />}
            Handed Over ✓
          </button>
        )}
      </div>
    </article>
  );
}

/* ── Main KitchenView ───────────────────────────────────────────────── */
export default function KitchenView({ mode = 'picker' }) {
  const [orders, setOrders]         = useState([]);
  const [audio, setAudio]           = useState(false);
  const [wsConnected, setWsConn]    = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const knownIds = useRef(new Set());

  const fetchOrders = async () => {
    const res = await api.get('/api/orders/active');
    setOrders(res.data);
    knownIds.current = new Set(res.data.map(o => o.id));
    setLastUpdate(new Date());
  };

  useEffect(() => {
    fetchOrders();
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws-kitchen`),
      reconnectDelay: 4000,
      onConnect: () => {
        setWsConn(true);
        client.subscribe('/topic/orders', msg => {
          const incoming = JSON.parse(msg.body);
          const isNew = !knownIds.current.has(incoming.id);
          knownIds.current.add(incoming.id);
          setOrders(prev => [incoming, ...prev.filter(o => o.id !== incoming.id)]);
          setLastUpdate(new Date());
          if (isNew && audio) playDing();
        });
        client.subscribe('/topic/orders/refresh', fetchOrders);
      },
      onDisconnect: () => setWsConn(false),
    });
    client.activate();
    return () => client.deactivate();
  }, [audio]);

  const updateStatus = async (id, status) => {
    await api.put(`/api/orders/${id}/status?status=${status}`);
    fetchOrders();
  };

  const active = useMemo(() => orders.filter(o =>
    !['CANCELLED','HANDED_OVER'].includes(o.orderStatus) && o.paymentStatus !== 'FAILED'
  ), [orders]);

  const byStatus = (s) => active.filter(o => o.orderStatus === s);
  const placed  = byStatus('PLACED');
  const packing = byStatus('PACKING');
  const ready   = byStatus('READY');

  return (
    <main className="min-h-screen" style={{background:'#0a0f1a'}}>
      {/* Header */}
      <header className="sticky top-0 z-40 px-4 py-3" style={{background:'rgba(10,15,26,0.9)',backdropFilter:'blur(20px)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
            <h1 className="text-xl font-black" style={{color:'#f9fafb'}}>
              {mode === 'picker' ? '📦 Picker Dashboard' : '👨‍🍳 Kitchen Display'}
            </h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Stats pills */}
            <span className="badge badge-red">{placed.length} New</span>
            <span className="badge badge-amber">{packing.length} Packing</span>
            <span className="badge badge-green">{ready.length} Ready</span>

            {/* WS status */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)'}}>
              <span className={`live-dot ${wsConnected ? '' : 'bg-red-500'}`} style={wsConnected ? {} : {background:'#ef4444'}} />
              <span style={{color: wsConnected ? '#34d399' : '#f87171'}}>{wsConnected ? 'Live' : 'Offline'}</span>
            </div>

            {/* Audio toggle */}
            <button
              onClick={() => { setAudio(v => !v); if (!audio) playDing(); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-black"
              id="toggle-audio-btn"
              style={{background: audio ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border:`1px solid ${audio ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)'}`, color: audio ? '#34d399' : '#9ca3af'}}
            >
              {audio ? <Volume2 size={14} /> : <VolumeX size={14} />} Sound
            </button>

            <button onClick={fetchOrders} className="px-3 py-2 rounded-xl text-xs font-black" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af'}} id="refresh-orders-btn">
              ↻ Refresh
            </button>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs mt-1 max-w-7xl mx-auto" style={{color:'#4b5563'}}>
            Updated {lastUpdate.toLocaleTimeString('en-IN')}
          </p>
        )}
      </header>

      {/* Orders Grid */}
      <div className="max-w-7xl mx-auto p-4">
        {active.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 animate-fadeIn">
            <div className="text-7xl mb-4" style={{animation:'float 3s ease-in-out infinite'}}>☕</div>
            <p className="text-2xl font-black" style={{color:'#374151'}}>All clear!</p>
            <p className="text-sm mt-1" style={{color:'#6b7280'}}>No active orders right now.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {active.map((order, i) => (
              <OrderCard key={order.id} order={order} onUpdateStatus={updateStatus} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
