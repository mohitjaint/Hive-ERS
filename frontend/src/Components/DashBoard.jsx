import { useEffect, useState } from 'react';
import { transactionsApi } from '../lib/api';
import { useMember } from '../lib/MemberContext';
import {
  Package, Clock, AlertTriangle, CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    pending:  { cls: 'bg-amber-900/40 text-amber-400 border-amber-700/40', label: 'PENDING' },
    approved: { cls: 'bg-blue-900/40 text-blue-400 border-blue-700/40', label: 'APPROVED' },
    rejected: { cls: 'bg-red-900/40 text-red-400 border-red-700/40', label: 'REJECTED' },
    returned: { cls: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/40', label: 'RETURNED' },
    overdue:  { cls: 'bg-red-900/40 text-red-400 border-red-700/40', label: 'OVERDUE' },
    completed: { cls: 'bg-indigo-900/40 text-indigo-400 border-indigo-700/40', label: 'COMPLETED' },
  };
  const s = map[status] || { cls: 'bg-gray-800 text-gray-400 border-gray-700', label: status?.toUpperCase() };
  return (
    <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function DaysRemaining({ expectedReturnDate }) {
  const days = Math.ceil((new Date(expectedReturnDate) - new Date()) / 86400000);
  if (days < 0) return <span className="text-red-400 text-xs font-mono">{Math.abs(days)}d overdue</span>;
  if (days === 0) return <span className="text-amber-400 text-xs font-mono">Due today</span>;
  return <span className="text-emerald-400 text-xs font-mono">{days}d remaining</span>;
}

function TransactionCard({ tx }) {
  const firstItem = tx.items?.[0];
  const itemName = firstItem?.item?.name || 'Unknown Item';
  const itemImage = firstItem?.item?.image;
  const extraCount = tx.items.length - 1;

  return (
    <div className="flex flex-col rounded-xl border border-gray-800 bg-surface hover:border-gold/30 transition-colors p-4 gap-3">
      {/* Image */}
      <div className="h-32 w-full rounded-lg overflow-hidden bg-gray-900 border border-gray-800">
        {itemImage ? (
          <img src={itemImage} alt={itemName} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Package size={32} className="text-gray-700" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-heading font-semibold text-sm truncate">{itemName}</h4>
          {extraCount > 0 && (
            <p className="text-gray-500 text-xs">+{extraCount} more item{extraCount > 1 ? 's' : ''}</p>
          )}
        </div>
        <StatusBadge status={tx.status} />
      </div>

      {/* Meta */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-mono border-t border-gray-800 pt-2">
        <span>Qty: {tx.items.reduce((s, i) => s + i.quantity, 0)}</span>
        {tx.expectedReturnDate && tx.status === 'approved' && (
          <DaysRemaining expectedReturnDate={tx.expectedReturnDate} />
        )}
        {tx.expectedReturnDate && tx.status !== 'approved' && (
          <span>{new Date(tx.expectedReturnDate).toLocaleDateString()}</span>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-4 bg-surface rounded-xl border border-gray-800 p-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <div className="text-2xl font-bold text-heading">{value}</div>
        <div className="text-xs text-gray-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

export default function DashBoard() {
  const { member } = useMember();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    transactionsApi.getMy()
      .then((res) => setTransactions(res.data || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active = transactions.filter((t) => t.status === 'approved');
  const pending = transactions.filter((t) => t.status === 'pending');
  const overdue = transactions.filter((t) => t.status === 'overdue');
  const returned = transactions.filter((t) => t.status === 'returned');

  const displayName = member?.name || 'Member';
  const roleLabel = { coordinator: 'Coordinator', inventory_manager: 'Inventory Manager', member: 'Member' }[member?.role] || '';

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="relative rounded-2xl border border-t-2 border-gold/60 bg-surface p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        style={{ boxShadow: '0 0 40px -10px rgba(255,215,0,0.08)' }}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold flex items-center justify-center shrink-0">
            <div className="w-7 h-7 relative">
              <div className="absolute w-[10px] h-[10px] top-[3px] left-[9px] border-[2.5px] border-black rounded-full" />
              <div className="absolute w-[18px] h-[7px] top-[17px] left-[5px] border-t-[2.5px] border-black rounded-2xl" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-heading">Welcome back, {displayName}</h1>
            <p className="text-gray-500 text-xs font-mono mt-0.5">{roleLabel}</p>
          </div>
        </div>
        <div className="text-sm text-gray-500 space-y-1 text-right">
          <p>{active.length} item{active.length !== 1 ? 's' : ''} borrowed</p>
          <p>{pending.length} pending request{pending.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} label="Currently Borrowed" value={active.length} color="bg-blue-900/40 text-blue-400" />
        <StatCard icon={Clock} label="Pending Requests" value={pending.length} color="bg-amber-900/40 text-amber-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} color="bg-red-900/40 text-red-400" />
        <StatCard icon={CheckCircle2} label="Total Returns" value={returned.length} color="bg-emerald-900/40 text-emerald-400" />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" />
          <span className="text-sm">Loading your transactions...</span>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-800/40 bg-red-900/10 px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Active borrows */}
      {!loading && active.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">Currently Borrowed</h2>
            <p className="text-gray-600 text-xs mt-0.5">Items you currently have</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {active.map((tx) => <TransactionCard key={tx._id} tx={tx} />)}
          </div>
        </section>
      )}

      {/* Pending requests */}
      {!loading && pending.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-500">Pending Requests</h2>
            <p className="text-gray-600 text-xs mt-0.5">Awaiting approval</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pending.map((tx) => <TransactionCard key={tx._id} tx={tx} />)}
          </div>
        </section>
      )}

      {/* Overdue */}
      {!loading && overdue.length > 0 && (
        <section className="pb-4">
          <div className="mb-4">
            <h2 className="text-xs font-semibold tracking-widest uppercase text-red-500">⚠ Overdue Items</h2>
            <p className="text-gray-600 text-xs mt-0.5">Please return these immediately</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {overdue.map((tx) => <TransactionCard key={tx._id} tx={tx} />)}
          </div>
        </section>
      )}

      {!loading && transactions.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-600">
          <Package size={40} className="text-gray-800" />
          <p className="text-sm">No transactions yet.</p>
          <a href="/inventory" className="flex items-center gap-1.5 text-gold text-xs hover:underline">
            Browse inventory <ArrowRight size={12} />
          </a>
        </div>
      )}
    </div>
  );
}