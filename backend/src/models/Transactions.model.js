import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', required: true },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Member', default: null },
  issuedOn: { type: Date, default: null },
  returnDate: { type: Date, default: null },
  expectedReturnDate: { type: Date, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'returned', 'overdue', 'completed'],
    default: 'pending',
    required: true,
  },
  items: [
    {
      item: { type: mongoose.Schema.Types.ObjectId, ref: 'inventory', required: true },
      quantity: { type: Number, required: true, min: 1 },
      damagedQuantity: { type: Number, default: 0 },
      remarks: { type: String },
    },
  ],
}, { timestamps: true });

export default mongoose.model('transaction', transactionSchema);