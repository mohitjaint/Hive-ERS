import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Transaction from '../models/Transactions.model.js';
import Inventory from '../models/Inventory.model.js';

// ─── Helper: Check policy before allowing a request ─────────────────────────
async function validateItemRequest(itemId, requestedQty, memberId) {
  const item = await Inventory.findById(itemId);
  if (!item) throw new ApiError(404, `Item ${itemId} not found`);
  if (!item.policy.allowedToTake) throw new ApiError(403, `Item "${item.name}" is not allowed to be taken`);
  if (item.availableQuantity < requestedQty) {
    throw new ApiError(400, `Insufficient quantity for item "${item.name}". Available: ${item.availableQuantity}`);
  }
  if (item.policy.maxQuantityPerMember !== null && requestedQty > item.policy.maxQuantityPerMember) {
    throw new ApiError(400, `You can only take up to ${item.policy.maxQuantityPerMember} unit(s) of "${item.name}"`);
  }
  return item;
}

// ─── CREATE transaction request (member) ─────────────────────────────────────
export const createTransactionRequest = asyncHandler(async (req, res) => {
  const { items, expectedReturnDate } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'items array is required and cannot be empty');
  }
  // Validate all items first (no DB writes yet)
  const validatedItems = [];
  let hasNonConsumable = false;
  
  for (const entry of items) {
    const { item, quantity } = entry;
    if (!item || !quantity || quantity < 1) throw new ApiError(400, 'Each item must have a valid item id and quantity >= 1');
    const inventoryItem = await validateItemRequest(item, quantity, req.member._id);

    if (!inventoryItem.isConsumable) {
      hasNonConsumable = true;
    }

    validatedItems.push({ item, quantity, inventoryItem });
  }

  let returnDate = null;
  if (hasNonConsumable) {
    if (!expectedReturnDate) throw new ApiError(400, 'expectedReturnDate is required for non-consumable items');
    returnDate = new Date(expectedReturnDate);
    if (isNaN(returnDate) || returnDate <= new Date()) {
      throw new ApiError(400, 'expectedReturnDate must be a valid future date');
    }
  }

  for (const entry of validatedItems) {
    const { inventoryItem } = entry;
    // Check maxDurationDays policy
    if (inventoryItem.policy.maxDurationDays !== null && returnDate) {
      const durationMs = returnDate - new Date();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
      if (durationDays > inventoryItem.policy.maxDurationDays) {
        throw new ApiError(400, `You can keep "${inventoryItem.name}" for at most ${inventoryItem.policy.maxDurationDays} day(s)`);
      }
    }
  }

  const finalItems = validatedItems.map(entry => ({ item: entry.item, quantity: entry.quantity }));

  const transaction = await Transaction.create({
    requestedBy: req.member._id,
    expectedReturnDate: returnDate,
    items: finalItems,
    status: 'pending',
  });

  return res.status(201).json(new ApiResponse(201, 'Transaction request submitted', transaction));
});

// ─── GET all transactions (coordinator/inventory_manager) ─────────────────────
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = {};
  if (status) filter.status = status;

  const transactions = await Transaction.find(filter)
    .populate('requestedBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('items.item', 'name category image')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, 'Transactions fetched', transactions));
});

// ─── GET own transactions (member) ────────────────────────────────────────────
export const getMyTransactions = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const filter = { requestedBy: req.member._id };
  if (status) filter.status = status;

  const transactions = await Transaction.find(filter)
    .populate('approvedBy', 'name email')
    .populate('items.item', 'name category image')
    .sort({ createdAt: -1 });

  return res.status(200).json(new ApiResponse(200, 'Your transactions fetched', transactions));
});

// ─── GET single transaction ────────────────────────────────────────────────────
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('requestedBy', 'name email role')
    .populate('approvedBy', 'name email role')
    .populate('items.item', 'name category image policy');

  if (!transaction) throw new ApiError(404, 'Transaction not found');

  // Members can only view their own transactions
  if (
    req.member.role === 'member' &&
    transaction.requestedBy._id.toString() !== req.member._id.toString()
  ) {
    throw new ApiError(403, 'You can only view your own transactions');
  }

  return res.status(200).json(new ApiResponse(200, 'Transaction fetched', transaction));
});

