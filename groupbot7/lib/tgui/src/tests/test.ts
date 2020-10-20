import { TelegramUI } from "../";
import { Message, CallbackQuery } from "tg";
import { FormEntry, FormTypes } from "form-types";
import { InlineMenuLabeled, InlineButtonArgument } from "inline-types";

let tg = new TelegramUI("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

let questions: FormEntry[] = [
	{
		label: "age",
		default: 20,
		q: async () => {
			return "Ввеaдите фвыа выфа";
		},
		type: FormTypes.Number,
		range: [0, 500],
		postHandler: () => {
			return true;
		}
	},
	{
		label: "name",
		q: "Введите ваше имя",
		type: FormTypes.Custom,
		validator: (msg) => {
			if(!msg.text) {
				return { error: "Пришлите текстовое сообщение!" };
			}

			if(msg.text.length > 32) {
				return { error: "Слишком длинное!" };
			}

			return { data: msg.text };
		},
		postHandler: (a, b) => {
			tg.setFormBranch(707830248, q2);
			return true;
		}
	}
];

let q3: FormEntry[] = [
	{
		label: "tb",
		q: async () => {
			return "Тестовый вопрос другой ветки 333 (число)";
		},
		type: FormTypes.Number,
		range: [0, 500],
		postHandler: () => {
			return true;
		}
	}
]

let q2: FormEntry[] = [
	{
		label: "testbranch",
		q: async () => {
			return "Тестовый вопрос другой ветки (число)";
		},
		type: FormTypes.Number,
		range: [0, 500],
		postHandler: () => {
			tg.setFormBranch(707830248, q3);
			return true;
		}
	}
]

function handler(msg: CallbackQuery, args?: InlineButtonArgument[]): void {
	console.log(msg.from.id, args);
}

let c = tg.defineInlineCallback("testCallback", handler);

let res = tg.defineInline({
	label: "TestHandler",
	message: "Test Inline Menu!",
	layout: 2,
	buttons: [
		{ text: "Test 1", url: "example.com" },
		{ text: "Test 2", url: "example.com" },
		{ text: "Test 3", handler: c }
	]
});

let inline: InlineMenuLabeled = {
	label: "main",
	message: "Test Inline Menu!",
	layout: 2,
	buttons: [
		{ text: "Test 2", url: "example.com" },
		{
			text: "Example",
			handler: res,
			//arguments: ["15", "22", "Tost"]
		}
	]
}

let inlineHandle = tg.defineInline(inline);

async function test() {
	tg.messages.on(async (msg: Message) => {
		if(msg.text === "e") {
			tg.sendInline(msg.chat.id, inlineHandle);

			return;
		}

		if(msg.text === "q") {
			tg.sendMenu(707830248, {
				message: "Test",
				//photo: "https://realgrace.me/underconstruction.jpg",
				buttons: [
					{
						text: "Кнопка 1",
						handler: function(msg) {
							tg.sendUIMessage(msg.chat.id, {
								text: "Hello, world!"
							});
						}
					},
					{ text: "Кнопка 2", handler: "Test 2" },
					{ text: "Кнопка 3", handler: "Test 3" },
					{ text: "Кнопка 4", handler: "Test 4" }
				]
			});
		}

		if(msg.text === "w") {
			let result = await tg.sendForm(msg.chat.id, questions);

			if(!result.is_success) {
				console.log("Ошибка", result.error);
				return;
			}

			console.log("Результат:", result.data);
		}
	});

	tg.start();
}

test();