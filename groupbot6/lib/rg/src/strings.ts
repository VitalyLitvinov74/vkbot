import * as fs from "fs";

import { assert } from ".";

type Storage = {
	[index: string]: string | undefined;
}

type ReadOnlyStorage = Readonly<Storage>;

export type StringsEntry = {
	name: string,
	data: string
};

class File {
	private fileName: string;
	private manager: StringManager;

	private readonly storage: ReadOnlyStorage;

	constructor(
		fileName: string,
		manager: StringManager,
		storage: ReadOnlyStorage
	) {
		this.fileName = fileName;

		this.manager = manager;
		this.storage = storage;
	}

	count() {
		return Object.keys(this.storage).length;
	}

	set(name: string, value: string) {
		this.manager.setString(this.fileName, name, value);
	}

	get(name: string): string {
		let result = this.storage[name];

		if (result === undefined) {
			console.error("string not found: " + name);
			result = "❓";
		}

		return result;
	}

	remove(name: string) {
		this.manager.removeString(this.fileName, name);
	}

	*[Symbol.iterator](): Iterator<StringsEntry> {
		for (let [name, data] of Object.entries(this.storage)) {
			if (data === undefined) continue;

			yield {
				name: name,
				data: data
			};
		}
	}
}

type FileEntry = {
	file: File;
	storage: Storage;
}

type EntriesMap = Map<string, FileEntry>;

export class StringManager {
	private entries: EntriesMap = new Map<string, FileEntry>();

	getFile(fileName: string): File {
		let entry = this.entries.get(fileName);

		if (entry === undefined) {
			let storage = this.parseFile(fileName);

			entry = {
				file: new File(fileName, this, storage),
				storage: storage
			};

			this.entries.set(fileName, entry);
		}

		return entry.file;
	}
	
	setString(fileName: string, stringName: string, stringValue: string) {
		assert(this.stringNameIsValid(stringName));

		let entry = this.entries.get(fileName);
		assert(entry !== undefined);

		entry.storage[stringName] = stringValue;
		this.saveStringsToFile(fileName);
	}

	removeString(fileName: string, stringName: string) {
		let entry = this.entries.get(fileName);

		if (entry !== undefined) {
			delete entry.storage[stringName];
			this.saveStringsToFile(fileName);
		}
	}

	private saveStringsToFile(fileName: string) {
		let entry = this.entries.get(fileName);
		let result = "";

		assert(entry !== undefined);

		let keys = Object.keys(entry.storage);

		for (let i = 0; i < keys.length; ++i) {
			let stringName = keys[i];
			let stringValue = entry.storage[stringName];

			assert(typeof stringValue === "string");

			let lines = stringValue.split("\n");

			if (result != "") {
				result += "\n";
			}

			result += stringName + ":\n";

			for (let i = 0; i < lines.length; ++i) {
				result += "\t" + lines[i];

				if (i != lines.length - 1) {
					result += "\n";
				}
			}
		}

		fs.writeFileSync(fileName, result);
	}

	private stringNameIsValid(stringName: string): boolean {
		return /^\w+$/.test(stringName);
	}

	private tryParseStringName(line: string): string|null {
		let regex = /^(\w+): *$/;
		let result = regex.exec(line);

		if (result) {
			return result[1];
		} else {
			return null;
		}
	}

	private stringIsCompletelyEmpty(line: string): boolean {
		for (let i = 0; i < line.length; ++i) {
			if (line[i] !== ' ' && line[i] !== '\t') {
				return false;
			}
		}

		return true;
	}

	private tryParseRegularLine(line: string): string|null {
		if (this.stringIsCompletelyEmpty(line)) {
			return "";
		}

		let regex = /^(    |\t)(.+)$/;
		let result = regex.exec(line);

		if (result) {
			return result[2];
		} else {
			return null;
		}
	}

	private parseFile(fileName: string): Storage {
		let content = fs.readFileSync(fileName, "utf-8");
		let lines = content.split(/\r\n|\r|\n/);

		let result: Storage = {};

		let currentStringName: string|null = null;
		let currentString = "";

		for (let i = 0; i < lines.length; ++i) {
			let line = lines[i];

			let stringName = this.tryParseStringName(line);

			if (stringName !== null) {
				if (currentStringName) {
					result[currentStringName] = currentString;
				}

				if (result.hasOwnProperty(stringName)) {
					let errorMessage =
						`Duplicate string name (${fileName}:${i+1}): ${line}`;
					throw new Error(errorMessage);
				}

				currentStringName = stringName;
				currentString = "";
			} else {
				let string = this.tryParseRegularLine(line);

				if (string !== null) {
					if (currentString === "") {
						currentString = string;
					} else {
						currentString += "\n" + string;
					}
				} else {
					let errorMessage = 
						`Parse error (${fileName}:${i+1}): ${line}`;
					throw new Error(errorMessage);
				}
			}
		}

		if (currentStringName) {
			result[currentStringName] = currentString;
		}

		return result;
	}
}