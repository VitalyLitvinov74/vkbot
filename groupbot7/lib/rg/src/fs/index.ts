import * as fs from "fs"
import { FileHandle } from "./filehandle"

import {
	RGResult as Result,
	getRGErrorByError as getError
} from "../result"

const fsPromises = fs.promises;

type FSStats = fs.Stats|fs.BigIntStats;

export async function open(
	path: fs.PathLike,
	flags: string|number
): Promise<Result<FileHandle>> {
	let fh: fs.promises.FileHandle|null = null;

	try {
		fh = await fs.promises.open(path, flags);
	}catch(err) {
		return getError(err);
	}

	return {
		is_success: true,
		data: new FileHandle(fh)
	};
}

export function isDirectory(path: fs.PathLike): Promise<Result<boolean>> {
	return new Promise((resolve) => {
		fs.stat(path, (err: NodeJS.ErrnoException|null, stat:FSStats) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: stat.isDirectory()
			});
		});
	});
}

export function mkdir(path: fs.PathLike): Promise<Result<void>> {
	return new Promise((resolve) => {
		fs.mkdir(path, (err: NodeJS.ErrnoException|null) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: undefined
			});
		});
	});
}

export function readDirectory(path: fs.PathLike): Promise<Result<string[]>> {
	return new Promise((resolve) => {
		fs.readdir(path, (err: NodeJS.ErrnoException|null, result: string[]) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: result
			});
		});
	});
}

export function readFile(path: fs.PathLike): Promise<Result<Buffer>> {
	return new Promise((resolve) => {
		fs.readFile(path, (err: NodeJS.ErrnoException|null, result: Buffer) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: result
			});
		});
	});
}

export function writeFile(path: fs.PathLike, data: any): Promise<Result<void>> {
	return new Promise((resolve) => {
		fs.writeFile(path, data, (err: NodeJS.ErrnoException|null) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: undefined
			});
		});
	});
}

export function appendFile(path: fs.PathLike, data: any): Promise<Result<void>> {
	return new Promise((resolve) => {
		fs.appendFile(path, data, (err: NodeJS.ErrnoException|null) => {
			if(err) {
				return resolve(getError(err));
			}
			
			resolve({
				is_success: true,
				data: undefined
			});
		});
	});
}