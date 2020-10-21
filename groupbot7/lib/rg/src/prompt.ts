import * as readline from "readline"

export function prompt(question: string = "> "): Promise<string> {
	const inputInterface: readline.Interface = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
		prompt: question
	});

	inputInterface.prompt();

	return new Promise((resolve) => {
		inputInterface.on("line", (inputResult: string) => {
			inputInterface.close();
			resolve(inputResult);
		});
	});
}