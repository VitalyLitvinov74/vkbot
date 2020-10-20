import { TelegramUI, CommandArgTypes } from "../";
import { Message, ParseModes } from "tg";

let tg = new TelegramUI("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

let admin = tg.createCommandTerminal(-416898716);

admin.setCommand("/test", "Тест", testHandler);

admin.setHelp("/help");

function testHandler(msg: Message) {
	return "Tost";
}

admin.setCommand("/b", "Рассылка", broadcastHandler, [
	{
		name: "Префикс",
		type: CommandArgTypes.Word
	},
	{
		name: "Число",
		type: CommandArgTypes.Number
	},
	{
		name: "Строка1",
		type: CommandArgTypes.String
	},
	{
		name: "Строка2",
		type: CommandArgTypes.String
	},
	{
		name: "Текст рассылки",
		type: CommandArgTypes.Text
	}
] as const);

function broadcastHandler(msg: Message, args: readonly [string, number, string, string, string]) {
	console.log(args);
	return args[4];
}

admin.setCommand("/up", "Пополнить баланс", userHandler, [
	{
		name: "Имя пользователя",
		type: CommandArgTypes.Word
	},
	{
		name: "Сумма",
		type: CommandArgTypes.Number
	}
] as const);

function userHandler(msg: Message, args: readonly [string, number]): undefined {
	console.log(args);
	return undefined;
}

admin.setCommand("/num", "Тест числа", numHandler, [
	{
		name: "Число на тест",
		type: CommandArgTypes.Number
	}
] as const);

function numHandler(msg: Message, args: readonly [number]): string {
	return args[0] + "";
}

tg.start();