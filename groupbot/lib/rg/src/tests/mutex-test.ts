import { mutexLockOrAwait, mutexUnlock } from "../mutex"

function timeout(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

async function testWithoutMutex(n: number) {
	let randomTime = Math.round(Math.random() * 100);
	await timeout(randomTime);
	
	console.log(n);
}

async function testWithMutex(n: number) {
	await mutexLockOrAwait("Test");
	
	let randomTime = Math.round(Math.random() * 100);
	await timeout(randomTime);
	
	console.log(n);
	
	mutexUnlock("Test");
}

async function test() {
	console.log("Тестирую без мьютексов:");
	
	let testPromises: Promise<void>[] = [];
	
	for(let i = 0; i < 10; i++) {
		let result = testWithoutMutex(i);
		testPromises.push(result);
	}
	
	await Promise.all(testPromises);
	
	console.log("Тестирую с мьютексами:");
	
	testPromises = [];
	
	for(let i = 0; i < 10; i++) {
		let result = testWithMutex(i);
		testPromises.push(result);
	}
	
	await Promise.all(testPromises);
	
	console.log("Готово!");
}

test();

export {}