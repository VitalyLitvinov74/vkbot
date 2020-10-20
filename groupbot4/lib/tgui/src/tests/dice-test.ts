import { TelegramUI } from "../";

let tg = new TelegramUI("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

async function test() {
	let result = await tg.sendDice(-416898716);
	console.log(result);
}

test();