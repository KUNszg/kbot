"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
function ResponsiveText(props) {
    return <span className={'responsive-text'}>{props.content}</span>;
}
exports.default = ResponsiveText;
