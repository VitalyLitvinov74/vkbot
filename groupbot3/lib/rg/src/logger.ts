import { Colors } from "./colors"
import * as util from "util"
import * as fs from "./fs"
import { PathLike } from "fs"
import { mutexLockOrAwait, mutexUnlock } from "./mutex"

const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

import {
	isProduction,
	getDateHumanReadable,
	getTimeHumanReadable
} from ".";

import { FileHandle } from "./fs/filehandle"

type FileDescriptor = {
	filename: string|null;
	fh: FileHandle|null;
}

// Файловый дескриптор для обычных логов
let fdLogs: FileDescriptor = {
	filename: null,
	fh: null
};

// Файловый дескриптор для ошибок
let fdErrors: FileDescriptor = {
	filename: null,
	fh: null
};

// Файловый дескриптор для предупреждений
let fdWarnings: FileDescriptor = {
	filename: null,
	fh: null
};

const LOGS_DIRECTORY = "./logs";
const ERRORS_DIRECTORY = LOGS_DIRECTORY + "/errors";
const WARNINGS_DIRECTORY = LOGS_DIRECTORY + "/warnings";

function debug(...args: any[]): void {
	if(isProduction()) {
		return;
	}

	log(...args);
}

function warn(...args: any[]): void {
	const prefix = "Warning:";

	if(isProduction()) {
		let entry = util.format(prefix + " %s", ...args);

		writeToLogFile(WARNINGS_DIRECTORY, entry, fdWarnings);
		return;
	}

	originalWarn(
		"%s %s%s",
		Colors.FgYellow + prefix + Colors.Reset,
		...args,
		Colors.Reset
	);
}

function error(...args: any[]): void {
	const prefix = "Error:";

	if(isProduction()) {
		let entry = util.format(prefix + " %s", ...args);

		writeToLogFile(ERRORS_DIRECTORY, entry, fdErrors);
		return;
	}
	
	originalError(
		"%s %s%s",
		Colors.BgRed + prefix,
		...args,
		Colors.Reset
	);
}

function log(...args: any[]): void {
	if(isProduction()) {
		let entry = util.format("%s", ...args);

		writeToLogFile(LOGS_DIRECTORY, entry, fdLogs);
		return;
	}

	originalLog(...args);
}

async function writeToLogFile(
	dir: PathLike,
	entry: string,
	fd: FileDescriptor
): Promise<void> {
	await mutexLockOrAwait("librg_log_file_appending");

	if(!isDirectoryChecked) {
		await checkLogsDirectory();
	}

	let now: number = Date.now();

	let date: string = getDateHumanReadable(now);
	let time: string = getTimeHumanReadable(now);

	let filename = date + ".txt";
	let path: PathLike = dir + "/" + filename;
	let data = "[" + time + "]" + " " + entry + "\n";

	if(fd.filename !== filename) {
		if(fd.fh) {
			fd.fh.close();
			fd.fh = null;
		}
		
		let fhOpeningResult = await fs.open(path, "a");

		if(fhOpeningResult.is_success === false) {
			console.error(
				"File handle opening error:",
				fhOpeningResult.error.message
			);
		}else{
			fd.filename = filename;
			fd.fh = fhOpeningResult.data;
		}
	}

	if(fd.fh) {
		await fd.fh.appendFile(data);
	}else{
		console.error(
			"Log File Handle is not accessable, logging here:\n",
			data
		);
	}

	mutexUnlock("librg_log_file_appending");
}

let isDirectoryChecked: boolean = false;

async function checkLogsDirectory(): Promise<void> {
	if(isDirectoryChecked) {
		return;
	}

	isDirectoryChecked = true;

	let directory: string[]|void = await getDirectory(LOGS_DIRECTORY);

	if(!directory) {
		return;
	}

	await getDirectory(ERRORS_DIRECTORY);
	await getDirectory(WARNINGS_DIRECTORY);
}

async function getDirectory(path: PathLike): Promise<string[]|void> {
	let directoryResult = await fs.readDirectory(path);
	
	if(directoryResult.is_success === false) {
		let mkdirResult = await fs.mkdir(path);

		if(mkdirResult.is_success === false) {
			console.error(
				"Creation directory error:",
				mkdirResult.error.message
			);

			return;
		}

		directoryResult = await fs.readDirectory(path);

		if(directoryResult.is_success === false) {
			console.error(
				"Get directory after creation error:",
				directoryResult.error.message
			);

			return;
		}
	}

	return directoryResult.data;
}

console.log = log;
console.debug = debug;
console.error = error;
console.warn = warn;

export {}