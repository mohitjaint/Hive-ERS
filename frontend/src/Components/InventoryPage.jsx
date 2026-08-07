import { useEffect, useState, useRef } from 'react';
import { inventoryApi, transactionsApi, storageApi } from '../lib/api';
import { useMember, useIsManager, useIsCoordinator } from '../lib/MemberContext';
import {
  Search, Plus, X, Loader2, Package, Edit2, Trash2, ShieldAlert,
  ChevronDown, Upload, AlertCircle
} from 'lucide-react';

/* ─── helpers ─────────────────────────────────────────────────────────────── */
function StatusBadge({ item }) {
  if (!item.policy?.allowedToTake) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-red-900/30 text-red-400 border-red-800/40">RESTRICTED</span>
  );
  if (item.availableQuantity === 0) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-gray-800 text-gray-500 border-gray-700">OUT OF STOCK</span>
  );
  if (item.availableQuantity <= 3) return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-amber-900/30 text-amber-400 border-amber-800/40">LIMITED</span>
  );
  return (
    <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-emerald-900/30 text-emerald-400 border-emerald-800/40">AVAILABLE</span>
  );
}

/* ─── Borrow Modal ─────────────────────────────────────────────────────────── */
function BorrowModal({ item, onClose, onSuccess }) {
  const [qty, setQty] = useState(1);
  const [returnDate, setReturnDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const maxQty = item.policy?.maxQuantityPerMember
    ? Math.min(item.availableQuantity, item.policy.maxQuantityPerMember)
    : item.availableQuantity;

  const submit = async () => {
    if (!item.isConsumable && !returnDate) return setError('Please select a return date');
    setLoading(true); setError('');
    try {
      const payload = { items: [{ item: item._id, quantity: qty }] };
      if (!item.isConsumable) payload.expectedReturnDate = returnDate;
      await transactionsApi.request(payload);
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-heading font-bold text-lg">Borrow Item</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-gray-800">
            {item.image
              ? <img src={item.image} alt={item.name} className="h-14 w-14 rounded-lg object-cover" />
              : <div className="h-14 w-14 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={20} className="text-gray-600" /></div>}
            <div>
              <p className="text-heading font-semibold">{item.name}</p>
              <p className="text-gray-500 text-xs">{item.category} · {item.availableQuantity} available</p>
              {item.policy?.maxDurationDays && (
                <p className="text-amber-400 text-xs mt-0.5">Max {item.policy.maxDurationDays} day(s)</p>
              )}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Quantity (max {maxQty})</label>
            <input type="number" min={1} max={maxQty} value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value))))}
              className="w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
          </div>
          {!item.isConsumable && (
            <div>
              <label className="text-xs text-gray-400 block mb-1">Expected Return Date</label>
              <input type="date" min={minDateStr} value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                className="w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
            </div>
          )}
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Item Form Modal (add / edit) ─────────────────────────────────────────── */
function ItemFormModal({ item, onClose, onSuccess }) {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    category: item?.category || '',
    isConsumable: item?.isConsumable ?? false,
    totalQuantity: item?.totalQuantity ?? '',
    availableQuantity: item?.availableQuantity ?? '',
    damagedQuantity: item?.damagedQuantity ?? 0,
    storageId: item?.storageId?._id || '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(item?.image || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storages, setStorages] = useState([]);

  useEffect(() => {
    storageApi.getAll().then(res => setStorages(res.data || [])).catch(() => {});
  }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const pickImage = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!form.name || !form.description || !form.category || form.totalQuantity === '') {
      return setError('All fields are required');
    }
    if (!isEdit && !imageFile) return setError('Image is required');
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => v !== '' && fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);
      if (isEdit) {
        await inventoryApi.update(item._id, fd);
      } else {
        await inventoryApi.create(fd);
      }
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <h3 className="text-heading font-bold text-lg">{isEdit ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-3 overflow-y-auto flex-1">
          {/* Image upload */}
          <label className="block w-full cursor-pointer">
            <div className="h-36 rounded-xl border-2 border-dashed border-gray-700 hover:border-gold/50 transition-colors flex items-center justify-center overflow-hidden bg-bg">
              {preview
                ? <img src={preview} alt="preview" className="h-full w-full object-cover rounded-xl" />
                : <div className="flex flex-col items-center gap-2 text-gray-600"><Upload size={28} /><span className="text-xs">Click to upload image</span></div>}
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={pickImage} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Name</label><input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Category</label><input className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value)} /></div>
          </div>
          <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-gray-800">
            <div>
              <p className="text-heading text-sm font-medium">Consumable Item</p>
              <p className="text-gray-500 text-[10px]">Item is given permanently, not returned</p>
            </div>
            <button type="button" onClick={() => set('isConsumable', !form.isConsumable)}
              className={`w-10 h-5 rounded-full transition-colors relative ${form.isConsumable ? 'bg-gold' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${form.isConsumable ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          <div><label className="text-xs text-gray-400 block mb-1">Description</label><textarea className={inputCls} rows={2} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Total Qty</label><input type="number" className={inputCls} value={form.totalQuantity} onChange={(e) => set('totalQuantity', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Available</label><input type="number" className={inputCls} value={form.availableQuantity} onChange={(e) => set('availableQuantity', e.target.value)} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Damaged</label><input type="number" className={inputCls} value={form.damagedQuantity} onChange={(e) => set('damagedQuantity', e.target.value)} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Storage Box</label>
            <select className={inputCls} value={form.storageId} onChange={(e) => set('storageId', e.target.value)}>
              <option value="">No Storage Assigned</option>
              {storages.map(s => (
                <option key={s._id} value={s._id}>
                  Box #{s.storageNumber} {s.name ? `- ${s.name}` : ''}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Item'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Policy Modal ─────────────────────────────────────────────────────────── */
function PolicyModal({ item, onClose, onSuccess }) {
  const [form, setForm] = useState({
    allowedToTake: item?.policy?.allowedToTake ?? true,
    maxQuantityPerMember: item?.policy?.maxQuantityPerMember ?? '',
    maxDurationDays: item?.policy?.maxDurationDays ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await inventoryApi.setPolicy(item._id, {
        allowedToTake: form.allowedToTake,
        maxQuantityPerMember: form.maxQuantityPerMember === '' ? null : Number(form.maxQuantityPerMember),
        maxDurationDays: form.maxDurationDays === '' ? null : Number(form.maxDurationDays),
      });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h3 className="text-heading font-bold text-lg">Set Policy</h3>
            <p className="text-gray-500 text-xs mt-0.5">{item.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between p-3 bg-bg rounded-xl border border-gray-800">
            <div>
              <p className="text-heading text-sm font-medium">Allow Borrowing</p>
              <p className="text-gray-500 text-xs">Members can request this item</p>
            </div>
            <button onClick={() => setForm((f) => ({ ...f, allowedToTake: !f.allowedToTake }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.allowedToTake ? 'bg-gold' : 'bg-gray-700'}`}>
              <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.allowedToTake ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max Quantity Per Member <span className="text-gray-600">(leave blank = no limit)</span></label>
            <input type="number" min={1} className={inputCls} value={form.maxQuantityPerMember}
              onChange={(e) => setForm((f) => ({ ...f, maxQuantityPerMember: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Max Borrow Duration (days) <span className="text-gray-600">(leave blank = no limit)</span></label>
            <input type="number" min={1} className={inputCls} value={form.maxDurationDays}
              onChange={(e) => setForm((f) => ({ ...f, maxDurationDays: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Save Policy
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Item Card ─────────────────────────────────────────────────────────────── */
function ItemCard({ item, isManager, isCoordinator, onBorrow, onEdit, onDelete, onPolicy }) {
  const canBorrow = item.policy?.allowedToTake && item.availableQuantity > 0;

  return (
    <div className="flex flex-col rounded-xl border border-gray-800 bg-surface hover:border-gold/30 transition-colors group">
      <div className="h-44 rounded-t-xl overflow-hidden bg-gray-900 border-b border-gray-800">
        {item.image
          ? <img src={item.image} alt={item.name} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="h-full flex items-center justify-center"><Package size={40} className="text-gray-700" /></div>}
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-heading font-semibold text-sm truncate flex items-center gap-2">
              {item.name}
              {item.isConsumable && <span className="bg-blue-900/40 text-blue-400 border border-blue-800/40 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider">CONSUMABLE</span>}
            </h3>
            <p className="text-gray-500 text-xs mt-0.5 truncate">{item.category}</p>
          </div>
          <StatusBadge item={item} />
        </div>
        <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">{item.description}</p>
        
        {item.storageId && (
          <div className="text-[11px] text-gray-400 bg-gray-800/50 px-2 py-1.5 rounded-lg border border-gray-800 flex items-center gap-1.5">
            <Package size={12} className="text-gold" />
            <span>Box #{item.storageId.storageNumber}{item.storageId.name ? ` - ${item.storageId.name}` : ''}</span>
          </div>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-t border-gray-800 pt-2">
          <span>Available: <span className="text-heading">{item.availableQuantity}</span></span>
          <span>Total: {item.totalQuantity}</span>
        </div>
        {/* Policy info */}
        {(item.policy?.maxQuantityPerMember || item.policy?.maxDurationDays) && (
          <div className="text-[10px] text-amber-500/80 bg-amber-900/10 rounded-lg px-2 py-1.5 border border-amber-900/20 space-y-0.5">
            {item.policy.maxQuantityPerMember && <p>Limit: {item.policy.maxQuantityPerMember} per member</p>}
            {item.policy.maxDurationDays && <p>Max: {item.policy.maxDurationDays} day(s)</p>}
          </div>
        )}
        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          {isManager && (
            <>
              <button onClick={() => onEdit(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors"><Edit2 size={13} /></button>
              <button onClick={() => onDelete(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
            </>
          )}
          {isCoordinator && (
            <button onClick={() => onPolicy(item)} className="p-2 rounded-lg border border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors" title="Set Policy"><ShieldAlert size={13} /></button>
          )}
          <button onClick={() => canBorrow && onBorrow(item)} disabled={!canBorrow}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-xs hover:bg-gold/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            {canBorrow ? 'Borrow' : 'Unavailable'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function InventoryPage() {
  const { member } = useMember();
  const isManager = useIsManager();
  const isCoordinator = useIsCoordinator();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [borrowItem, setBorrowItem] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [policyItem, setPolicyItem] = useState(null);
  const [toast, setToast] = useState('');

  const fetchItems = () => {
    setLoading(true);
    const params = {};
    if (search) params.search = search;
    if (category) params.category = category;
    inventoryApi.getAll(params)
      .then((res) => { setItems(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchItems(); }, [search, category]);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDelete = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try {
      await inventoryApi.delete(item._id);
      showToast('Item deleted');
      fetchItems();
    } catch (e) { alert(e.message); }
  };

  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-8 flex flex-col gap-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Modals */}
      {borrowItem && (
        <BorrowModal item={borrowItem} onClose={() => setBorrowItem(null)}
          onSuccess={() => { setBorrowItem(null); showToast('Request submitted!'); }} />
      )}
      {(showAddForm || editItem) && (
        <ItemFormModal item={editItem || null} onClose={() => { setEditItem(null); setShowAddForm(false); }}
          onSuccess={() => { setEditItem(null); setShowAddForm(false); showToast(editItem ? 'Item updated!' : 'Item added!'); fetchItems(); }} />
      )}
      {policyItem && (
        <PolicyModal item={policyItem} onClose={() => setPolicyItem(null)}
          onSuccess={() => { setPolicyItem(null); showToast('Policy updated!'); fetchItems(); }} />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Inventory</h1>
          <p className="text-gray-500 text-sm mt-0.5">Browse and borrow items</p>
        </div>
        {isManager && (
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-black font-bold text-sm rounded-lg hover:bg-gold/90 transition-colors self-start sm:self-auto">
            <Plus size={16} /> Add Item
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 flex-1 bg-surface border border-gray-800 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-500 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inventory..."
            className="flex-1 bg-transparent text-sm text-heading placeholder:text-gray-600 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400"><X size={14} /></button>}
        </div>
        {categories.length > 0 && (
          <div className="relative">
            <select value={category} onChange={(e) => setCategory(e.target.value)}
              className="appearance-none bg-surface border border-gray-800 rounded-lg px-3 py-2 pr-8 text-sm text-heading focus:outline-none focus:border-gold">
              <option value="">All Categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={13} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" /><span className="text-sm">Loading inventory...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <Package size={40} className="text-gray-800" />
          <p className="text-sm">No items found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
          {items.map((item) => (
            <ItemCard key={item._id} item={item}
              isManager={isManager} isCoordinator={isCoordinator}
              onBorrow={setBorrowItem} onEdit={setEditItem}
              onDelete={handleDelete} onPolicy={setPolicyItem} />
          ))}
        </div>
      )}
    </div>
  );
}
