import { Decimal, DecimalParseError } from "..";
import { assert } from "..";

function assertErrorCode(
	value: string,
	precision: number,
	code: DecimalParseError
) {
	let result = Decimal.parse(value, precision);

	assert(result.is_success === false);
	assert(result.error.code === code);
}

function assertInvalidSyntax(value: string, precision: number) {
	assertErrorCode(value, precision, DecimalParseError.InvalidSyntax);
}

function assertTooHighPrecision(value: string, precision: number) {
	assertErrorCode(value, precision, DecimalParseError.TooHighPrecision);
}

function assertOverflow(value: string, precision: number) {
	assertErrorCode(value, precision, DecimalParseError.Overflow);
}

function assertUnderflow(value: string, precision: number) {
	assertErrorCode(value, precision, DecimalParseError.Underflow);
}

function assertSuccess(
	value: string,
	expected: string,
	precision: number,
	removeZeros: boolean = false
) {
	let result = Decimal.parse(value, precision);

	assert(result.is_success);
	assert(result.data.get(removeZeros) === expected);
}

// Тесты помещены в функцию потому что ТС так лучше печатает ошибки
function testParse() {
	assertSuccess("123", "123.0000", 4);
	assertSuccess("0.3", "0.30", 2);

	assertSuccess(".0", "0.0000", 4);
	assertSuccess("0.", "0.0000", 4);

	assertSuccess(".025", "0.0250", 4);
	assertSuccess("20.", "20.0000", 4);

	assertInvalidSyntax(".", 4);

	// Это особый случай для функции Decimal.get()
	assertSuccess("-.025", "-0.0250", 4);

	assertInvalidSyntax("2.43.2", 4);
	assertInvalidSyntax("3.14NaN", 4);

	assertTooHighPrecision("234.4535423", 4);

	assertSuccess("900719925474.0991", "900719925474.0991", 4);
	assertOverflow("900719925474.3991", 4);
	assertOverflow("900719925474.3992", 4);
	assertOverflow("999999999999999999999999", 4);

	assertSuccess("-900719925474.0991", "-900719925474.0991", 4);
	assertUnderflow("-900719925474.3991", 4);
	assertUnderflow("-900719925474.3992", 4);
	assertUnderflow("-999999999999999999999999", 4);
}

function testRemoveZeros() {
	assertSuccess("0", "0.0", 4, true);
	assertSuccess("0.00", "0.0", 4, true);

	assertSuccess("24.2030", "24.203", 4, true);
	assertSuccess("0.0430", "0.043", 4, true);

	assertSuccess("3.00", "3", 4, true);
	assertSuccess("25000", "25000", 4, true);
}

function testAdd() {
	let coins = new Decimal(4);

	coins.add("35.12");
	coins.add("0.2");

	console.log(coins.get(true));
}

testParse();
testRemoveZeros();
testAdd();
