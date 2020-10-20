export type FormDataFile = {
	filename: string;
	data: Buffer;
}

type FormDataOption = string | number | FormDataFile;
type FormDataOptions = Record<string, FormDataOption>;

type FormData = {
	data: Buffer;
	boundary: string;
}

function generateBoundary(): string {
	let boundary = '';
	for (var i = 0; i < 24; i++) {
		boundary += Math.floor(Math.random() * 10).toString(16);
	}

	return boundary;
}

export function getFormData(options: FormDataOptions): FormData {
	let ret: Buffer = Buffer.allocUnsafe(0);

	const bPrefix = "--";
	const boundary = generateBoundary();

	for(const option of Object.entries(options)) {
		let element: Buffer = Buffer.from(bPrefix + boundary);
		let contentType = "text/plain";

		const [key, value] = option;

		let file: FormDataFile | null = null;

		if(typeof value === "object") {
			file = value;
		}

		if(file) {
			contentType = "application/octet-stream";
		}

		element = Buffer.concat([element, Buffer.from("\r\nContent-Type: " + contentType)]);
		element = Buffer.concat([element, Buffer.from(
			"\r\nContent-Disposition: form-data; name=\"" + key + "\""
		)]);

		if(file) {
			element = Buffer.concat([element, Buffer.from("; filename=\"" + file.filename + "\"")]);
		}

		if(file) {
			const fileData = Buffer.concat([ Buffer.from("\r\n\r\n"), file.data ]);
			element = Buffer.concat([element, fileData ]);
		} else {
			element = Buffer.concat([element, Buffer.from("\r\n\r\n" + value.toString())]);
		}
		
		ret = Buffer.concat([ret, element, Buffer.from("\r\n")]);
	}

	if(ret.length === 0) {
		throw new Error("Input is empty");
	}

	return {
		data: Buffer.concat([ret, Buffer.from(bPrefix + boundary + bPrefix + "\r\n")]),
		boundary: boundary
	};
}