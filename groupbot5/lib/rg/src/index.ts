import "./logger";
import { strict as nativeAssert } from "assert";

process.on('uncaughtException', (err) => {
	console.error(
		'Unhandled Exception at:',
		err.stack,
		"\n"
	);
});

process.on('unhandledRejection', (reason, p) => {
	console.error('Unhandled Rejection at:', p, 'reason:', reason, "\n");
});

let isProd: boolean = false;

export function setProduction(): void {
	isProd = true;
}

export function isProduction(): boolean {
	return isProd;
}

export function getMergedObjects<T>(
	source: Record<string, any>,
	target: Record<string, any>
): T {
	let result: { [key: string]: any } = {};
	
	for(let i in source) {
		if(i in target) {
			if(typeof source[i] !== typeof target[i]) {
				throw new Error("Merging failed, incompatible types for key: " + i);
			}
			
			if(typeof source[i] === "object") {
				result[i] = getMergedObjects<T>(source[i], target[i]);
			}else{
				result[i] = target[i];
			}
		}else{
			result[i] = source[i];
		}
	}

	for(let i in target) {
		if(!(i in source)) {
			result[i] = target[i];
		}
	}
	
	return <T> result;
}

export function parseDateTime(text: string): number | null {

	const blocks: string[] = text.split(" ");

	let time: number = Math.floor(new Date().getTime() / 1000);

	if(text.includes(".")) {

		if(blocks.length !== 2) {
			return null;
		}

		const date = blocks[0].split(".");
		const ptime = blocks[1].split(":");

		const covertedValue = Math.floor(Date.UTC(
			+(date[2]), 
			+(date[1]) - 1, 
			+(date[0]),
			+(ptime[0]),
			+(ptime[1])
		) / 1000);

		if(isNaN(covertedValue)) {
			return null;
		}

		return covertedValue;
	}

	const hours: number = +blocks[0].split(":")[0];
	const minutes: number = +blocks[0].split(":")[1];

	const dateNow: Date = new Date(time*1000);

	time += (hours - dateNow.getHours())*3600;
	time += (minutes - dateNow.getMinutes())*60;

	return time;
}

export function isNumberEven(num: number) {
	return !( num & 1 );
}

export function isNumberOdd(num: number) {
	return !isNumberEven(num);
}

export function isURL(str: string): boolean {
	let pattern = new RegExp(
		'^(https?:\\/\\/)?'+
		'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+
		'((\\d{1,3}\\.){3}\\d{1,3}))'+
		'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+
		'(\\?[;&a-z\\d%_.~+=-]*)?'+
		'(\\#[-a-z\\d_]*)?$','i'
	);
	
	return !!pattern.test(str);
}

export function escapeHtml(unsafe: string): string {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

export function getNumberWithDots(x: number): string {
	// Возвращает число с разделёнными точкой разрядами (например: 50.000)
	return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function timeout(ms: number): Promise<NodeJS.Timeout> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export function getRandom(min: number, max: number): number {
	let rand: number = min + Math.random() * (max + 1 - min);
	return Math.floor(rand);
}

export function getRandomString(len: number = 16) {
	let result = "";
	let charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

	for (let i = 0, n = charset.length; i < len; ++i) {
		result += charset.charAt(Math.floor(Math.random() * n));
	}

	return result;
}

export function clamp(n: number, min: number, max: number): number {
	if (n < min) return min;
	if (n > max) return max;

	return n;
}

export function clampRange(n: number, range: number[]): number {
	return clamp(n, range[0], range[1]);
}

export function getTimeHumanReadable(mstime: number): string {
	let date = new Date(mstime);
	
	let hours = "0" + date.getHours();
	let minutes = "0" + date.getMinutes();
	let seconds = "0" + date.getSeconds();

	return hours.substr(-2) + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);
}

export function getDateHumanReadable(mstime: number): string {
	let date = new Date(mstime);
	
	let day = "0" + date.getDate();
	let month = "0" + (date.getMonth() + 1);
	let year = date.getFullYear();

	return day.substr(-2) + '.' + month.substr(-2) + '.' + year;
}

export function assert(expression: any): asserts expression {
	nativeAssert(expression);
}

export { Bitmap } from "./bitmap";
export { Event } from "./events";
export { Colors } from "./colors";
export { mutexLockOrAwait, mutexUnlock } from "./mutex";
export { prompt } from "./prompt";
export { getRGErrorByError, RGResult, RGSuccess, RGError } from "./result";
export { format } from "./format";
export { StringManager } from "./strings";
export * from "./decimal";
export * from "./fs";
export * from "./tests";