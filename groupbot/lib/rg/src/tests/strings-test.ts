import { StringManager } from "..";

const stringManager = new StringManager();
const strings = stringManager.getFile("./resources/strings-test-data.txt");

for (let {name, data} of strings) {
	console.log(name + ": " + data);
}
