import { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { AlertCircle, CheckCircle2, ChevronRight, Download, Minus, Plus, Search, ShoppingBag, Sparkles, User, X } from 'lucide-react';
import { api, generateId, getDeviceId, RAZORPAY_KEY_ID } from '../api';
import LazyImage from './LazyImage';

const CATEGORY_EMOJI = { Cakes:'🎂', Pastries:'🥐', Puffs:'🫓', Breads:'🍞', Cookies:'🍪', Drinks:'☕', Specials:'⭐', All:'🛍️' };

const loadRazorpay = () => new Promise(resolve => {
  if (window.Razorpay) return resolve(true);
  const s = document.createElement('script');
  s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = () => resolve(true); s.onerror = () => resolve(false);
  document.body.appendChild(s);
});

/* ── Entry Screen ─────────────────────────────────────────────────────── */
function EntryScreen({ onSave }) {
  const [form, setForm] = useState({ name: '', phone: '' });
  const [err, setErr] = useState('');
  
  // Check for existing profile on load
  const existingCustomer = useMemo(() => JSON.parse(localStorage.getItem('pastry_customer') || 'null'), []);
  const [showProfile, setShowProfile] = useState(!!existingCustomer);
  
  // Past orders stored locally
  const history = useMemo(() => JSON.parse(localStorage.getItem('pastry_history') || '[]'), []);

  const submit = e => {
    e.preventDefault();
    if (form.name.trim().length < 2) { setErr('Name must be at least 2 characters'); return; }
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.trim())) { setErr('Enter a valid 10-digit Indian mobile number'); return; }
    const val = { name: form.name.trim(), phone: form.phone.trim() };
    localStorage.setItem('pastry_customer', JSON.stringify(val));
    onSave(val);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 relative overflow-hidden" style={{background:'linear-gradient(135deg,#0a0f1a 0%,#111827 50%,#0a0f1a 100%)'}}>
      {/* Background blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none" style={{background:'radial-gradient(circle,#f59e0b,transparent 70%)'}} />
      <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full opacity-8 blur-3xl pointer-events-none" style={{background:'radial-gradient(circle,#ef4444,transparent 70%)'}} />

      <div className="w-full max-w-sm relative z-10 animate-fadeInUp">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4" style={{background:'linear-gradient(135deg,#f59e0b,#d97706)',boxShadow:'0 8px 32px rgba(245,158,11,0.4)'}}>
            <ShoppingBag size={36} color="#0a0f1a" strokeWidth={2.5} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{color:'#f59e0b'}}>Softy Bakeries</p>
          <h1 className="text-3xl font-black leading-tight" style={{fontFamily:'Inter',color:'#f9fafb'}}>
            Fresh bakes,<br /><span className="gradient-text">zero wait.</span>
          </h1>
          <p className="mt-2 text-sm font-medium" style={{color:'#6b7280'}}>Scan → Browse → Pay. No app download.</p>
        </div>

        {showProfile && existingCustomer ? (
          <div className="glass-card p-6 space-y-4 text-center">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-2" style={{background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)'}}>
              <User size={32} style={{color:'#f59e0b'}} />
            </div>
            <h2 className="text-xl font-black" style={{color:'#f9fafb'}}>Welcome back, {existingCustomer.name}!</h2>
            
            {history.length > 0 && (
              <div className="text-left mt-4 mb-4 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)'}}>
                <p className="text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Your Recent Orders</p>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {history.slice(0, 3).map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-sm p-2 rounded-lg" style={{background:'rgba(255,255,255,0.02)'}}>
                      <span className="font-bold" style={{color:'#f9fafb'}}>Token {h.token}</span>
                      <span className="font-bold text-xs" style={{color:'#fbbf24'}}>₹{h.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => onSave(existingCustomer)} className="btn btn-primary w-full mt-2" id="continue-ordering-btn">
              <Sparkles size={18} /> Continue Ordering <ChevronRight size={16} />
            </button>
            <button onClick={() => setShowProfile(false)} className="mt-3 text-xs font-bold w-full p-2" style={{color:'#6b7280'}}>
              Not you? Switch user
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="glass-card p-6 space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Your Name *</label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-4" style={{color:'#f59e0b'}} />
              <input
                value={form.name}
                onChange={e => { setForm({...form,name:e.target.value}); setErr(''); }}
                placeholder="e.g. Raju"
                className="field !pl-10"
                required minLength={2}
                id="customer-name"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Phone <span style={{color:'#6b7280'}}>(optional)</span></label>
            <input
              value={form.phone}
              onChange={e => { setForm({...form,phone:e.target.value}); setErr(''); }}
              placeholder="10-digit number"
              type="tel" maxLength={10}
              className="field"
              id="customer-phone"
            />
          </div>
          {err && <p className="text-sm font-bold text-red-400 animate-fadeIn">{err}</p>}
          <button type="submit" className="btn btn-primary w-full mt-2" id="start-ordering-btn">
            <Sparkles size={18} /> Start Ordering <ChevronRight size={16} />
          </button>
        </form>
        )}

        <p className="text-center mt-4 text-xs font-medium" style={{color:'#4b5563'}}>Your data stays on this device only.</p>
      </div>
    </main>
  );
}

/* ── Confirmation & Feedback Screen ─────────────────────────────────────────────────────── */
function ConfirmScreen({ order, cartLines, onReset }) {
  const [downloading, setDownloading] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [liveStatus, setLiveStatus] = useState(order.orderStatus || 'PLACED');
  const ref = useRef(null);

  useEffect(() => {
    if (!order.id) return;
    const poll = () => {
      api.get('/api/orders/active')
        .then(res => {
          const found = res.data.find(o => o.id === order.id);
          if (found) setLiveStatus(found.orderStatus);
        })
        .catch(console.error);
    };
    poll();
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [order.id]);

  const download = async () => {
    if (!ref.current) return;
    setDownloading(true);
    const canvas = await html2canvas(ref.current, { scale: 2, backgroundColor: '#111827' });
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/jpeg', 0.95);
    a.download = `Softy Bakeries_${order.tokenNumber}.jpg`;
    a.click();
    setDownloading(false);
  };

  const STATUS_STEPS = [
    { key: 'PLACED', icon: '📋', label: 'Order Placed' },
    { key: 'PACKING', icon: '📦', label: 'Preparing' },
    { key: 'READY', icon: '✅', label: 'Ready for Pickup' },
    { key: 'HANDED_OVER', icon: '🎉', label: 'Collected' },
  ];
  const currentIdx = STATUS_STEPS.findIndex(s => s.key === liveStatus);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5" style={{background:'#0a0f1a'}}>
      <div className="w-full max-w-sm">
        <div ref={ref} className="glass-card p-6 text-center mb-4 animate-scaleIn">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3" style={{background:'rgba(16,185,129,0.15)',border:'2px solid rgba(16,185,129,0.3)'}}>
            <CheckCircle2 size={32} style={{color:'#10b981'}} />
          </div>
          <p className="text-xs font-black uppercase tracking-widest mb-1" style={{color:'#f59e0b'}}>Order Confirmed!</p>
          <h1 className="text-2xl font-black mb-4" style={{color:'#f9fafb'}}>Softy Bakeries</h1>

          <div className="rounded-2xl p-6 mb-4 animate-token" style={{background:'linear-gradient(135deg,#f59e0b22,#d9770622)',border:'2px solid rgba(245,158,11,0.3)'}}>
            <p className="text-xs font-black uppercase tracking-widest mb-1" style={{color:'#f59e0b'}}>Your Token</p>
            <p className="text-5xl font-black" style={{color:'#fbbf24',letterSpacing:'-0.02em'}}>{order.tokenNumber}</p>
          </div>

          {/* Live Status Tracker — Blinkit/Zomato style */}
          <div className="mb-4 p-4 rounded-xl text-left" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)'}}>
            <p className="text-xs font-black uppercase tracking-widest mb-3 text-center" style={{color:'#9ca3af'}}>Live Order Status</p>
            {liveStatus === 'CANCELLED' ? (
              <div className="text-center text-lg font-black" style={{color:'#ef4444'}}>❌ Order Cancelled</div>
            ) : (
              <div className="space-y-0">
                {STATUS_STEPS.map((step, i) => {
                  const state = i < currentIdx ? 'completed' : i === currentIdx ? 'active' : 'pending';
                  return (
                    <div key={step.key} className={`rider-step ${state}`}>
                      <div className="step-dot">{step.icon}</div>
                      <span className="text-sm font-bold" style={{color: state === 'pending' ? '#6b7280' : '#f9fafb'}}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-sm font-bold mb-4" style={{color:'#9ca3af'}}>{order.customerName}</p>

          <div className="space-y-2 text-left mb-4">
            {(order.items || cartLines).map((item, i) => (
              <div key={item.id||i} className="flex justify-between rounded-xl px-3 py-2 text-sm font-bold" style={{background:'rgba(255,255,255,0.04)'}}>
                <span style={{color:'#f9fafb'}}>{item.quantity}× {item.productName||item.name}</span>
                <span style={{color:'#10b981'}}>₹{(item.lineTotal || item.price*item.quantity).toFixed(0)}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-3 text-lg font-black" style={{borderTop:'1px dashed rgba(255,255,255,0.1)'}}>
            <span style={{color:'#9ca3af'}}>Total</span>
            <span style={{color:'#fbbf24'}}>₹{order.totalAmount.toFixed(0)}</span>
          </div>

          <div className={`mt-3 text-center py-2 px-4 rounded-xl text-xs font-black uppercase tracking-wider ${order.paymentStatus?.includes('CASH') ? 'badge badge-amber' : 'badge badge-green'}`} style={{display:'block'}}>
            {order.paymentStatus}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 animate-fadeInUp delay-2">
          <button onClick={download} disabled={downloading} className="btn btn-dark" id="download-receipt-btn">
            <Download size={18} /> {downloading ? 'Saving...' : 'Receipt'}
          </button>
          <button onClick={() => window.print()} className="btn btn-dark" id="print-receipt-btn">
            Print
          </button>
        </div>

        {/* 6. One-Tap Feedback Loop */}
        {!feedbackSent ? (
          <div className="glass-card p-4 mb-4 animate-fadeInUp delay-3 text-center">
            <p className="text-sm font-bold mb-2" style={{color:'#f9fafb'}}>How was your experience?</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button 
                  key={star} 
                  onClick={() => { setRating(star); setTimeout(() => setFeedbackSent(true), 600); }}
                  className="text-2xl transition-transform hover:scale-125"
                  style={{color: rating >= star ? '#f59e0b' : '#374151'}}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="glass-card p-4 mb-4 animate-fadeInUp text-center" style={{background:'rgba(16,185,129,0.1)', borderColor:'rgba(16,185,129,0.2)'}}>
            <p className="text-sm font-bold" style={{color:'#10b981'}}>Thank you for your feedback! 💖</p>
          </div>
        )}

        <button onClick={onReset} className="btn btn-primary w-full animate-fadeInUp delay-3" id="new-order-btn" style={{marginTop:'10px'}}>
          <ShoppingBag size={18} /> Place Another Order
        </button>
      </div>
    </main>
  );
}

/* ── Main Menu ────────────────────────────────────────────────────────── */
export default function CustomerView() {
  const [customer, setCustomer] = useState(null); // Show EntryScreen first always
  const [menuItems, setMenuItems]   = useState([]);
  const [cart, setCart]             = useState({});
  const [search, setSearch]         = useState('');
  const [category, setCategory]     = useState('All');
  const [order, setOrder]           = useState(null);
  const [loading, setLoading]       = useState(false);
  const [cartOpen, setCartOpen]     = useState(false);
  const [ikey, setIkey]             = useState(generateId());
  const [fetching, setFetching]     = useState(true);
  const [scheduleTime, setScheduleTime] = useState('now');
  const [orderType, setOrderType]   = useState('DINE_IN'); // 'DINE_IN' or 'DELIVERY'
  const isProcessing = useRef(false);

  // 4. Happy Hour Logic (8 PM to 6 AM)
  const isHappyHour = useMemo(() => {
    const hr = new Date().getHours();
    return hr >= 20 || hr < 6;
  }, []);

  useEffect(() => {
    api.get('/api/products')
      .then(r => setMenuItems(r.data))
      .catch(() => setMenuItems([]))
      .finally(() => setFetching(false));
  }, []);

  const categories = useMemo(() => ['All', ...Array.from(new Set(menuItems.map(i => i.category||'Bakery')))], [menuItems]);
  const filtered   = useMemo(() => menuItems.filter(i => {
    const matchCat = category === 'All' || (i.category||'Bakery') === category;
    const text = `${i.name} ${i.description||''}`.toLowerCase();
    return matchCat && text.includes(search.toLowerCase());
  }), [menuItems, category, search]);

  const cartLines = useMemo(() => Object.entries(cart).map(([id, qty]) => {
    const p = menuItems.find(i => i.id === Number(id));
    return p ? { ...p, quantity: qty, lineTotal: p.price * qty } : null;
  }).filter(Boolean), [cart, menuItems]);

  const total     = cartLines.reduce((s, i) => s + i.lineTotal, 0);
  const itemCount = cartLines.reduce((s, i) => s + i.quantity, 0);

  const changeQty = (item, delta) => {
    if (!item.inStock && delta > 0) return;
    setCart(cur => {
      const next = { ...cur };
      const nq = Math.max(0, (cur[item.id] || 0) + delta);
      if (nq === 0) delete next[item.id]; else next[item.id] = nq;
      return next;
    });
  };

  const resetOrder = () => { setCart({}); setOrder(null); setIkey(generateId()); isProcessing.current = false; setLoading(false); };

  const placeOrder = async (provider) => {
    if (!cartLines.length || isProcessing.current) return;
    isProcessing.current = true; setLoading(true);
    try {
      const headers = { 'Idempotency-Key': ikey, 'X-Device-Id': getDeviceId() };
      const payload = { customerName: customer.name, customerPhone: customer.phone||null, paymentProvider: provider, items: cartLines.map(i => ({ productId: i.id, quantity: i.quantity })) };
      const res = await api.post('/api/orders/create', payload, { headers });

      if (provider === 'CASH') { 
        saveToHistory(res.data);
        setOrder(res.data); setLoading(false); setCartOpen(false); return; 
      }

      if (!RAZORPAY_KEY_ID) throw new Error('Razorpay key not configured');
      const ok = await loadRazorpay();
      if (!ok) throw new Error('Razorpay failed to load');

      const rzp = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: Math.round(res.data.totalAmount * 100),
        currency: 'INR',
        name: 'Softy Bakeries',
        description: res.data.itemsSummary,
        order_id: res.data.razorpayOrderId,
        prefill: { name: customer.name, contact: customer.phone||'' },
        theme: { color: '#f59e0b' },
        handler: async (pr) => {
          const v = await api.post('/api/orders/verify', pr);
          saveToHistory(v.data);
          setOrder(v.data); setLoading(false); setCartOpen(false);
        },
      });
      rzp.on('payment.failed', () => { isProcessing.current = false; setLoading(false); });
      rzp.open();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Order failed. Try again.');
      isProcessing.current = false; setLoading(false);
    }
  };

  const saveToHistory = (orderData) => {
    try {
      const hist = JSON.parse(localStorage.getItem('pastry_history') || '[]');
      hist.unshift({ token: orderData.tokenNumber, amount: orderData.totalAmount, date: new Date().toISOString() });
      localStorage.setItem('pastry_history', JSON.stringify(hist));
    } catch (e) { console.error('Failed to save history', e); }
  };

  if (!customer) return <EntryScreen onSave={setCustomer} />;
  if (order)     return <ConfirmScreen order={order} cartLines={cartLines} onReset={resetOrder} />;

  return (
    <main className="min-h-screen pb-safe" style={{background:'#0a0f1a'}}>
      {/* ── Header ── */}
      <header style={{background:'linear-gradient(180deg,#111827 0%,#0d1420 100%)',borderBottom:'1px solid rgba(255,255,255,0.07)',position:'sticky',top:0,zIndex:40}}>
        {/* Zomato-style Delivery Banner (Conditional) */}
        {orderType === 'DELIVERY' && (
          <div className="w-full px-4 py-2 flex items-center justify-between animate-fadeInDown" style={{background:'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, rgba(245,158,11,0.05) 100%)', borderBottom:'1px solid rgba(245,158,11,0.1)'}}>
            <p className="text-xs font-bold" style={{color:'#fcd34d'}}>🚀 10 Min Delivery (5km) | Min ₹199</p>
            <a href="https://wa.me/919876543210?text=Hi%20Softy%20Bakeries,%20I%20need%20help%20with%20my%20order!" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-lg" style={{background:'rgba(34,197,94,0.15)', color:'#4ade80', border:'1px solid rgba(34,197,94,0.3)'}}>
              💬 Support
            </a>
          </div>
        )}

        <div className="max-w-5xl mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
              <h1 className="text-xl font-black leading-tight" style={{color:'#f9fafb'}}>
                Hi {customer.name}! 👋
              </h1>
            </div>
            <button
              onClick={() => { localStorage.removeItem('pastry_customer'); setCustomer(null); }}
              className="p-2 rounded-xl"
              style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af'}}
              id="change-customer-btn"
            >
              <User size={16} />
            </button>
          </div>

          {/* Dine-In / Delivery Toggle */}
          <div className="flex bg-gray-900 rounded-xl p-1 mb-3" style={{border:'1px solid rgba(255,255,255,0.05)'}}>
            <button 
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${orderType === 'DINE_IN' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setOrderType('DINE_IN')}
            >
              🍽️ In-Store
            </button>
            <button 
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${orderType === 'DELIVERY' ? 'bg-amber-500 text-gray-900' : 'text-gray-400 hover:text-white'}`}
              onClick={() => setOrderType('DELIVERY')}
            >
              🛵 Delivery
            </button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-3 rounded-2xl px-4 py-3" style={{background:'rgba(255,255,255,0.07)',border:'1.5px solid rgba(255,255,255,0.1)'}}>
            <Search size={16} style={{color:'#f59e0b',flexShrink:0}} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search cakes, puffs, drinks..."
              className="flex-1 bg-transparent text-sm font-semibold outline-none"
              style={{color:'#f9fafb'}}
              id="menu-search-input"
            />
            {search && <button onClick={() => setSearch('')}><X size={14} style={{color:'#6b7280'}} /></button>}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto px-4 pb-3 hide-scrollbar" style={{scrollbarWidth:'none'}}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`cat-pill ${cat === category ? 'active' : 'inactive'}`}
              id={`cat-${cat.toLowerCase()}`}
            >
              <span>{CATEGORY_EMOJI[cat]||'🍴'}</span> {cat}
            </button>
          ))}
        </div>
      </header>

      {/* ── Grid ── */}
      <section className="max-w-5xl mx-auto px-4 py-4">
        {fetching ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="product-card img-optimistic" style={{height:260,animationDelay:`${i*0.06}s`}} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg font-black" style={{color:'#374151'}}>No items found</p>
            <p className="text-sm mt-1" style={{color:'#6b7280'}}>Try a different search or category</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((item, idx) => {
              const qty = cart[item.id] || 0;
              return (
                <article
                  key={item.id}
                  className={`product-card ${!item.inStock ? 'oos' : ''}`}
                  style={{animationDelay:`${idx*0.04}s`}}
                >
                  <div className="relative">
                    <LazyImage
                      src={item.imageUrl}
                      alt={item.name}
                      fallbackEmoji={CATEGORY_EMOJI[item.category]||'🍰'}
                      aspectRatio="4/3"
                      className="w-full"
                    />
                    {!item.inStock && (
                      <div className="absolute inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.7)'}}>
                        <span className="badge badge-red"><AlertCircle size={10}/> Sold Out</span>
                      </div>
                    )}
                    {item.category && (
                      <span className="absolute top-2 left-2 badge badge-amber">{item.category}</span>
                    )}
                    {/* 4. Happy Hour Badge */}
                    {isHappyHour && ['Pastries', 'Puffs'].includes(item.category) && item.inStock && (
                      <span className="absolute top-2 right-2 badge badge-purple animate-pulse">50% OFF</span>
                    )}
                  </div>

                  <div className="p-3">
                    <h2 className="font-black text-sm leading-tight mb-1" style={{color:'#f9fafb'}}>{item.name}</h2>
                    {item.description && (
                      <p className="text-xs font-medium mb-2 line-clamp-1" style={{color:'#6b7280'}}>{item.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-base font-black" style={{color:'#fbbf24'}}>₹{item.price.toFixed(0)}</span>
                      {qty > 0 ? (
                        <div className="flex items-center gap-1 rounded-xl overflow-hidden" style={{background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.2)'}}>
                          <button onClick={() => changeQty(item,-1)} className="p-2" id={`minus-${item.id}`}>
                            <Minus size={12} style={{color:'#f59e0b'}} />
                          </button>
                          <span className="text-sm font-black px-1" style={{color:'#fbbf24'}}>{qty}</span>
                          <button onClick={() => changeQty(item,1)} className="p-2" id={`plus-${item.id}`}>
                            <Plus size={12} style={{color:'#f59e0b'}} />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={!item.inStock}
                          onClick={() => changeQty(item,1)}
                          className="p-2 rounded-xl font-black text-xs"
                          id={`add-${item.id}`}
                          style={{background:'rgba(245,158,11,0.12)',border:'1px solid rgba(245,158,11,0.2)',color:'#f59e0b'}}
                        >
                          <Plus size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Cart Bar ── */}
      {itemCount > 0 && !cartOpen && (
        <div className="cart-bar">
          <div className="max-w-5xl mx-auto">
            <button
              onClick={() => setCartOpen(true)}
              className="btn btn-primary w-full"
              id="view-cart-btn"
            >
              <ShoppingBag size={18} />
              <span>{itemCount} item{itemCount>1?'s':''}</span>
              <span className="flex-1" />
              <span>₹{total.toFixed(0)}</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Cart Drawer ── */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" id="cart-drawer">
          <div className="absolute inset-0" style={{background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)'}} onClick={() => setCartOpen(false)} />
          <div className="relative rounded-t-3xl p-5 animate-slideUp max-h-[85vh] flex flex-col" style={{background:'#111827',border:'1px solid rgba(255,255,255,0.1)'}}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black" style={{color:'#f9fafb'}}>Your Cart</h2>
              <button onClick={() => setCartOpen(false)} className="p-2 rounded-xl" style={{background:'rgba(255,255,255,0.07)'}} id="close-cart-btn">
                <X size={18} style={{color:'#9ca3af'}} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 mb-4">
              {cartLines.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl" style={{background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)'}}>
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                    <LazyImage src={item.imageUrl} alt={item.name} fallbackEmoji={CATEGORY_EMOJI[item.category]||'🍰'} aspectRatio="1/1" className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{color:'#f9fafb'}}>{item.name}</p>
                    <p className="text-xs font-bold" style={{color:'#fbbf24'}}>₹{item.lineTotal.toFixed(0)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => changeQty(item,-1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(255,255,255,0.08)'}}>
                      <Minus size={12} style={{color:'#f9fafb'}} />
                    </button>
                    <span className="text-sm font-black w-5 text-center" style={{color:'#f9fafb'}}>{item.quantity}</span>
                    <button onClick={() => changeQty(item,1)} className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background:'rgba(245,158,11,0.15)'}}>
                      <Plus size={12} style={{color:'#f59e0b'}} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. AI "Frequently Bought Together" Upsells */}
            {cartLines.some(c => c.category === 'Cakes') && !cartLines.some(c => c.category === 'Drinks') && (
              <div className="mb-4 p-3 rounded-xl" style={{background:'linear-gradient(90deg, rgba(168,85,247,0.15) 0%, rgba(168,85,247,0.05) 100%)', border:'1px solid rgba(168,85,247,0.3)'}}>
                <p className="text-xs font-black uppercase mb-1" style={{color:'#c084fc'}}>✨ AI Suggestion</p>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-bold" style={{color:'#f9fafb'}}>Add a Drink with your cake?</p>
                  <button 
                    onClick={() => {
                      const drink = menuItems.find(m => m.category === 'Drinks' && m.inStock);
                      if (drink) changeQty(drink, 1);
                      else alert('No drinks available right now!');
                    }}
                    className="text-xs font-black px-2 py-1 rounded transition-transform active:scale-95" 
                    style={{background:'#c084fc', color:'#0a0f1a'}}
                  >
                    + Add
                  </button>
                </div>
              </div>
            )}

            {/* 3. Blinkit-Style Delivery/Pickup Time Slots */}
            <div className="mb-4 p-3 rounded-xl" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>
                {orderType === 'DELIVERY' ? '🛵 Delivery Time' : '🍽️ Pickup Time'}
              </p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'now', label: orderType === 'DELIVERY' ? '10 min' : 'ASAP', sub: 'Express' },
                  { val: '30min', label: '30 min', sub: 'Standard' },
                  { val: '1hr', label: '1 hour', sub: 'Relaxed' },
                ].map(slot => (
                  <button
                    key={slot.val}
                    onClick={() => setScheduleTime(slot.val)}
                    className={`time-slot ${scheduleTime === slot.val ? 'active' : ''}`}
                  >
                    <div className="font-black text-sm">{slot.label}</div>
                    <div className="text-[10px] opacity-60">{slot.sub}</div>
                  </button>
                ))}
              </div>
              {orderType === 'DELIVERY' && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { val: '2hr', label: '2 hours' },
                    { val: 'today-eve', label: 'Evening' },
                    { val: 'tomorrow', label: 'Tomorrow' },
                  ].map(slot => (
                    <button
                      key={slot.val}
                      onClick={() => setScheduleTime(slot.val)}
                      className={`time-slot ${scheduleTime === slot.val ? 'active' : ''}`}
                    >
                      <div className="font-black text-xs">{slot.label}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-3 mb-2" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
              <span className="font-black" style={{color:'#9ca3af'}}>Total</span>
              <span className="text-2xl font-black" style={{color:'#fbbf24'}}>₹{total.toFixed(0)}</span>
            </div>

            {/* Upsell Progress Bar (Delivery Only) */}
            {orderType === 'DELIVERY' && (
              <div className="mb-4">
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span style={{color: total >= 199 ? '#34d399' : '#f9fafb'}}>
                    {total >= 199 ? '🎉 10-Min Free Delivery Unlocked!' : `Add ₹${(199 - total).toFixed(0)} more for FREE 10-Min Delivery`}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full overflow-hidden" style={{background:'rgba(255,255,255,0.1)'}}>
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{width: `${Math.min(100, (total / 199) * 100)}%`, background: total >= 199 ? '#10b981' : '#f59e0b'}} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={loading}
                onClick={() => placeOrder('CASH')}
                className="btn btn-dark"
                id="pay-cash-btn"
              >
                {loading ? <span className="spinner" /> : '💵'} Pay Cash
              </button>
              <button
                disabled={loading}
                onClick={() => placeOrder('RAZORPAY')}
                className="btn btn-primary"
                id="pay-online-btn"
              >
                {loading ? <span className="spinner" /> : '📱'} Pay Online
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
