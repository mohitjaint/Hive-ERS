import { useEffect, useState } from 'react';
import { transactionsApi } from '../lib/api';
import { Package, CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'returned', label: 'Returned' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'rejected', label: 'Rejected' },
];

const STATUS_META = {
  pending:  { icon: Clock,        cls: 'bg-amber-900/30 text-amber-400 border-amber-800/40',   label: 'PENDING'  },
  approved: { icon: CheckCircle2, cls: 'bg-blue-900/30 text-blue-400 border-blue-800/40',      label: 'APPROVED' },
  returned: { icon: CheckCircle2, cls: 'bg-emerald-900/30 text-emerald-400 border-emerald-800/40', label: 'RETURNED' },
  overdue:  { icon: AlertTriangle, cls: 'bg-red-900/30 text-red-400 border-red-800/40',         label: 'OVERDUE'  },
  completed: { icon: CheckCircle2, cls: 'bg-indigo-900/30 text-indigo-400 border-indigo-800/40', label: 'COMPLETED' },
  rejected: { icon: XCircle,      cls: 'bg-gray-800 text-gray-400 border-gray-700',            label: 'REJECTED' },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { cls: 'bg-gray-800 text-gray-400 border-gray-700', label: status?.toUpperCase() };
  return (
    <span className={`text-[9px] font-bold tracking-wider px-2 py-0.5 rounded border ${m.cls}`}>{m.label}</span>
  );
}

function TransactionRow({ tx }) {
  const [expanded, setExpanded] = useState(false);
  const firstItem = tx.items?.[0]?.item;
  const itemCount = tx.items?.length || 0;

  const issuedDate  = tx.issuedOn        ? new Date(tx.issuedOn).toLocaleDateString()        : '—';
  const expectedDate = tx.expectedReturnDate ? new Date(tx.expectedReturnDate).toLocaleDateString() : '—';
  const returnedDate = tx.returnDate      ? new Date(tx.returnDate).toLocaleDateString()      : '—';

  const totalDamaged = tx.items?.reduce((s, i) => s + (i.damagedQuantity || 0), 0) || 0;

  return (
    <div className="border border-gray-800 rounded-xl overflow-hidden bg-surface hover:border-gold/20 transition-colors">
      {/* Main row */}
      <button
        className="w-full flex flex-col md:flex-row md:items-center gap-3 p-4 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Item image */}
        <div className="h-12 w-12 rounded-lg overflow-hidden bg-gray-900 border border-gray-800 shrink-0">
          {firstItem?.image
            ? <img src={firstItem.image} alt={firstItem.name} className="h-full w-full object-cover" />
            : <div className="h-full w-full flex items-center justify-center"><Package size={16} className="text-gray-700" /></div>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-heading text-sm font-semibold">
              {firstItem?.name || 'Unknown Item'}
              {itemCount > 1 && <span className="text-gray-500 font-normal text-xs ml-1">+{itemCount - 1} more</span>}
            </span>
            <StatusBadge status={tx.status} />
          </div>
          <div className="text-gray-500 text-xs font-mono mt-1 flex flex-wrap gap-3">
            <span>Issued: {issuedDate}</span>
            <span>Due: {expectedDate}</span>
            {tx.status === 'returned' && <span>Returned: {returnedDate}</span>}
          </div>
        </div>

        {/* Total qty + damage */}
        <div className="text-right shrink-0">
          <p className="text-heading text-sm font-mono">{tx.items?.reduce((s, i) => s + i.quantity, 0)} unit(s)</p>
          {totalDamaged > 0 && <p className="text-red-400 text-xs">⚠ {totalDamaged} damaged</p>}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-800 px-4 py-3 bg-bg/50 space-y-2">
          {tx.items.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="h-9 w-9 rounded-lg bg-gray-900 border border-gray-800 overflow-hidden shrink-0">
                {entry.item?.image
                  ? <img src={entry.item.image} alt={entry.item.name} className="h-full w-full object-cover" />
                  : <div className="h-full flex items-center justify-center"><Package size={12} className="text-gray-700" /></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-heading text-xs font-medium truncate">{entry.item?.name || 'Unknown'}</p>
                <p className="text-gray-500 text-[10px]">{entry.item?.category}</p>
              </div>
              <div className="text-right text-xs">
                <p className="text-heading">Qty: {entry.quantity}</p>
                {entry.damagedQuantity > 0 && <p className="text-red-400">Damaged: {entry.damagedQuantity}</p>}
                {entry.remarks && <p className="text-gray-500 italic text-[10px] mt-0.5">"{entry.remarks}"</p>}
              </div>
            </div>
          ))}
          {tx.approvedBy && (
            <p className="text-gray-600 text-[10px] font-mono pt-1 border-t border-gray-800">
              {tx.status === 'rejected' ? 'Rejected' : 'Approved'} by: {tx.approvedBy?.name || tx.approvedBy?.email}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetch = () => {
    setLoading(true);
    const params = statusFilter ? { status: statusFilter } : {};
    transactionsApi.getMy(params)
      .then((res) => { setTransactions(res.data || []); setError(''); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const returned   = transactions.filter((t) => t.status === 'returned').length;
  const overdue    = transactions.filter((t) => t.status === 'overdue').length;
  const total      = transactions.length;
  const onTime     = transactions.filter((t) => t.status === 'returned' && new Date(t.returnDate) <= new Date(t.expectedReturnDate)).length;

  return (
    <div className="w-full min-h-screen bg-bg text-fg px-4 md:px-8 py-8 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-heading">My History</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your borrowing record</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Borrows', value: total, color: 'bg-blue-900/40 text-blue-400' },
          { label: 'On-Time Returns', value: onTime, color: 'bg-emerald-900/40 text-emerald-400' },
          { label: 'Returned', value: returned, color: 'bg-gray-800 text-gray-300' },
          { label: 'Overdue', value: overdue, color: 'bg-red-900/40 text-red-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-surface rounded-xl border border-gray-800 p-4 flex flex-col gap-1">
            <span className={`text-2xl font-bold ${color.split(' ')[1]}`}>{value}</span>
            <span className="text-gray-500 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              statusFilter === f.value
                ? 'bg-gold text-black border-gold'
                : 'bg-surface border-gray-800 text-gray-400 hover:border-gray-600'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && <div className="text-red-400 text-sm border border-red-800/40 bg-red-900/10 rounded-xl px-4 py-3">{error}</div>}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          <Loader2 size={24} className="animate-spin mr-2" /><span className="text-sm">Loading history...</span>
        </div>
      ) : transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-600 gap-2">
          <Package size={40} className="text-gray-800" />
          <p className="text-sm">No transactions found.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 pb-10">
          {transactions.map((tx) => <TransactionRow key={tx._id} tx={tx} />)}
        </div>
      )}
    </div>
  );
}