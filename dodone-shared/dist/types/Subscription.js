"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UNLIMITED = exports.SubscriptionAction = exports.SubscriptionTier = void 0;
var SubscriptionTier;
(function (SubscriptionTier) {
    SubscriptionTier[SubscriptionTier["Free"] = 0] = "Free";
    SubscriptionTier[SubscriptionTier["Pro"] = 1] = "Pro";
})(SubscriptionTier || (exports.SubscriptionTier = SubscriptionTier = {}));
var SubscriptionAction;
(function (SubscriptionAction) {
    SubscriptionAction[SubscriptionAction["AddTeamMember"] = 0] = "AddTeamMember";
    SubscriptionAction[SubscriptionAction["AddAllowanceInterval"] = 1] = "AddAllowanceInterval";
    SubscriptionAction[SubscriptionAction["AddTaskItem"] = 2] = "AddTaskItem";
})(SubscriptionAction || (exports.SubscriptionAction = SubscriptionAction = {}));
exports.UNLIMITED = -1;
