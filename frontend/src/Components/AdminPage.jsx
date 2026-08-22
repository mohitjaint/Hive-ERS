import { useEffect, useState } from 'react';
import { transactionsApi, membersApi } from '../lib/api';
import { useMember, useIsCoordinator, useIsManager } from '../lib/MemberContext';
import {
  Loader2, CheckCircle, XCircle, RotateCcw, Users, Package,
  AlertCircle, ShieldCheck, UserCheck, UserX, X
} from 'lucide-react';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
function StatusBadge({ status }) {
  const map = {
    pending:  'bg-amber-900/30 text-amber-400 border-amber-800/40',
    approved: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
    rejected: 'bg-red-900/30 text-red-400 border-red-800/40',
    returned: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40',
    overdue:  'bg-red-900/30 text-red-400 border-red-800/40',
    completed: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/40',
  };
  return (
    <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${map[status] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {status?.toUpperCase()}
    </span>
  );
}

function RoleBadge({ role }) {
  const map = {
    coordinator: 'bg-purple-900/30 text-purple-400 border-purple-800/40',
    inventory_manager: 'bg-blue-900/30 text-blue-400 border-blue-800/40',
    member: 'bg-gray-800 text-gray-400 border-gray-700',
  };
  const labels = { coordinator: 'Coordinator', inventory_manager: 'Inv. Manager', member: 'Member' };
  return (
    <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${map[role] || 'bg-gray-800 text-gray-400 border-gray-700'}`}>
      {labels[role] || role}
    </span>
  );
}

/* ─── Return Modal ──────────────────────────────────────────────────────────── */
function ReturnModal({ tx, onClose, onSuccess }) {
  const [remarks, setRemarks] = useState(
    tx.items.map((i) => ({ itemId: i.item?._id || i.item, damagedQuantity: 0, remarks: '' }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const update = (idx, key, val) => {
    setRemarks((r) => r.map((row, i) => i === idx ? { ...row, [key]: val } : row));
  };

  const submit = async () => {
    setLoading(true); setError('');
    try {
      await transactionsApi.return(tx._id, { itemRemarks: remarks });
      onSuccess();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-surface rounded-2xl border border-gray-800 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800 shrink-0">
          <h3 className="text-heading font-bold text-lg">Process Return</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <p className="text-gray-400 text-sm">Requested by: <span className="text-heading font-medium">{tx.requestedBy?.name}</span></p>
          {tx.items.map((entry, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-bg border border-gray-800 space-y-2">
              <div className="flex items-center gap-3">
                {entry.item?.image
                  ? <img src={entry.item.image} alt={entry.item.name} className="h-10 w-10 rounded-lg object-cover" />
                  : <div className="h-10 w-10 rounded-lg bg-gray-800 flex items-center justify-center"><Package size={16} className="text-gray-600" /></div>}
                <div>
                  <p className="text-heading text-sm font-medium">{entry.item?.name}</p>
                  <p className="text-gray-500 text-xs">Qty borrowed: {entry.quantity}</p>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Damaged quantity (0–{entry.quantity})</label>
                <input type="number" min={0} max={entry.quantity} value={remarks[idx]?.damagedQuantity}
                  onChange={(e) => update(idx, 'damagedQuantity', Number(e.target.value))}
                  className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-xs text-gray-400 block mb-1">Remarks (optional)</label>
                <input type="text" placeholder="e.g. Minor scratch on PCB" value={remarks[idx]?.remarks}
                  onChange={(e) => update(idx, 'remarks', e.target.value)}
                  className="w-full bg-surface border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold" />
              </div>
            </div>
          ))}
          {error && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{error}</p>}
        </div>
        <div className="flex gap-3 p-5 border-t border-gray-800 shrink-0">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:border-gray-500">Cancel</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Confirm Return
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Transaction management tab ───────────────────────────────────────────── */
function TransactionsTab({ isManager, isCoordinator }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [returnTx, setReturnTx] = useState(null);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetch = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    transactionsApi.getAll(params)
      .then((res) => { setTransactions(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!active) return;
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      try {
        const res = await transactionsApi.getAll(params);
        if (active) {
          setTransactions(res.data || []);
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
  }, [statusFilter]);

  const approve = async (tx) => {
    try { await transactionsApi.approve(tx._id); showToast('Approved!'); fetch(); }
    catch (e) { alert(e.message); }
  };

  const reject = async (tx) => {
    if (!confirm('Reject this request?')) return;
    try { await transactionsApi.reject(tx._id); showToast('Rejected'); fetch(); }
    catch (e) { alert(e.message); }
  };

  const markOverdue = async () => {
    try { const r = await transactionsApi.markOverdue(); showToast(r.message); fetch(); }
    catch (e) { alert(e.message); }
  };

  const STATUS_TABS = ['pending', 'approved', 'returned', 'overdue', 'rejected', ''];

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}
      {returnTx && (
        <ReturnModal tx={returnTx} onClose={() => setReturnTx(null)}
          onSuccess={() => { setReturnTx(null); showToast('Items returned!'); fetch(); }} />
      )}

      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((s) => (
            <button key={s || 'all'} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${statusFilter === s ? 'bg-gold text-black border-gold' : 'bg-surface border-gray-800 text-gray-400 hover:border-gray-600'}`}>
              {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All'}
            </button>
          ))}
        </div>
        {isCoordinator && (
          <button onClick={markOverdue} className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-800/40 bg-red-900/10 text-red-400 hover:border-red-600/50">
            Mark Overdue
          </button>
        )}
      </div>

      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 size={22} className="animate-spin mr-2" /><span className="text-sm">Loading...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-600 gap-2">
          <Package size={36} className="text-gray-800" />
          <p className="text-sm">No transactions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx._id} className="border border-gray-800 rounded-xl bg-surface p-4 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-heading font-semibold text-sm">{tx.requestedBy?.name || tx.requestedBy?.email}</span>
                  <StatusBadge status={tx.status} />
                </div>
                <p className="text-gray-500 text-xs font-mono">
                  {tx.items.length} item(s) · Due: {tx.expectedReturnDate ? new Date(tx.expectedReturnDate).toLocaleDateString() : '—'}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {tx.items.map((entry, i) => (
                    <span key={i} className="text-[10px] bg-bg border border-gray-800 px-2 py-0.5 rounded text-gray-400">
                      {entry.item?.name} ×{entry.quantity}
                    </span>
                  ))}
                </div>
              </div>
              {isManager && (
                <div className="flex gap-2 shrink-0">
                  {tx.status === 'pending' && (
                    <>
                      <button onClick={() => approve(tx)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-900/30 border border-emerald-800/40 text-emerald-400 text-xs font-medium hover:bg-emerald-900/50 transition-colors">
                        <CheckCircle size={13} /> Approve
                      </button>
                      <button onClick={() => reject(tx)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/20 border border-red-800/30 text-red-400 text-xs font-medium hover:bg-red-900/40 transition-colors">
                        <XCircle size={13} /> Reject
                      </button>
                    </>
                  )}
                  {(tx.status === 'approved' || tx.status === 'overdue') && (
                    <button
                      onClick={() => setReturnTx(tx)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        tx.status === 'overdue'
                          ? 'bg-amber-900/30 border border-amber-800/40 text-amber-400 hover:bg-amber-900/50'
                          : 'bg-blue-900/30 border border-blue-800/40 text-blue-400 hover:bg-blue-900/50'
                      }`}
                    >
                      <RotateCcw size={13} /> Return{tx.status === 'overdue' ? ' (Overdue)' : ''}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Members management tab ────────────────────────────────────────────────── */
function MembersTab() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', email: '', role: 'member' });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const { member: self } = useMember();

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetch = () => {
    setLoading(true);
    membersApi.getAll()
      .then((res) => { setMembers(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!active) return;
      setLoading(true);
      try {
        const res = await membersApi.getAll();
        if (active) {
          setMembers(res.data || []);
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

  const toggleActive = async (m) => {
    try { await membersApi.toggleActive(m._id); showToast(`${m.name} ${m.active ? 'deactivated' : 'activated'}`); fetch(); }
    catch (e) { alert(e.message); }
  };

  const changeRole = async (m, role) => {
    try { await membersApi.changeRole(m._id, role); showToast('Role updated'); fetch(); }
    catch (e) { alert(e.message); }
  };

  const deleteMember = async (m) => {
    if (!confirm(`Delete ${m.name}? This cannot be undone.`)) return;
    try { await membersApi.delete(m._id); showToast('Member deleted'); fetch(); }
    catch (e) { alert(e.message); }
  };

  const addMember = async () => {
    if (!addForm.name || !addForm.email) return setAddError('Name and email are required');
    setAddLoading(true); setAddError('');
    try {
      await membersApi.create(addForm);
      showToast('Member added');
      setShowAdd(false);
      setAddForm({ name: '', email: '', role: 'member' });
      fetch();
    } catch (e) {
      setAddError(e.message);
    } finally {
      setAddLoading(false);
    }
  };

  const inputCls = "w-full bg-bg border border-gray-700 rounded-lg px-3 py-2 text-heading text-sm focus:outline-none focus:border-gold";

  return (
    <div className="space-y-4">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-gray-500 text-sm">{members.length} member{members.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setShowAdd((v) => !v)}
          className="px-3 py-1.5 rounded-lg bg-gold text-black text-xs font-bold hover:bg-gold/90 transition-colors">
          + Add Member
        </button>
      </div>

      {/* Add member form */}
      {showAdd && (
        <div className="bg-surface border border-gray-800 rounded-xl p-4 space-y-3">
          <h4 className="text-heading font-semibold text-sm">New Member</h4>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-gray-400 block mb-1">Name</label><input className={inputCls} value={addForm.name} onChange={(e) => setAddForm((f) => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="text-xs text-gray-400 block mb-1">Email</label><input className={inputCls} type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} /></div>
          </div>
          <div>
            <label className="text-xs text-gray-400 block mb-1">Role</label>
            <select className={inputCls} value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}>
              <option value="member">Member</option>
              <option value="inventory_manager">Inventory Manager</option>
              <option value="coordinator">Coordinator</option>
            </select>
          </div>
          {addError && <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12}/>{addError}</p>}
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm">Cancel</button>
            <button onClick={addMember} disabled={addLoading}
              className="flex-1 py-2 rounded-lg bg-gold text-black font-bold text-sm disabled:opacity-60 flex items-center justify-center gap-2">
              {addLoading && <Loader2 size={14} className="animate-spin" />}
              Add
            </button>
          </div>
        </div>
      )}

      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-500">
          <Loader2 size={22} className="animate-spin mr-2" /><span className="text-sm">Loading members...</span>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => {
            const isSelf = m._id === self?._id;
            return (
              <div key={m._id} className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3 transition-colors ${m.active ? 'border-gray-800 bg-surface' : 'border-gray-800 bg-gray-900/30 opacity-60'}`}>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-heading font-semibold text-sm">{m.name}</span>
                    <RoleBadge role={m.role} />
                    {!m.active && <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-gray-800 text-gray-500 border-gray-700">INACTIVE</span>}
                    {isSelf && <span className="text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border bg-gold/10 text-gold border-gold/20">YOU</span>}
                  </div>
                  <p className="text-gray-500 text-xs font-mono">{m.email}</p>
                </div>
                {!isSelf && m.role !== 'coordinator' && (
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button onClick={() => toggleActive(m)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${m.active ? 'bg-red-900/20 border-red-800/30 text-red-400 hover:bg-red-900/40' : 'bg-emerald-900/20 border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/40'}`}>
                      {m.active ? <><UserX size={13} /> Deactivate</> : <><UserCheck size={13} /> Activate</>}
                    </button>
                    <select value={m.role}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-surface text-gray-300 focus:outline-none focus:border-gold">
                      <option value="member">Member</option>
                      <option value="inventory_manager">Inv. Manager</option>
                    </select>
                    <button onClick={() => deleteMember(m)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-700 bg-surface text-gray-500 hover:border-red-800/50 hover:text-red-400 transition-colors">
                      <X size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Transfer Power tab (coordinator only) ─────────────────────────────────── */
function TransferPowerTab() {
  const { member: self } = useMember();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchMembers = () => {
    setLoading(true);
    membersApi.getAll()
      .then((res) => { setMembers(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    let active = true;

    (async () => {
      if (!active) return;
      setLoading(true);
      try {
        const res = await membersApi.getAll();
        if (active) {
          setMembers(res.data || []);
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

  const coordinators = members.filter((m) => m.role === 'coordinator');
  const nonCoordinators = members.filter((m) => m.role !== 'coordinator');
  const atMax = coordinators.length >= 3;
  const isLastCoordinator = coordinators.length <= 1;

  const promote = async (m) => {
    if (!confirm(`Promote ${m.name} to Coordinator?`)) return;
    try {
      await membersApi.changeRole(m._id, 'coordinator');
      showToast(`${m.name} is now a Coordinator`);
      fetchMembers();
    } catch (e) { alert(e.message); }
  };

  const stepDown = async () => {
    if (!confirm('Step down from Coordinator? You will become a Member.')) return;
    try {
      await membersApi.changeRole(self._id, 'member');
      showToast('You have stepped down. Refreshing...');
      setTimeout(() => window.location.reload(), 1500);
    } catch (e) { alert(e.message); }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2.5 bg-emerald-900/80 border border-emerald-700/40 text-emerald-300 text-sm rounded-xl shadow-lg backdrop-blur-sm">
          {toast}
        </div>
      )}

      {/* Current Coordinators */}
      <div className="bg-surface border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
            <ShieldCheck size={15} className="text-purple-400" /> Current Coordinators
          </h2>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-purple-900/20 text-purple-400 border-purple-800/40">
            {coordinators.length} / 3
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-gray-600" /></div>
        ) : error ? (
          <p className="text-red-400 text-xs flex items-center gap-1"><AlertCircle size={12} />{error}</p>
        ) : (
          <div className="space-y-2">
            {coordinators.map((c) => {
              const isSelf = c._id === self?._id;
              return (
                <div key={c._id} className={`flex items-center justify-between p-3 rounded-lg border ${
                  isSelf ? 'border-purple-800/50 bg-purple-900/10' : 'border-gray-800 bg-bg'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-900/30 border border-purple-800/40 flex items-center justify-center text-purple-400 text-xs font-bold">
                      {c.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-heading">{c.name} {isSelf && <span className="text-[10px] text-purple-400 ml-1">(you)</span>}</p>
                      <p className="text-[11px] text-gray-500">{c.email}</p>
                    </div>
                  </div>
                  {isSelf && (
                    <button
                      onClick={stepDown}
                      disabled={isLastCoordinator}
                      title={isLastCoordinator ? 'You are the last coordinator. Promote someone first.' : 'Step down to Member'}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-red-900/20 border-red-800/30 text-red-400 hover:bg-red-900/40"
                    >
                      <UserX size={13} /> Step Down
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Promote Someone */}
      <div className={`bg-surface border rounded-xl p-5 space-y-4 ${
        atMax ? 'border-gray-800 opacity-60' : 'border-gray-800'
      }`}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-heading flex items-center gap-2">
            <UserCheck size={15} className="text-emerald-400" /> Promote to Coordinator
          </h2>
          {atMax && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded border bg-amber-900/20 text-amber-400 border-amber-800/40">
              Max 3 reached
            </span>
          )}
        </div>

        {!loading && nonCoordinators.length === 0 && (
          <p className="text-gray-600 text-xs text-center py-4">No other members to promote.</p>
        )}

        {!loading && nonCoordinators.length > 0 && (
          <div className="space-y-2">
            {nonCoordinators.map((m) => (
              <div key={m._id} className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-bg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center text-gray-400 text-xs font-bold">
                    {m.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-heading">{m.name}</p>
                    <p className="text-[11px] text-gray-500">{m.email} · <span className="capitalize">{m.role.replace('_', ' ')}</span></p>
                  </div>
                </div>
                <button
                  onClick={() => promote(m)}
                  disabled={atMax}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed bg-emerald-900/20 border-emerald-800/30 text-emerald-400 hover:bg-emerald-900/40"
                >
                  <UserCheck size={13} /> Promote
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminPage() {
  const isManager = useIsManager();
  const isCoordinator = useIsCoordinator();
  const [tab, setTab] = useState('transactions');

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-gray-600 gap-3">
        <ShieldCheck size={40} className="text-gray-800" />
        <p className="text-sm">You don't have access to the admin panel.</p>
      </div>
    );
  }

  const TABS = [
    { key: 'transactions', label: 'Transactions', icon: Package },
    ...(isCoordinator ? [{ key: 'members', label: 'Members', icon: Users }] : []),
    ...(isCoordinator ? [{ key: 'transfer', label: 'Transfer Power', icon: ShieldCheck }] : []),
  ];

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">Admin Panel</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {isCoordinator ? 'Coordinator' : 'Inventory Manager'} controls
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === key
                ? 'border-gold text-gold'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'transactions' && <TransactionsTab isManager={isManager} isCoordinator={isCoordinator} />}
      {tab === 'members' && isCoordinator && <MembersTab />}
      {tab === 'transfer' && isCoordinator && <TransferPowerTab />}
    </div>
  );
}
