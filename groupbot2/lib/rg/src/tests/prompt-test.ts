import { prompt } from "..";
import { timeout } from "..";

async function bg() {
	let i = 5;

	while(i--) {
		console.log("Test");
		await timeout(1000);
	}
}

//bg();

async function test() {
	while(true) {
		let age: string = await prompt("Введите ваш возраст: ");
		console.log("Ваш возраст: " + age);

		if(+age > 50) {
			break;
		}
	}
	
}

test();