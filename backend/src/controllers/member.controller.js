import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Member from '../models/Members.model.js';

// ─── GET all members (coordinator/inventory_manager) ────────────────────────
export const getAllMembers = asyncHandler(async (req, res) => {
  const members = await Member.find().sort({ joinedAt: -1 });
  return res.status(200).json(new ApiResponse(200, 'Members fetched', members));
});

// ─── GET single member by id ─────────────────────────────────────────────────
export const getMemberById = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw new ApiError(404, 'Member not found');
  return res.status(200).json(new ApiResponse(200, 'Member fetched', member));
});

// ─── CREATE member (coordinator) ─────────────────────────────────────────────
export const createMember = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email) throw new ApiError(400, 'Name and email are required');

  const existing = await Member.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'Member with this email already exists');

  const allowedRoles = ['member', 'inventory_manager', 'coordinator'];
  if (role && !allowedRoles.includes(role)) {
    throw new ApiError(400, 'Invalid role');
  }

  const member = await Member.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role || 'member',
  });

  return res.status(201).json(new ApiResponse(201, 'Member created', member));
});

// ─── UPDATE member active status (coordinator) ───────────────────────────────
export const toggleMemberActive = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw new ApiError(404, 'Member not found');

  // Coordinator cannot deactivate themselves
  if (member._id.toString() === req.member._id.toString()) {
    throw new ApiError(400, 'Cannot change your own active status');
  }

  member.active = !member.active;
  await member.save();

  return res
    .status(200)
    .json(new ApiResponse(200, `Member ${member.active ? 'activated' : 'deactivated'}`, member));
});

// ─── CHANGE member role (coordinator only) ────────────────────────────────────
export const changeMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const allowedRoles = ['member', 'inventory_manager', 'coordinator'];
  if (!allowedRoles.includes(role)) {
    throw new ApiError(400, 'Invalid role. Must be "member", "inventory_manager", or "coordinator"');
  }

  const member = await Member.findById(req.params.id);
  if (!member) throw new ApiError(404, 'Member not found');

  const isSelf = member._id.toString() === req.member._id.toString();

  // Block demoting another coordinator — only self-demotion is allowed
  if (member.role === 'coordinator' && !isSelf) {
    throw new ApiError(403, 'You cannot change the role of another coordinator');
  }

  // Non-coordinators cannot change their own role
  if (isSelf && req.member.role !== 'coordinator') {
    throw new ApiError(400, 'Cannot change your own role');
  }

  // Coordinators stepping down can only go to 'member'
  if (isSelf && role !== 'member') {
    throw new ApiError(400, 'You can only step down to member');
  }

  // Max 3 coordinators cap
  if (role === 'coordinator') {
    const count = await Member.countDocuments({ role: 'coordinator' });
    if (count >= 3) {
      throw new ApiError(400, 'Maximum of 3 coordinators allowed. Demote a coordinator first.');
    }
  }

  // Min 1 coordinator floor (step-down guard)
  if (isSelf && member.role === 'coordinator' && role === 'member') {
    const count = await Member.countDocuments({ role: 'coordinator' });
    if (count <= 1) {
      throw new ApiError(400, 'You are the last coordinator. Promote someone before stepping down.');
    }
  }

  member.role = role;
  await member.save();

  return res.status(200).json(new ApiResponse(200, 'Member role updated', member));
});


// ─── DELETE member (coordinator) ─────────────────────────────────────────────
export const deleteMember = asyncHandler(async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) throw new ApiError(404, 'Member not found');

  if (member._id.toString() === req.member._id.toString()) {
    throw new ApiError(400, 'Cannot delete yourself');
  }

  await member.deleteOne();
  return res.status(200).json(new ApiResponse(200, 'Member deleted', null));
});

// ─── GET own profile ──────────────────────────────────────────────────────────
export const getMyProfile = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, 'Profile fetched', req.member));
});
