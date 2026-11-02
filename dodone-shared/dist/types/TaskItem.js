"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskItemPriority = void 0;
var TaskItemPriority;
(function (TaskItemPriority) {
    TaskItemPriority[TaskItemPriority["None"] = 0] = "None";
    TaskItemPriority[TaskItemPriority["Low"] = 1] = "Low";
    TaskItemPriority[TaskItemPriority["Medium"] = 2] = "Medium";
    TaskItemPriority[TaskItemPriority["High"] = 3] = "High";
    TaskItemPriority[TaskItemPriority["Critical"] = 4] = "Critical";
})(TaskItemPriority || (exports.TaskItemPriority = TaskItemPriority = {}));
