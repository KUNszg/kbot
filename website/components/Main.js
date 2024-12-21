"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const Statistics_1 = __importDefault(require("@/components/subpages/Statistics"));
function Main() {
    return (<div id={'page-container'}>
      <div id={'page-content'}>
        <Statistics_1.default />
        <Statistics_1.default />
        <Statistics_1.default />
        <Statistics_1.default />
        <Statistics_1.default />
        <Statistics_1.default />
      </div>
    </div>);
}
exports.default = Main;
