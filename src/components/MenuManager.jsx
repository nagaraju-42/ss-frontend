import { useEffect, useRef, useState } from 'react';
import { Camera, Edit2, Image, Plus, Power, RefreshCw, Save, Trash2, Upload, X } from 'lucide-react';
import { api } from '../api';

const CATEGORIES = ['Cakes','Pastries','Puffs','Breads','Cookies','Drinks','Specials'];
const BLANK = { name:'', price:'', category:'Cakes', imageUrl:'', description:'', stockQuantity:50 };

/* ── Local image upload hook ─────────────────────────────────────────── */
function useLocalImage(initial='') {
  const [preview, setPreview] = useState(initial);
  const fileRef = useRef(null);

  const pick = () => fileRef.current?.click();

  const onChange = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Store as base64 data-URL so it works locally without a server
    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  return { preview, setPreview, pick, fileRef, onChange };
}

/* ── Add / Edit Item Form ────────────────────────────────────────────── */
function ItemForm({ initial=BLANK, onSave, onCancel, busy }) {
  const [form, setForm] = useState(initial);
  const { preview, setPreview, pick, fileRef, onChange } = useLocalImage(initial.imageUrl);

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  const submit = e => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    onSave({
      ...form,
      price: Number(form.price),
      stockQuantity: Number(form.stockQuantity||0),
      imageUrl: preview || form.imageUrl,
      inStock: true,
    });
  };

  return (
    <form onSubmit={submit} className="glass-card p-5 animate-fadeInUp">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-base" style={{color:'#f9fafb'}}>{initial.id ? 'Edit Item' : 'Add New Item'}</h3>
        {onCancel && <button type="button" onClick={onCancel}><X size={18} style={{color:'#6b7280'}} /></button>}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Image upload area */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Product Image</label>
          <div
            className="relative rounded-2xl overflow-hidden cursor-pointer flex items-center justify-center"
            style={{height:140, background: preview ? 'transparent' : 'rgba(255,255,255,0.04)', border:'2px dashed rgba(255,255,255,0.12)'}}
            onClick={pick}
          >
            {preview ? (
              <>
                <img src={preview} alt="preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity" style={{background:'rgba(0,0,0,0.6)'}}>
                  <Camera size={24} style={{color:'#fff'}} />
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <Upload size={28} style={{color:'#4b5563',margin:'0 auto 8px'}} />
                <p className="text-sm font-bold" style={{color:'#6b7280'}}>Click to upload photo</p>
                <p className="text-xs mt-1" style={{color:'#4b5563'}}>or paste URL below</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
          <input
            value={typeof preview === 'string' && !preview.startsWith('data:') ? preview : (form.imageUrl||'')}
            onChange={e => { set('imageUrl', e.target.value); setPreview(e.target.value); }}
            placeholder="https://... or leave empty if uploaded"
            className="field mt-2 text-sm"
            id="item-image-url"
          />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Item Name *</label>
          <input value={form.name} onChange={e => set('name',e.target.value)} placeholder="e.g. Chocolate Truffle Cake" className="field" required id="item-name" />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Price (₹) *</label>
          <input type="number" value={form.price} onChange={e => set('price',e.target.value)} placeholder="0" className="field" required min={0} id="item-price" />
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Category</label>
          <select value={form.category} onChange={e => set('category',e.target.value)} className="field" id="item-category">
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Stock Quantity</label>
          <input type="number" value={form.stockQuantity} onChange={e => set('stockQuantity',e.target.value)} className="field" min={0} id="item-stock" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-black uppercase tracking-wider mb-2" style={{color:'#9ca3af'}}>Description</label>
          <input value={form.description} onChange={e => set('description',e.target.value)} placeholder="Short description for customers" className="field" id="item-description" />
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={busy} className="btn btn-primary flex-1" id="save-item-btn">
          {busy ? <span className="spinner" /> : <Save size={16} />}
          {initial.id ? 'Save Changes' : 'Add Item'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn btn-ghost" id="cancel-item-btn">Cancel</button>
        )}
      </div>
    </form>
  );
}

