import { useEffect, useState } from 'react';
import { MapPin, CheckCircle, Navigation, Phone } from 'lucide-react';
import { api } from '../api';

export default function RiderView() {
  const [orders, setOrders] = useState([]);

  const fetchOrders = () => {
    api.get('/api/orders/active')
      .then(r => setOrders(r.data.filter(o => o.orderStatus === 'READY' || o.orderStatus === 'PACKING')))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const markDelivered = async (id) => {
    await api.put(`/api/orders/${id}/status?status=HANDED_OVER`);
    fetchOrders();
  };

  return (
    <main className="min-h-screen p-4 pb-24" style={{background:'#0a0f1a'}}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6 animate-fadeInUp">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
            <h1 className="text-2xl font-black" style={{color:'#f9fafb'}}>Rider App</h1>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:'rgba(16,185,129,0.15)'}}>
            <span className="text-lg">🛵</span>
          </div>
        </div>

        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-12 animate-fadeIn">
              <p className="text-4xl mb-2">😴</p>
              <p className="text-sm font-bold" style={{color:'#9ca3af'}}>No active deliveries.</p>
            </div>
          ) : (
            orders.map((o, idx) => (
              <div key={o.id} className="glass-card p-4 animate-fadeInUp" style={{animationDelay:`${idx*0.1}s`, borderLeft:'4px solid #10b981'}}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="badge badge-amber mb-2">Token {o.tokenNumber}</span>
                    <h2 className="text-lg font-black" style={{color:'#f9fafb'}}>{o.customerName}</h2>
                    {o.customerPhone && (
                      <a href={`tel:${o.customerPhone}`} className="text-sm font-bold flex items-center gap-1 mt-1" style={{color:'#3b82f6'}}>
                        <Phone size={14} /> {o.customerPhone}
                      </a>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{color:'#fbbf24'}}>₹{o.totalAmount.toFixed(0)}</p>
                    <p className="text-xs font-bold" style={{color: o.paymentStatus.includes('PAID') ? '#10b981' : '#ef4444'}}>
                      {o.paymentStatus.includes('PAID') ? 'PAID' : 'COLLECT CASH'}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl mb-4" style={{background:'rgba(255,255,255,0.04)'}}>
                  <p className="text-xs font-bold flex items-center gap-1" style={{color:'#9ca3af'}}>
                    <MapPin size={12} /> Jodimetla, Pocharam, Telangana
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a 
                    href="https://maps.google.com/?q=Jodimetla,+Pocharam,+Telangana" 
                    target="_blank" rel="noreferrer"
                    className="btn btn-dark text-xs flex justify-center py-2"
                  >
                    <Navigation size={14} /> Navigate
                  </a>
                  <button 
                    onClick={() => markDelivered(o.id)}
                    className="btn btn-green text-xs flex justify-center py-2"
                  >
                    <CheckCircle size={14} /> Delivered
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
