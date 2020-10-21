import { TelegramUI } from "../";
import { ParseModes } from "tg";

let tg = new TelegramUI("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

async function test() {
	tg.setDefaultOptions({
		parse_mode: ParseModes.HTML
	})

	let result = await tg.sendDocument(-416898716, {
		data: Buffer.from([1, 2, 3]),
		filename: "test.bin"
	}, "Привет <b>там</b>!");
	
	console.log(result);
}

test();