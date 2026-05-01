import { useEffect, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { ChefHat, ShoppingBag } from 'lucide-react';
import { api, API_BASE } from '../api';

export default function QueueView() {
  const [orders, setOrders] = useState([]);

  const fetch = async () => {
    const res = await api.get('/api/orders/active');
    setOrders(res.data);
  };

  useEffect(() => {
    fetch();
    const client = new Client({
      webSocketFactory: () => new SockJS(`${API_BASE}/ws-kitchen`),
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe('/topic/orders', msg => {
          const incoming = JSON.parse(msg.body);
          setOrders(prev => [incoming, ...prev.filter(o => o.id !== incoming.id)]);
        });
        client.subscribe('/topic/orders/refresh', fetch);
      },
    });
    client.activate();
    return () => client.deactivate();
  }, []);

  const packing = orders.filter(o => o.orderStatus === 'PACKING');
  const ready   = orders.filter(o => o.orderStatus === 'READY');

  return (
    <main className="flex h-screen overflow-hidden" style={{background:'#050810',fontFamily:'Inter,sans-serif'}}>
      {/* ── Packing Column ── */}
      <section className="flex flex-col w-1/2" style={{borderRight:'3px solid rgba(245,158,11,0.2)'}}>
        <header className="flex items-center justify-center gap-3 p-6 flex-shrink-0" style={{background:'linear-gradient(180deg,#111827,#0d1320)',borderBottom:'1px solid rgba(245,158,11,0.15)'}}>
          <ChefHat size={32} style={{color:'#f59e0b'}} />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Packing</h1>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#78716c'}}>{packing.length} order{packing.length!==1?'s':''}</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 gap-4 content-start" style={{scrollbarWidth:'none'}}>
          {packing.map(o => (
            <div
              key={o.id}
              className="queue-token flex flex-col items-center justify-center rounded-3xl p-6 text-center"
              style={{background:'rgba(245,158,11,0.08)',border:'2px solid rgba(245,158,11,0.25)',minHeight:120}}
            >
              <span className="text-5xl font-black" style={{color:'#fbbf24',letterSpacing:'-0.02em'}}>{o.tokenNumber}</span>
              <span className="text-xs font-bold mt-1 truncate w-full" style={{color:'#78716c'}}>{o.customerName}</span>
            </div>
          ))}
          {packing.length === 0 && (
            <div className="col-span-2 flex flex-col items-center justify-center py-16" style={{color:'#374151'}}>
              <ChefHat size={48} style={{marginBottom:12,opacity:0.3}} />
              <p className="font-black text-xl">All packed!</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Ready Column ── */}
      <section className="flex flex-col w-1/2" style={{background:'#060d0a'}}>
        <header className="flex items-center justify-center gap-3 p-6 flex-shrink-0" style={{background:'linear-gradient(180deg,#052115,#040e0a)',borderBottom:'1px solid rgba(16,185,129,0.15)'}}>
          <ShoppingBag size={32} style={{color:'#10b981'}} />
          <div>
            <h1 className="text-3xl font-black uppercase tracking-widest" style={{color:'#10b981'}}>Collect</h1>
            <p className="text-xs font-bold uppercase tracking-wider" style={{color:'#065f46'}}>{ready.length} ready</p>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4" style={{scrollbarWidth:'none'}}>
          {ready.map(o => (
            <div
              key={o.id}
              className="queue-token flex flex-col items-center justify-center rounded-3xl p-6 text-center"
              style={{background:'rgba(16,185,129,0.12)',border:'3px solid rgba(16,185,129,0.35)',boxShadow:'0 0 40px rgba(16,185,129,0.15)',minHeight:130}}
            >
              <span className="text-7xl font-black" style={{color:'#34d399',letterSpacing:'-0.02em',lineHeight:1}}>{o.tokenNumber}</span>
              <span className="text-sm font-bold mt-2" style={{color:'#6ee7b7'}}>{o.customerName}</span>
            </div>
          ))}
          {ready.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16" style={{color:'#064e3b'}}>
              <ShoppingBag size={48} style={{marginBottom:12,opacity:0.3}} />
              <p className="font-black text-xl">None ready yet</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
