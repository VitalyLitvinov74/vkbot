import { promises } from "fs"

import {
	RGResult as Result,
	getRGErrorByError as getError
} from "../result"

export class FileHandle {
	private fh: promises.FileHandle;

	constructor(fh: promises.FileHandle) {
		this.fh = fh;
	}

	public async write(
		buffer: Buffer,
		offset?: number,
		length?: number,
		position?: number
	): Promise<Result<void>> {
		try {
			await this.fh.write(buffer, offset, length, position);
		}catch(err) {
			return getError(err);
		}

		return {
			is_success: true,
			data: undefined
		};
	}

	public async writeFile(data: any, options?: object|string): Promise<Result<void>> {
		try {
			await this.fh.writeFile(data, options);
		}catch(err) {
			return getError(err);
		}

		return {
			is_success: true,
			data: undefined
		};
	}

	public async appendFile(data: any, options?: object|string): Promise<Result<void>> {
		try {
			await this.fh.appendFile(data, options);
		}catch(err) {
			return getError(err);
		}

		return {
			is_success: true,
			data: undefined
		};
	}

	public async close(): Promise<Result<void>> {
		try {
			await this.fh.close();
		}catch(err) {
			return getError(err);
		}

		return {
			is_success: true,
			data: undefined
		};
	}
}