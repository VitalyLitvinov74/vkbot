import { TelegramClient, ErrorCodes } from "../"
import { ParseModes, Message } from "types";
import { timeout } from "rg";

async function test() {
	let tg = new TelegramClient("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

	tg.start();

	tg.messages.on((msg: Message) => {
		if(msg.text) {
			tg.sendMessage(msg.chat.id, msg.text);
		}
	})

	let result = await tg.sendPhoto(707830248, "https://realgrace.me/underconstruction.jpg", {
		parse_mode: ParseModes.HTML
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