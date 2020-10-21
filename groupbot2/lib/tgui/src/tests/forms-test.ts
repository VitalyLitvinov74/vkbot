import { TelegramUI } from "../";
import { FormEntry, FormTypes, FormErrorCodes } from "form-types";
import { Message } from "tg";
import { Menu } from "menu";
import { RawMenu } from "menu-types";

let tg = new TelegramUI("1094496998:AAHfJvuEL8oJYkoppXXMt-biTiJkOreUkww");

let questions: FormEntry[] = [
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
		postHandler: (result, input) => {
			if(input.length >= 8) {
				tg.setFormBranch(707830248, branch1);
			}else if(input.length <= 4) {
				tg.setFormBranch(707830248, branch2);
			}
			
			return true;
		}
	},
	{
		label: "lastname",
		q: "Введите вашу фамилию",
		type: FormTypes.String,
		range: [1, 32]
	}
];

let branch1: FormEntry[] = [
	{
		label: "age",
		default: 33,
		q: "Введите ваш возраст",
		type: FormTypes.Number,
		range: [0, 500],
		postHandler: (result, input) => {
			//tg.setFormBranch(707830248, questions);
			return true;
		}
	}
];

let branch2: FormEntry[] = [
	{
		label: "height",
		//default: 20,
		q: "Введите ваш рост",
		type: FormTypes.Number,
		range: [0, 500]
	}
];

async function test() {
	let result = await tg.sendForm(707830248, questions);

	console.log("Результат", result);
}

test();

tg.start();