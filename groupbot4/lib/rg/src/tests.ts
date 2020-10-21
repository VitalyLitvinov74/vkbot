import * as childProcess from "child_process";
import { PathLike } from "fs";
import * as readline from "readline";

import {
	readDirectory,
	isDirectory
} from ".";

import { Colors } from "./colors";

export async function runTests(path: PathLike) {
	const tests = await getTestFiles(path);

	if(!tests) {
		return;
	}

	for(const test of tests) {
		process.stdout.write(
			"[" + Colors.FgCyan + "TEST" + Colors.Reset + "] "
			+ test
			+ "..."
		);

		const result = await runTest(path + "/" + test);

		readline.clearLine(process.stdout, 0)
		readline.cursorTo(process.stdout, 0);

		if(result) {
			console.log(
				"[" + Colors.FgRed + "FAIL" + Colors.Reset + "]",
				test,
				"\n",
				result
			);

			return;
		}

		console.log(
			"[" + Colors.FgGreen + "PASS" + Colors.Reset + "]",
			test
		);
	}
}

async function runTest(path: PathLike): Promise<string | null> {
	return new Promise((resolve) => {
		childProcess.exec("node " + path, (_err, _stdout, stderr) => {
			if(!stderr) {
				resolve(null);
				return;
			}
			
			resolve(stderr);
		});
	});
}

async function getTestFiles(path: PathLike): Promise<string[] | undefined> {
	let directoryResult = await readDirectory(path);

	if(!directoryResult.is_success) {
		console.error(
			"Directory read error:",
			directoryResult.error.code,
			directoryResult.error.message
		);

		return;
	}

	let directory = directoryResult.data;

	let files: string[] = [];

	for(let entry of directory) {
		if(!entry.endsWith(".js")) {
			continue;
		}

		let isDirResult = await isDirectory(path);

		if(!isDirResult.is_success) {
			console.error(
				"Directory or file check error:",
				isDirResult.error.code,
				isDirResult.error.message
			);
	
			return;
		}

		let isDir = isDirResult.data;

		if(!isDir) {
			continue;
		}

		files.push(entry);
	}

	return files;
}