// ─── APPROVE transaction (inventory_manager / coordinator) ────────────────────
export const approveTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id).populate('items.item');
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  if (transaction.status !== 'pending') {
    throw new ApiError(400, `Cannot approve a transaction with status "${transaction.status}"`);
  }

  // Re-validate availability at approval time
  let hasNonConsumable = false;
  for (const entry of transaction.items) {
    const item = await Inventory.findById(entry.item._id || entry.item);
    if (!item) throw new ApiError(404, 'Item no longer exists');
    if (!item.policy.allowedToTake) throw new ApiError(403, `Item "${item.name}" is no longer allowed to be taken`);
    if (item.availableQuantity < entry.quantity) {
      throw new ApiError(400, `Insufficient quantity for "${item.name}". Available: ${item.availableQuantity}`);
    }
    if (!item.isConsumable) hasNonConsumable = true;
  }

  // Deduct inventory
  for (const entry of transaction.items) {
    await Inventory.findByIdAndUpdate(entry.item._id || entry.item, {
      $inc: { availableQuantity: -entry.quantity },
    });
  }

  transaction.status = hasNonConsumable ? 'approved' : 'completed';
  transaction.approvedBy = req.member._id;
  transaction.issuedOn = new Date();
  await transaction.save();

  return res.status(200).json(new ApiResponse(200, 'Transaction approved', transaction));
});

// ─── REJECT transaction (inventory_manager / coordinator) ─────────────────────
export const rejectTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  if (transaction.status !== 'pending') {
    throw new ApiError(400, `Cannot reject a transaction with status "${transaction.status}"`);
  }

  transaction.status = 'rejected';
  transaction.approvedBy = req.member._id;
  await transaction.save();

  return res.status(200).json(new ApiResponse(200, 'Transaction rejected', transaction));
});

// ─── RETURN items (inventory_manager / coordinator) ───────────────────────────
export const returnTransaction = asyncHandler(async (req, res) => {
  const { itemRemarks } = req.body; // optional: [{ itemId, damagedQuantity, remarks }]

  const transaction = await Transaction.findById(req.params.id).populate('items.item');
  if (!transaction) throw new ApiError(404, 'Transaction not found');
  if (transaction.status !== 'approved') {
    throw new ApiError(400, `Can only return an approved transaction. Current status: "${transaction.status}"`);
  }

  // Process each item return
  for (const entry of transaction.items) {
    if (entry.item.isConsumable) continue;

    const remark = itemRemarks?.find((r) => r.itemId?.toString() === entry.item._id.toString());
    const damaged = remark?.damagedQuantity ?? 0;

    if (damaged < 0 || damaged > entry.quantity) {
      throw new ApiError(400, 'damagedQuantity must be between 0 and requested quantity');
    }

    entry.damagedQuantity = damaged;
    if (remark?.remarks) entry.remarks = remark.remarks;

    // Return non-damaged items to available stock; add damaged to damagedQuantity
    await Inventory.findByIdAndUpdate(entry.item._id, {
      $inc: {
        availableQuantity: entry.quantity - damaged,
        damagedQuantity: damaged,
        totalQuantity: 0, // total stays same (damaged items still counted in total)
      },
    });
  }

  transaction.status = 'returned';
  transaction.returnDate = new Date();
  await transaction.save();

  return res.status(200).json(new ApiResponse(200, 'Items returned successfully', transaction));
});

// ─── MARK overdue transactions (can be called by a cron or coordinator) ───────
export const markOverdueTransactions = asyncHandler(async (req, res) => {
  const result = await Transaction.updateMany(
    {
      status: 'approved',
      expectedReturnDate: { $lt: new Date() },
    },
    { status: 'overdue' }
  );

  return res.status(200).json(new ApiResponse(200, `${result.modifiedCount} transactions marked as overdue`, null));
});
