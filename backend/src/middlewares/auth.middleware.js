import asyncHandler from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {auth} from "../lib/auth.js";
import Member from "../models/Members.model.js";

export const verifySession = asyncHandler(async (req, res, next) => {
    const sessionData = await auth.api.getSession(
        {
            headers : req.headers,
        }
    );

    if (!sessionData) {
        return next(new ApiError(401, "Unauthorized: No valid session found"));
    }

    req.user = sessionData.user;
    req.session = sessionData.session;

    next();
});

export const verifyMember = asyncHandler(async (req, res, next) => {
    const user = req.user;
    const member = await Member.findOne({ email: user.email.toLowerCase() });

    if (!member) {
        return next(new ApiError(403, "Forbidden: User is not a member"));
    }

    if(!member.active) {
        return next(new ApiError(403, "Forbidden: User is not a active member"));
    }

    req.member = member;

    next();
});


// Role hierarchy: higher index = more permissions
const ROLE_HIERARCHY = ['member', 'inventory_manager', 'coordinator'];

export const verifyRole = (...requiredRoles) => asyncHandler(async (req, res, next) => {
    const member = req.member;
    const memberLevel = ROLE_HIERARCHY.indexOf(member.role);
    const minRequiredLevel = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY.indexOf(r)));

    if (memberLevel === -1 || memberLevel < minRequiredLevel) {
        return next(new ApiError(403, "Forbidden: User does not have the required role"));
    }

    next();
});



