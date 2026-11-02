"use strict";
/*
 * Copyright (c) 2025 Larisa Rozin
 * dodone-shared - Task Management, Allowance & Bonus Tracking Application Package
 * All rights reserved.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowanceMonthOfYear = exports.AllowanceDayOfWeek = exports.AllowanceIntervalType = void 0;
var AllowanceIntervalType;
(function (AllowanceIntervalType) {
    AllowanceIntervalType[AllowanceIntervalType["Weekly"] = 1] = "Weekly";
    AllowanceIntervalType[AllowanceIntervalType["Monthly"] = 2] = "Monthly";
    AllowanceIntervalType[AllowanceIntervalType["Quarterly"] = 3] = "Quarterly";
    AllowanceIntervalType[AllowanceIntervalType["SchoolYear"] = 4] = "SchoolYear";
})(AllowanceIntervalType || (exports.AllowanceIntervalType = AllowanceIntervalType = {}));
var AllowanceDayOfWeek;
(function (AllowanceDayOfWeek) {
    AllowanceDayOfWeek[AllowanceDayOfWeek["Sunday"] = 0] = "Sunday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Monday"] = 1] = "Monday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Tuesday"] = 2] = "Tuesday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Wednesday"] = 3] = "Wednesday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Thursday"] = 4] = "Thursday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Friday"] = 5] = "Friday";
    AllowanceDayOfWeek[AllowanceDayOfWeek["Saturday"] = 6] = "Saturday";
})(AllowanceDayOfWeek || (exports.AllowanceDayOfWeek = AllowanceDayOfWeek = {}));
var AllowanceMonthOfYear;
(function (AllowanceMonthOfYear) {
    AllowanceMonthOfYear[AllowanceMonthOfYear["January"] = 1] = "January";
    AllowanceMonthOfYear[AllowanceMonthOfYear["February"] = 2] = "February";
    AllowanceMonthOfYear[AllowanceMonthOfYear["March"] = 3] = "March";
    AllowanceMonthOfYear[AllowanceMonthOfYear["April"] = 4] = "April";
    AllowanceMonthOfYear[AllowanceMonthOfYear["May"] = 5] = "May";
    AllowanceMonthOfYear[AllowanceMonthOfYear["June"] = 6] = "June";
    AllowanceMonthOfYear[AllowanceMonthOfYear["July"] = 7] = "July";
    AllowanceMonthOfYear[AllowanceMonthOfYear["August"] = 8] = "August";
    AllowanceMonthOfYear[AllowanceMonthOfYear["September"] = 9] = "September";
    AllowanceMonthOfYear[AllowanceMonthOfYear["October"] = 10] = "October";
    AllowanceMonthOfYear[AllowanceMonthOfYear["November"] = 11] = "November";
    AllowanceMonthOfYear[AllowanceMonthOfYear["December"] = 12] = "December";
})(AllowanceMonthOfYear || (exports.AllowanceMonthOfYear = AllowanceMonthOfYear = {}));
