import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  isConsumable: { type: Boolean, default: false },
  isCollegeFunded: { type: Boolean, default: true },
  fundingSourceNote: { type: String, trim: true, default: '' },
  totalQuantity: { type: Number, required: true, min: 0 },
  availableQuantity: { type: Number, required: true, min: 0 },
  damagedQuantity: { type: Number, required: true, default: 0, min: 0 },
  storageId: { type: mongoose.Schema.Types.ObjectId, ref: 'storage' },

  // Coordinator-set policy per item
  policy: {
    allowedToTake: { type: Boolean, default: true },
    maxQuantityPerMember: { type: Number, default: null },  // null = no limit
    maxDurationDays: { type: Number, default: null },       // null = no limit
  },
}, { timestamps: true });

export default mongoose.model('inventory', inventorySchema);
