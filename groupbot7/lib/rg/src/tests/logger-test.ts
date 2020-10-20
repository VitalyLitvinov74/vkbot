import { setProduction } from "../";
import * as util from "util";

// Тест в консоль
console.log("Hello, world!");
console.error({ status: 'error', desc: 'User not found', data: [] });
console.warn("Hello, world warn!", 15, 10, "asdfasdf");

setProduction();