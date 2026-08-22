import { useEffect, useState } from 'react';
import { storageApi } from '../lib/api';
import { useIsManager, useIsCoordinator } from '../lib/MemberContext';
import {
  Search, Plus, X, Loader2, Package, Edit2, Trash2, AlertCircle
} from 'lucide-react';

function StorageFormModal({ storage, onClose, onSuccess }) {
  const isEdit = !!storage;
  const [form, setForm] = useState({
    storageNumber: storage?.storageNumber ?? '',
    name: storage?.name || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (form.storageNumber === '') return setError('Storage Box Number is required');
    setLoading(true); setError('');
    try {
      if (isEdit) {
        await storageApi.update(storage._id, {
          storageNumber: Number(form.storageNumber),
          name: form.name
        });
      } else {
        await storageApi.create({
          storageNumber: Number(form.storageNumber),
          name: form.name
        });
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
      <div className="w-full max-w-md bg-surface rounded-2xl border border-gray-800 shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-heading font-bold text-lg">{isEdit ? 'Edit Storage Box' : 'Add Storage Box'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-gray-400 block mb-1">Storage Box Number</label>
            <input type="number" className={inputCls} value={form.storageNumber}
              onChange={(e) => setForm(f => ({ ...f, storageNumber: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Storage Name (Optional)</label>
            <input className={inputCls} value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500 transition-colors">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm hover:bg-gold/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            {isEdit ? 'Save Changes' : 'Create Storage'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StoragePage() {
  const isManager = useIsManager();
  const isCoordinator = useIsCoordinator();

  const [storages, setStorages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  
  const [editStorage, setEditStorage] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toast, setToast] = useState('');

  const fetchStorages = () => {
    setLoading(true);
    storageApi.getAll()
      .then((res) => { setStorages(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!active) return;
      setLoading(true);
      try {
        const res = await storageApi.getAll();
        if (active) {
          setStorages(res.data || []);
          setError('');
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleDelete = async (storage) => {
    if (!confirm(`Delete Box #${storage.storageNumber}? This will unlink items from this box.`)) return;
    try {
      await storageApi.delete(storage._id);
      showToast('Storage deleted');
      fetchStorages();
    } catch (e) { alert(e.message); }
  };

  const filtered = storages.filter(s => 
    String(s.storageNumber).includes(search) || 
    (s.name && s.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-8 flex flex-col gap-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {(showAddForm || editStorage) && (
        <StorageFormModal storage={editStorage || null} onClose={() => { setEditStorage(null); setShowAddForm(false); }}
          onSuccess={() => { setEditStorage(null); setShowAddForm(false); showToast(editStorage ? 'Storage updated!' : 'Storage added!'); fetchStorages(); }} />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading">Storage Boxes</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage physical storage locations</p>
        </div>
        {(isManager || isCoordinator) && (
          <button onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gold text-black font-bold text-sm rounded-lg hover:bg-gold/90 transition-colors self-start sm:self-auto">
            <Plus size={16} /> Add Storage
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 max-w-md bg-surface border border-gray-800 rounded-lg px-3 py-2">
          <Search size={15} className="text-gray-500 shrink-0" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search storages..."
            className="flex-1 bg-transparent text-sm text-heading placeholder:text-gray-600 focus:outline-none" />
          {search && <button onClick={() => setSearch('')} className="text-gray-600 hover:text-gray-400"><X size={14} /></button>}
        </div>
      </div>

      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" /><span className="text-sm">Loading storages...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-3">
          <Package size={40} className="text-gray-800" />
          <p className="text-sm">No storage boxes found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
          {filtered.map((s) => (
            <div key={s._id} className="flex flex-col p-4 rounded-xl border border-gray-800 bg-surface hover:border-gold/30 transition-colors group">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-gray-900 border border-gray-800 rounded-lg flex items-center justify-center">
                    <Package size={20} className="text-gold" />
                  </div>
                  <div>
                    <h3 className="text-heading font-semibold text-sm">Box #{s.storageNumber}</h3>
                    {s.name && <p className="text-gray-500 text-xs mt-0.5 truncate max-w-[120px]">{s.name}</p>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-auto pt-3 border-t border-gray-800">
                {(isManager || isCoordinator) && (
                  <>
                    <button onClick={() => setEditStorage(s)} className="flex-1 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-gold/50 hover:text-gold transition-colors text-xs flex items-center justify-center gap-1.5">
                      <Edit2 size={12} /> Edit
                    </button>
                    <button onClick={() => handleDelete(s)} className="flex-1 py-1.5 rounded-lg border border-gray-700 text-gray-400 hover:border-red-500/50 hover:text-red-400 transition-colors text-xs flex items-center justify-center gap-1.5">
                      <Trash2 size={12} /> Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
