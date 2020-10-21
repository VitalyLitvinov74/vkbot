import { assert } from ".";
import { RGResult, RGError } from "./result";

export enum DecimalParseError {
	InvalidSyntax,
	Overflow,
	Underflow,
	TooHighPrecision
}

export class Decimal {
	private accuracy: number;
	private storage: number = 0;

	constructor(accuracy: number) {
		assert(accuracy > 0);
		this.accuracy = accuracy;
	}

	private static removeTrailingZeros(value: string): string {
		let zerosCount = 0;

		for (let i = 0; i < value.length; ++i) {
			let inverseIndex = (value.length - 1) - i;

			if (value[inverseIndex] === "0") {
				zerosCount++;
			} else {
				break;
			}
		}

		return value.slice(0, value.length - zerosCount);
	}

	private getAbsolute(value: number, removeZeros: boolean) {
		if (removeZeros && value === 0) {
			return "0.0";
		}

		let raw = value + "";

		if (raw.length > this.accuracy) {
			let index = raw.length - this.accuracy;

			let before = raw.slice(0, index);
			let after = raw.slice(index);

			if (removeZeros) {
				after = Decimal.removeTrailingZeros(after);
			}

			if (after.length === 0) {
				return before;
			} else {
				return before + "." + after;
			}
		} else {
			let zerosCount = this.accuracy - raw.length;
			let result = "0.";

			for (let i = 0; i < zerosCount; ++i) {
				result += "0";
			}

			if (removeZeros) {
				result += Decimal.removeTrailingZeros(raw);
			} else {
				result += raw;
			}

			return result;
		}
	}

	public get(stripZeros: boolean = false): String {
		if (this.storage < 0) {
			return "-" + this.getAbsolute(-this.storage, stripZeros);
		} else {
			return this.getAbsolute(this.storage, stripZeros);
		}
	}

	public set(value: string): void {
		let parseResult = Decimal.parse(value, this.accuracy);
		assert(parseResult.is_success);

		this.storage = parseResult.data.storage;
	}

	public add(valueToAdd: string): void {
		let parseResult = Decimal.parse(valueToAdd, this.accuracy);
		assert(parseResult.is_success);

		this.addDecimal(parseResult.data);
	}

	public addDecimal(other: Decimal) {
		assert(this.accuracy === other.accuracy);
		this.storage += other.storage;
	}

	private static isOverflowed(integer: string): boolean {
		let maxValue = Number.MAX_SAFE_INTEGER.toString();

		if (integer.length > maxValue.length) return true;
		if (integer.length < maxValue.length) return false;

		for (let i = 0; i < integer.length; ++i) {
			let digit = integer.charCodeAt(i);
			let maxDigit = maxValue.charCodeAt(i);

			if (digit > maxDigit) return true;
			if (digit < maxDigit) return false;
		}

		return false;
	}

	private static isNumeric(char: string): boolean {
		let min = "0".charCodeAt(0);
		let max = "9".charCodeAt(0);

		let charCode = char.charCodeAt(0);

		return charCode >= min && charCode <= max;
	}

	public static parse(
		value: string,
		precision: number
	): RGResult<Decimal, DecimalParseError> {
		const invalidSyntaxError: RGError = {
			is_success: false,
			error: {
				code: DecimalParseError.InvalidSyntax
			}
		};

		let decimalPointOffset = 0;
		let hadDecimalPoint = false;

		let isNegative = false;

		let place = 0;
		let longInteger = "";

		for (let i = 0; i < value.length; ++i) {
			let ch = value[i];

			if (ch === "-") {
				if (i !== 0) {
					return invalidSyntaxError;
				}

				isNegative = true;
			} else if (ch === ".") {
				if (hadDecimalPoint) {
					return invalidSyntaxError;
				}

				let inverseIndex = (value.length - 1) - i;

				decimalPointOffset = inverseIndex;
				hadDecimalPoint = true;
			} else if (this.isNumeric(ch)) {
				longInteger += ch;
				place++;
			} else {
				return invalidSyntaxError;
			}
		}

		if (longInteger.length === 0) {
			return invalidSyntaxError;
		}

		if (hadDecimalPoint && decimalPointOffset > precision) {
			return {
				is_success: false,
				error: {
					code: DecimalParseError.TooHighPrecision
				}
			};
		}

		// Если в числе не было десятичной точки,
		// decimalPointOffset будет корректное значение -- 0
		const zerosToAdd = precision - decimalPointOffset;

		for (let i = 0; i < zerosToAdd; ++i) {
			longInteger += "0";
		}

		if (this.isOverflowed(longInteger)) {
			return {
				is_success: false,
				error: {
					code: isNegative ?
						DecimalParseError.Underflow :
						DecimalParseError.Overflow
				}
			};
		}

		const result = new Decimal(precision);

		if (isNegative) {
			result.storage = -(+longInteger);
		} else {
			result.storage = +longInteger;
		}

		return {
			is_success: true,
			data: result
		};
	}
}