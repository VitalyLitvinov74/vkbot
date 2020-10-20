import { strict as assert } from "assert";

type CharacterPred = (char: string) => boolean;

type EscapedString = {
	string: string;
	escapedCharacters: Set<number>;
}

type Interval = {
	start: number;
	end: number;

	identifier: string;
}

class Cursor {
	private escapedString: EscapedString;
	private currentIndex: number;

	constructor(escapedString: EscapedString) {
		this.escapedString = escapedString;
		this.currentIndex = 0;
	}

	getCurrentCharacter() {
		if (this.currentIndex < this.escapedString.string.length) {
			return this.escapedString.string[this.currentIndex];
		} else {
			return "\0";
		}
	}

	getCurrentIndex() {
		return this.currentIndex;
	}

	skipCharacter() {
		if (this.currentIndex < this.escapedString.string.length) {
			this.currentIndex++;
		}
	}

	skipCharacters(pred: CharacterPred) {
		while (pred(this.getCurrentCharacter())) {
			this.skipCharacter();
		}
	}

	peekCharacter(
		expectedChar: string, shouldBeNotEscaped: boolean = false
	): boolean {
		if (shouldBeNotEscaped) {
			let index = this.getCurrentIndex();

			if (this.escapedString.escapedCharacters.has(index)) {
				return false;
			}
		}

		return this.getCurrentCharacter() === expectedChar;
	}

	expectAndSkipCharacter(
		expectedChar: string, shouldBeNotEscaped: boolean = false
	): boolean {
		if (!this.peekCharacter(expectedChar, shouldBeNotEscaped)) {
			return false;
		}

		this.skipCharacter();
		return true;
	}

	expectAndSkip(pred: CharacterPred): boolean {
		if (pred(this.getCurrentCharacter())) {
			this.skipCharacter();
			return true;
		} else {
			return false;
		}
	}

	isEndOfString(): boolean {
		return this.escapedString.string.length == this.currentIndex;
	}

	substring(start: number, end: number): string {
		return this.escapedString.string.substring(start, end);
	}
}

function isWhitespace(char: string): boolean {
	return char === " " || char === "\t";
}

function isAlphaOrUnderscore(char: string): boolean {
	if (char >= 'a' && char <= 'z') return true;
	if (char >= 'A' && char <= 'Z') return true;

	if (char === "_") return true;
	return false;
}

function isNumeric(char: string): boolean {
	return char >= '0' && char <= '9';
}

function isAlphaNumeric(char: string): boolean {
	return isAlphaOrUnderscore(char) || isNumeric(char);
}

function tryParseInterval(cursor: Cursor): Interval|null {
	assert(cursor.getCurrentCharacter() === "{");

	let intervalStart = cursor.getCurrentIndex();

	cursor.skipCharacter();
	cursor.skipCharacters(isWhitespace);

	let identifierStart = cursor.getCurrentIndex();

	if (!cursor.expectAndSkip(isAlphaOrUnderscore)) return null;
	cursor.skipCharacters(isAlphaNumeric);

	let identifier = cursor.substring(
		identifierStart, 
		cursor.getCurrentIndex()
	);

	cursor.skipCharacters(isWhitespace);
	if (!cursor.expectAndSkipCharacter("}", true)) return null;

	return {
		start: intervalStart,
		end: cursor.getCurrentIndex(),

		identifier: identifier
	};
}

function findIntervals(escapeResult: EscapedString): Interval[] {
	let cursor = new Cursor(escapeResult);
	let result: Interval[] = [];

	while (!cursor.isEndOfString()) {
		if (cursor.peekCharacter("{", true)) {
			let interval = tryParseInterval(cursor);
			if (interval !== null) {
				result.push(interval);
			}
		} else {
			cursor.skipCharacter();
		}
	}

	return result;
}

function escapeString(string: string): EscapedString {
	let escapedCharacters = new Set<number>();

	let currentCharacter = 0;
	let result = "";

	while (currentCharacter < string.length) {
		let ch = string[currentCharacter];
		if (ch === "\\") {
			currentCharacter++;

			if (currentCharacter === string.length) {
				break;
			}

			escapedCharacters.add(result.length);

			ch = string[currentCharacter];
			result += ch;
		} else {
			result += ch;
		}

		currentCharacter++;
	}

	return {
		string: result,
		escapedCharacters: escapedCharacters
	};
}

export function format(string: string, fields: Record<string, Object>) {
	let escapeResult = escapeString(string);

	let intervals = findIntervals(escapeResult);
	let result = "";

	let cursor = 0;

	for (let i = 0; i < intervals.length; ++i) {
		let interval = intervals[i];
		let substitution = fields[interval.identifier];

		if (substitution !== undefined) {
			result += escapeResult.string.substring(cursor, interval.start);
			result += substitution.toString();
		} else {
			result += escapeResult.string.substring(cursor, interval.end);
		}

		cursor = interval.end;
	}

	result += escapeResult.string.substring(cursor);
	return result;
}
