import { useEffect, useState, useRef } from 'react';
import { MapPin, CheckCircle, Navigation, Phone, Package, Clock, ChevronRight, Bike, RefreshCw } from 'lucide-react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { api, API_BASE } from '../api';

const STATUS_FLOW = ['PLACED', 'PACKING', 'READY', 'OUT_FOR_DELIVERY', 'HANDED_OVER'];

function StatusBadge({ status }) {
  const colors = {
    PLACED: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    PACKING: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
    READY: { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)' },
    HANDED_OVER: { bg: 'rgba(168,85,247,0.15)', color: '#c084fc', border: 'rgba(168,85,247,0.3)' },
  };
  const c = colors[status] || colors.PLACED;
  return (
    <span className="badge" style={{background: c.bg, color: c.color, border: `1px solid ${c.border}`}}>
      {status?.replace('_', ' ')}
    </span>
  );
}

function DeliveryCard({ order, onAccept, onPickedUp, onDelivered, expanded, onExpand }) {
  const isReady = order.orderStatus === 'READY';
  const isPacking = order.orderStatus === 'PACKING' || order.orderStatus === 'PLACED';
  const timeSince = Math.round((Date.now() - new Date(order.createdAt).getTime()) / 60000);

  return (
    <div 
      className="glass-card overflow-hidden animate-fadeInUp"
      style={{borderLeft: isReady ? '4px solid #10b981' : '4px solid #f59e0b'}}
    >
      {/* Header */}
      <button 
        onClick={onExpand}
        className="w-full p-4 flex justify-between items-start text-left"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg font-black" style={{color:'#fbbf24'}}>{order.tokenNumber}</span>
            <StatusBadge status={order.orderStatus} />
          </div>
          <h2 className="text-base font-black" style={{color:'#f9fafb'}}>{order.customerName}</h2>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-bold flex items-center gap-1" style={{color:'#9ca3af'}}>
              <Clock size={10} /> {timeSince} min ago
            </span>
            <span className="text-sm font-black" style={{color: order.paymentStatus?.includes('PAID') ? '#10b981' : '#ef4444'}}>
              {order.paymentStatus?.includes('PAID') ? '✅ PAID' : '💵 COLLECT CASH'}
            </span>
          </div>
        </div>
        <div className="text-right flex flex-col items-end gap-1">
          <p className="text-xl font-black" style={{color:'#fbbf24'}}>₹{order.totalAmount?.toFixed(0)}</p>
          <ChevronRight size={16} style={{color:'#6b7280', transform: expanded ? 'rotate(90deg)' : 'none', transition:'0.2s'}} />
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="px-4 pb-4 animate-fadeIn">
          {/* Items */}
          <div className="p-3 rounded-xl mb-3" style={{background:'rgba(255,255,255,0.04)'}}>
            <p className="text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>
              <Package size={10} className="inline mr-1" /> Order Items
            </p>
            <div className="space-y-1">
              {(order.items || []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="font-bold" style={{color:'#f9fafb'}}>{item.quantity}× {item.productName}</span>
                  <span className="font-bold" style={{color:'#fbbf24'}}>₹{item.lineTotal?.toFixed(0)}</span>
                </div>
              ))}
              {(!order.items || order.items.length === 0) && order.itemsSummary && (
                <p className="text-xs font-medium" style={{color:'#9ca3af'}}>{order.itemsSummary}</p>
              )}
            </div>
          </div>

          {/* Customer Info + Location */}
          <div className="p-3 rounded-xl mb-3" style={{background:'rgba(255,255,255,0.04)'}}>
            <p className="text-xs font-bold flex items-center gap-1 mb-2" style={{color:'#9ca3af'}}>
              <MapPin size={12} /> Delivery Location
            </p>
            <p className="text-sm font-bold" style={{color:'#f9fafb'}}>Jodimetla, Pocharam, Telangana</p>
            {order.customerPhone && (
              <a href={`tel:${order.customerPhone}`} className="mt-2 flex items-center gap-2 text-sm font-bold" style={{color:'#3b82f6'}}>
                <Phone size={14} /> {order.customerPhone}
              </a>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <a 
              href="https://maps.google.com/?q=Jodimetla,+Pocharam,+Telangana" 
              target="_blank" rel="noreferrer"
              className="btn btn-dark text-xs flex justify-center py-3"
            >
              <Navigation size={14} /> Navigate
            </a>
            
            {isPacking && (
              <button disabled className="btn btn-dark text-xs flex justify-center py-3 opacity-50">
                <Clock size={14} /> Waiting...
              </button>
            )}
            
            {isReady && (
              <button 
                onClick={() => onPickedUp(order.id)}
                className="btn btn-primary text-xs flex justify-center py-3"
              >
                <Bike size={14} /> Picked Up
              </button>
            )}

            {order.orderStatus === 'HANDED_OVER' && (
              <button disabled className="btn btn-green text-xs flex justify-center py-3">
                <CheckCircle size={14} /> Done
              </button>
            )}
          </div>

          {(isReady || isPacking) && (
            <button 
              onClick={() => onDelivered(order.id)}
              className="btn btn-green w-full mt-2 text-xs flex justify-center py-3"
            >
              <CheckCircle size={14} /> Mark Delivered
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function RiderView() {
  const [orders, setOrders] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [tab, setTab] = useState('active'); // 'active' | 'delivered'
  const [wsConnected, setWsConnected] = useState(false);

  const fetchOrders = () => {
    api.get('/api/orders/active')
      .then(r => setOrders(r.data))
      .catch(console.error);
  };

  useEffect(() => {
    fetchOrders();
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws-kitchen`),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe('/topic/orders', msg => {
          const incoming = JSON.parse(msg.body);
          setOrders(prev => [incoming, ...prev.filter(o => o.id !== incoming.id)]);
        });
        client.subscribe('/topic/orders/refresh', fetchOrders);
      },
      onDisconnect: () => setWsConnected(false),
    });
    client.activate();
    return () => client.deactivate();
  }, []);

  const markDelivered = async (id) => {
    await api.put(`/api/orders/${id}/status?status=HANDED_OVER`);
    fetchOrders();
  };

  const markPickedUp = async (id) => {
    // For now mark as READY (already is) — in production this would be a custom status
    await api.put(`/api/orders/${id}/status?status=READY`);
    fetchOrders();
  };

  const activeOrders = orders.filter(o => ['PLACED','PACKING','READY'].includes(o.orderStatus));
  const deliveredOrders = orders.filter(o => o.orderStatus === 'HANDED_OVER');
  const displayOrders = tab === 'active' ? activeOrders : deliveredOrders;

  return (
    <main className="min-h-screen pb-24" style={{background:'#0a0f1a'}}>
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-30 px-4 pt-4 pb-3" style={{background:'linear-gradient(180deg,#0a0f1a,rgba(10,15,26,0.95))',backdropFilter:'blur(20px)'}}>
          <div className="flex items-center justify-between mb-4 animate-fadeInUp">
            <div>
              <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
              <h1 className="text-xl font-black flex items-center gap-2" style={{color:'#f9fafb'}}>
                🛵 Rider Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{background: wsConnected ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}}>
                <div className={wsConnected ? 'live-dot' : ''} style={{width:6,height:6,borderRadius:'50%',background: wsConnected ? '#10b981' : '#ef4444'}} />
                <span className="text-[10px] font-bold" style={{color: wsConnected ? '#10b981' : '#ef4444'}}>
                  {wsConnected ? 'LIVE' : 'OFF'}
                </span>
              </div>
              <button onClick={fetchOrders} className="p-2 rounded-xl" style={{background:'rgba(255,255,255,0.06)'}}>
                <RefreshCw size={14} style={{color:'#9ca3af'}} />
              </button>
            </div>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="text-center p-2 rounded-xl" style={{background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.15)'}}>
              <p className="text-lg font-black" style={{color:'#fbbf24'}}>{activeOrders.length}</p>
              <p className="text-[10px] font-bold" style={{color:'#9ca3af'}}>Active</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{background:'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.15)'}}>
              <p className="text-lg font-black" style={{color:'#34d399'}}>{orders.filter(o=>o.orderStatus==='READY').length}</p>
              <p className="text-[10px] font-bold" style={{color:'#9ca3af'}}>Ready</p>
            </div>
            <div className="text-center p-2 rounded-xl" style={{background:'rgba(168,85,247,0.08)', border:'1px solid rgba(168,85,247,0.15)'}}>
              <p className="text-lg font-black" style={{color:'#c084fc'}}>{deliveredOrders.length}</p>
              <p className="text-[10px] font-bold" style={{color:'#9ca3af'}}>Done</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex rounded-xl p-1" style={{background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.06)'}}>
            <button 
              onClick={() => setTab('active')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab === 'active' ? 'bg-amber-500 text-gray-900' : 'text-gray-400'}`}
            >
              📦 Active ({activeOrders.length})
            </button>
            <button 
              onClick={() => setTab('delivered')}
              className={`flex-1 text-xs font-bold py-2 rounded-lg transition-colors ${tab === 'delivered' ? 'bg-green-500 text-gray-900' : 'text-gray-400'}`}
            >
              ✅ Delivered ({deliveredOrders.length})
            </button>
          </div>
        </div>

        {/* Orders List */}
        <div className="px-4 space-y-3 mt-2">
          {displayOrders.length === 0 ? (
            <div className="text-center py-16 animate-fadeIn">
              <p className="text-5xl mb-3">{tab === 'active' ? '😴' : '📭'}</p>
              <p className="text-sm font-bold" style={{color:'#9ca3af'}}>
                {tab === 'active' ? 'No active deliveries right now.' : 'No deliveries completed yet today.'}
              </p>
            </div>
          ) : (
            displayOrders.map(o => (
              <DeliveryCard
                key={o.id}
                order={o}
                expanded={expandedId === o.id}
                onExpand={() => setExpandedId(expandedId === o.id ? null : o.id)}
                onAccept={() => {}}
                onPickedUp={markPickedUp}
                onDelivered={markDelivered}
              />
            ))
          )}
        </div>
      </div>
    </main>
  );
}
