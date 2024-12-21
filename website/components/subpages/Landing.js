"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_2 = require("@nextui-org/react");
function Landing() {
    return (<div id={'card-container'}>
      <react_2.Card>
        <react_2.CardHeader>
          <p>stat name</p>
          <small>stat value</small>
        </react_2.CardHeader>
        <react_2.CardBody>chart</react_2.CardBody>
      </react_2.Card>
      <react_2.Card>
        <react_2.CardHeader>
          <p>stat name</p>
          <small>stat value</small>
        </react_2.CardHeader>
        <react_2.CardBody>chart</react_2.CardBody>
      </react_2.Card>
    </div>);
}
exports.default = Landing;
