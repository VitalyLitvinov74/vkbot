import { promises } from "fs";

const FILE = "./storage.json";

export class Storage {
    private data: Record<string, string> = {};
    
    public async read() {
        this.data = JSON.parse(await promises.readFile(FILE, {
            encoding: "utf-8"
        }));
    }

    public getFormat(): string {
        let txt = "";

        for(const key in this.data) {
            txt += key + ": \n";
            txt += this.data[key] + "\n\n";
        }

        return txt;
    }

    public set(name: string, value: string): void {
        this.data[name] = value;
        promises.writeFile(FILE, JSON.stringify(this.data));
    }

    public remove(name: string): boolean {
        if(!this.data[name]) {
            return false;
        }

        delete this.data[name];
        promises.writeFile(FILE, JSON.stringify(this.data));

        return true;
    }

    public get(vkMessage: string): string | undefined {
        for(const key in this.data) {
            if(vkMessage.indexOf(key) !== -1) {
                return this.data[key];
            }
        }

        return undefined;
    }
}