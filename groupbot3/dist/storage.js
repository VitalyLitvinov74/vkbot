"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Storage = void 0;
const fs_1 = require("fs");
const FILE = "./storage.json";
class Storage {
    constructor() {
        this.data = {};
    }
    async read() {
        this.data = JSON.parse(await fs_1.promises.readFile(FILE, {
            encoding: "utf-8"
        }));
    }
    getFormat() {
        let txt = "";
        for (const key in this.data) {
            txt += key + ": \n";
            txt += this.data[key] + "\n\n";
        }
        return txt;
    }
    set(name, value) {
        this.data[name] = value;
        fs_1.promises.writeFile(FILE, JSON.stringify(this.data));
    }
    remove(name) {
        if (!this.data[name]) {
            return false;
        }
        delete this.data[name];
        fs_1.promises.writeFile(FILE, JSON.stringify(this.data));
        return true;
    }
    get(vkMessage) {
        for (const key in this.data) {
            if (vkMessage.indexOf(key) !== -1) {
                return this.data[key];
            }
        }
        return undefined;
    }
}
exports.Storage = Storage;
//# sourceMappingURL=storage.js.map