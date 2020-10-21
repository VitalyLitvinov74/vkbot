import { TelegramClient, ErrorCodes } from "../"
import { ParseModes, Message } from "types";
import { timeout } from "rg";
import { readFileSync } from "fs";

async function test() {
	let tg = new TelegramClient("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

	let result = await tg.sendDocument(707830248, {
		data: Buffer.from([1, 2, 3, 4, 5]),
		filename: "test.bin"
	});

	if(!result.is_success) {
		if(result.error.code === ErrorCodes.TelegramAPIError) {
			console.error(result.error);
			return;
		}
		
		return;
	}

	console.log(result.data.message_id);

	await timeout(2000);

	let result2 = await tg.editMessageCaption({
		message_id: result.data.message_id,
		chat_id: result.data.chat.id,
		caption: "Hello, world!"
	});

	console.log(result2);
}

test();