/* ── Main MenuManager ────────────────────────────────────────────────── */
export default function MenuManager() {
  const [products, setProducts]     = useState([]);
  const [showForm, setShowForm]     = useState(false);
  const [editItem, setEditItem]     = useState(null);
  const [busy, setBusy]             = useState(false);
  const [filterCat, setFilterCat]   = useState('All');
  const [search, setSearch]         = useState('');

  const load = async () => {
    const res = await api.get('/api/products');
    setProducts(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (data) => {
    setBusy(true);
    try { await api.post('/api/products', data); setShowForm(false); load(); }
    finally { setBusy(false); }
  };

  const handleEdit = async (data) => {
    if (!editItem) return;
    setBusy(true);
    try { await api.put(`/api/products/${editItem.id}`, data); setEditItem(null); load(); }
    finally { setBusy(false); }
  };

  const handleToggle = async (id) => {
    await api.patch(`/api/products/${id}/toggle`);
    load();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this item permanently?')) return;
    await api.delete(`/api/products/${id}`);
    load();
  };

  const cats = ['All', ...CATEGORIES];
  const filtered = products.filter(p => {
    const matchCat = filterCat === 'All' || p.category === filterCat;
    const text = `${p.name} ${p.description||''}`.toLowerCase();
    return matchCat && text.includes(search.toLowerCase());
  });

  return (
    <main className="min-h-screen p-4" style={{background:'#0a0f1a'}}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 animate-fadeInUp">
          <div>
            <p className="text-xs font-black uppercase tracking-widest" style={{color:'#f59e0b'}}>Softy Bakeries</p>
            <h1 className="text-2xl font-black" style={{color:'#f9fafb'}}>Menu Manager</h1>
            <p className="text-sm mt-0.5" style={{color:'#6b7280'}}>{products.length} items in catalog</p>
          </div>
          <div className="flex gap-2">
            <button onClick={load} className="p-2.5 rounded-xl" style={{background:'rgba(255,255,255,0.06)',border:'1px solid rgba(255,255,255,0.1)',color:'#9ca3af'}} id="refresh-menu-btn">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => { setShowForm(v => !v); setEditItem(null); }} className="btn btn-primary" id="add-item-btn">
              {showForm ? <X size={16} /> : <Plus size={16} />}
              {showForm ? 'Cancel' : 'Add Item'}
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showForm && !editItem && (
          <div className="mb-6">
            <ItemForm onSave={handleAdd} onCancel={() => setShowForm(false)} busy={busy} />
          </div>
        )}

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4" style={{scrollbarWidth:'none'}}>
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)} className={`cat-pill ${c===filterCat?'active':'inactive'}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search items..."
            className="field"
            id="menu-search"
          />
        </div>

        {/* Edit form (inline) */}
        {editItem && (
          <div className="mb-6">
            <ItemForm initial={editItem} onSave={handleEdit} onCancel={() => setEditItem(null)} busy={busy} />
          </div>
        )}

        {/* Products grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item, i) => (
            <div
              key={item.id}
              className="product-card animate-fadeInUp"
              style={{animationDelay:`${i*0.04}s`}}
            >
              {/* Image */}
              <div className="relative h-36">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => { e.target.style.display='none'; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl" style={{background:'rgba(255,255,255,0.04)'}}>
                    <Image size={32} style={{color:'#374151'}} />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleToggle(item.id)}
                    className={`p-1.5 rounded-lg ${item.inStock ? 'badge-green' : 'badge-red'}`}
                    title={item.inStock ? 'In Stock — click to mark sold out' : 'Sold Out — click to restock'}
                    id={`toggle-${item.id}`}
                  >
                    <Power size={12} />
                  </button>
                </div>
                {!item.inStock && (
                  <div className="absolute inset-0 flex items-center justify-center" style={{background:'rgba(0,0,0,0.65)'}}>
                    <span className="badge badge-red">Sold Out</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-sm truncate" style={{color:'#f9fafb'}}>{item.name}</p>
                    <p className="text-xs font-medium truncate" style={{color:'#6b7280'}}>{item.description}</p>
                  </div>
                  <span className="font-black text-base flex-shrink-0" style={{color:'#fbbf24'}}>₹{item.price.toFixed(0)}</span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-1">
                    <span className="badge badge-amber">{item.category}</span>
                    <span className="badge badge-purple">Qty {item.stockQuantity ?? '∞'}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditItem(item); setShowForm(false); }} className="p-1.5 rounded-lg" style={{background:'rgba(255,255,255,0.06)'}} id={`edit-${item.id}`}>
                      <Edit2 size={12} style={{color:'#9ca3af'}} />
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg" style={{background:'rgba(239,68,68,0.08)'}} id={`delete-${item.id}`}>
                      <Trash2 size={12} style={{color:'#f87171'}} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-5xl mb-3">🍰</p>
            <p className="font-black text-lg" style={{color:'#374151'}}>No items found</p>
          </div>
        )}
      </div>
    </main>
  );
}
