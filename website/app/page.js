"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Navigation_1 = __importDefault(require("../components/Navigation"));
const Main_1 = __importDefault(require("../components/Main"));
function HomePage() {
    return (<main>
      <Navigation_1.default />
      <Main_1.default />
    </main>);
}
exports.default = HomePage;
