import { timeout, setProduction, assert } from "..";

setProduction();

function assertionFail() {
	assert(false);
}

function func() {
	throw new Error("Test fatal exception")
}

async function asyncFunc() {
	await timeout(100);
	throw new Error("Test fatal rejection");
}

function main() {
	setTimeout(() => { asyncFunc(); }, 0);
	setTimeout(() => { func(); }, 0);
	setTimeout(() => { assertionFail(); }, 0);
}

main();