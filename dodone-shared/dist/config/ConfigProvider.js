"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigProvider = ConfigProvider;
const jsx_runtime_1 = require("react/jsx-runtime");
const ConfigContext_1 = require("./ConfigContext");
function ConfigProvider({ children, config }) {
    return ((0, jsx_runtime_1.jsx)(ConfigContext_1.ConfigContext.Provider, { value: config, children: children }));
}
