import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Inventory from '../models/Inventory.model.js';
import Storage from '../models/Storage.model.js';
import { cloudinary } from '../utils/cloudinary.js';

// ─── GET all inventory items ──────────────────────────────────────────────────
export const getAllItems = asyncHandler(async (req, res) => {
  const { category, search, isCollegeFunded } = req.query;
  const filter = {};

  if (category) filter.category = category;
  if (search) filter.name = { $regex: search, $options: 'i' };
  if (isCollegeFunded !== undefined && isCollegeFunded !== '') {
    filter.isCollegeFunded = isCollegeFunded === 'true' || isCollegeFunded === true;
  }

  const items = await Inventory.find(filter).populate('storageId', 'storageNumber name').sort({ createdAt: -1 });
  return res.status(200).json(new ApiResponse(200, 'Inventory fetched', items));
});

// ─── GET single item by id ────────────────────────────────────────────────────
export const getItemById = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id).populate('storageId', 'storageNumber name');
  if (!item) throw new ApiError(404, 'Item not found');
  return res.status(200).json(new ApiResponse(200, 'Item fetched', item));
});

// ─── CREATE item (inventory_manager or coordinator who is also inventory_manager) ─
export const createItem = asyncHandler(async (req, res) => {
  const { name, description, category, totalQuantity, availableQuantity, damagedQuantity, storageId, isConsumable, isCollegeFunded, fundingSourceNote } = req.body;

  if (!name || !description || !category || totalQuantity == null) {
    throw new ApiError(400, 'name, description, category, and totalQuantity are required');
  }

  if (!req.file) throw new ApiError(400, 'Item image is required');

  const imageUrl = req.file.path; // Cloudinary URL provided by multer-storage-cloudinary

  const total = Number(totalQuantity);
  const available = availableQuantity != null ? Number(availableQuantity) : total;
  const damaged = damagedQuantity != null ? Number(damagedQuantity) : 0;

  if (available + damaged > total) {
    throw new ApiError(400, 'availableQuantity + damagedQuantity cannot exceed totalQuantity');
  }

  const item = await Inventory.create({
    name: name.trim(),
    description,
    category,
    isConsumable: isConsumable === 'true' || isConsumable === true,
    isCollegeFunded: isCollegeFunded !== undefined ? (isCollegeFunded === 'true' || isCollegeFunded === true) : true,
    fundingSourceNote: fundingSourceNote || '',
    totalQuantity: total,
    availableQuantity: available,
    damagedQuantity: damaged,
    image: imageUrl,
    storageId: storageId || null,
  });

  await item.populate('storageId', 'storageNumber name');

  return res.status(201).json(new ApiResponse(201, 'Item created', item));
});

// ─── UPDATE item (inventory_manager) ─────────────────────────────────────────
export const updateItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');

  const { name, description, category, totalQuantity, availableQuantity, damagedQuantity, storageId, isConsumable, isCollegeFunded, fundingSourceNote } = req.body;

  if (name) item.name = name.trim();
  if (description) item.description = description;
  if (category) item.category = category;
  if (isConsumable !== undefined) item.isConsumable = isConsumable === 'true' || isConsumable === true;
  if (isCollegeFunded !== undefined) item.isCollegeFunded = isCollegeFunded === 'true' || isCollegeFunded === true;
  if (fundingSourceNote !== undefined) item.fundingSourceNote = fundingSourceNote;
  
  if (storageId !== undefined) {
    item.storageId = storageId || null;
  }

  if (totalQuantity != null) item.totalQuantity = Number(totalQuantity);
  if (availableQuantity != null) item.availableQuantity = Number(availableQuantity);
  if (damagedQuantity != null) item.damagedQuantity = Number(damagedQuantity);

  if (item.availableQuantity + item.damagedQuantity > item.totalQuantity) {
    throw new ApiError(400, 'availableQuantity + damagedQuantity cannot exceed totalQuantity');
  }

  // If new image uploaded, delete old one from Cloudinary and replace
  if (req.file) {
    if (item.image) {
      const publicId = item.image.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
      await cloudinary.uploader.destroy(publicId).catch(() => {}); // fail silently
    }
    item.image = req.file.path;
  }

  await item.save();
  await item.populate('storageId', 'storageNumber name');
  return res.status(200).json(new ApiResponse(200, 'Item updated', item));
});

// ─── DELETE item (inventory_manager) ─────────────────────────────────────────
export const deleteItem = asyncHandler(async (req, res) => {
  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');

  // Remove image from Cloudinary
  if (item.image) {
    const publicId = item.image.split('/').slice(-2).join('/').replace(/\.[^.]+$/, '');
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }

  await item.deleteOne();
  return res.status(200).json(new ApiResponse(200, 'Item deleted', null));
});

// ─── SET item policy (coordinator) ───────────────────────────────────────────
export const setItemPolicy = asyncHandler(async (req, res) => {
  const { allowedToTake, maxQuantityPerMember, maxDurationDays } = req.body;

  const item = await Inventory.findById(req.params.id);
  if (!item) throw new ApiError(404, 'Item not found');

  if (allowedToTake !== undefined) item.policy.allowedToTake = Boolean(allowedToTake);
  if (maxQuantityPerMember !== undefined) {
    item.policy.maxQuantityPerMember = maxQuantityPerMember === null ? null : Number(maxQuantityPerMember);
  }
  if (maxDurationDays !== undefined) {
    item.policy.maxDurationDays = maxDurationDays === null ? null : Number(maxDurationDays);
  }

  await item.save();
  return res.status(200).json(new ApiResponse(200, 'Item policy updated', item));
});
