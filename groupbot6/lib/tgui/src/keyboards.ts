import { FormEntry } from "./form-types";
import { Layout } from "./types";
import { assert } from "rg";

import {
	KeyboardButton,
	ReplyKeyboardMarkup,
	InlineKeyboardMarkup,
	InlineKeyboardButton
} from "tg";

import {
	Button,
	RawMenu
} from "./menu-types";

import {
	InlineButton,
	InlineButtonClosure,
	InlineMenuLabeled,
	isInlineHandle
} from "./inline-types";

import { DELIMETER } from "./inline-manager";

export function getTelegramButton(btn: Button): KeyboardButton {
	return {
		text: btn.text
	};
}

export function getKeyboardFromMenu(menu: RawMenu): ReplyKeyboardMarkup {
	let keyboard: KeyboardButton[][] = [];
	let layout = menu.layout;

	if(!layout) {
		for(let btn of menu.buttons) {
			let telegramButton = getTelegramButton(btn);
			keyboard.push([telegramButton]);
		}
	}

	if(Array.isArray(layout)) {
		let c = 0;
		
		for(let i = 0; i < layout.length; i++) {
			keyboard.push([]);
			
			for(let j = 0; j < layout[i]; j++) {
				let telegramButton = getTelegramButton(menu.buttons[c]);

				keyboard[keyboard.length - 1].push(telegramButton);
				c++;
			}
		}
	}

	if(typeof(layout) === "number") {
		let c = 0;
		
		for(let btn of menu.buttons) {
			if(c === 0) {
				keyboard.push([]);
			}
			
			let telegramButton = getTelegramButton(btn);

			keyboard[keyboard.length - 1].push(telegramButton);
			c++;
			
			if(c === layout) {
				c = 0;
			}
		}
	}

	return {
		keyboard,
		resize_keyboard: true
	}
}

export function getKeyboardFromFormEntry(formEntry: FormEntry): ReplyKeyboardMarkup {
	let menu: RawMenu = {
		message: "",
		buttons: []
	}

	if(!formEntry.buttons) {
		return getKeyboardFromMenu(menu);
	}

	if(formEntry.layout) {
		menu.layout = formEntry.layout;
	}

	for(let btn of formEntry.buttons) {
		menu.buttons.push({
			text: btn,
			handler: ""
		});
	}

	return getKeyboardFromMenu(menu);
}

export function getKeyboadFromStrings(
	buttons: string[] = [],
	layout: Layout = null
): ReplyKeyboardMarkup {
	let menu: RawMenu = {
		message: "",
		buttons: [],
		layout
	}

	for(let btn of buttons) {
		menu.buttons.push({
			text: btn,
			handler: ""
		});
	}

	return getKeyboardFromMenu(menu);
}

function getCallbackQueryData(
	btn: InlineButton | InlineButtonClosure,
	index: number,
	label?: string
): string | undefined {
	if(btn.url) {
		return;
	}

	let payload: string[] = [];

	if(typeof btn.handler === "string") {
		payload.push(btn.handler);
	}

	if(typeof btn.handler === "object") {
		if(isInlineHandle(btn.handler)) {
			throw new Error("Raw inline handle detected in the keyboard crafter");
		}

		assert(!btn.arguments);
		assert(label);

		payload.push(btn.handler.label);
	}

	if(typeof btn.handler === "function") {
		assert(label);
		payload.push(label);
		payload.push(index + "");
	}

	if(btn.arguments) {
		for(let arg of btn.arguments) {
			payload.push(arg + "");
		}
	}

	return payload.join(DELIMETER);
}

function getInlineKeyboardButton(
	btn: InlineButton,
	index: number,
	defaultLabel?: string
): InlineKeyboardButton {
	let label;

	if(btn.handler) {
		let inlineMenuLabeled = <InlineMenuLabeled> btn.handler;

		if(inlineMenuLabeled.label) {
			label = inlineMenuLabeled.label;
		}
	}

	if(!label && defaultLabel) {
		label = defaultLabel;
	}

	return {
		text: btn.text,
		url: btn.url,
		callback_data: getCallbackQueryData(btn, index, label)
	};
}

export function getInlineKeyboard(
	buttons: InlineButton[],
	layout: Layout,
	label?: string
): InlineKeyboardMarkup {
	let keyboard: InlineKeyboardButton[][] = [];

	if(!layout) {
		for(let i = 0; i < buttons.length; i++) {
			let btn = getInlineKeyboardButton(
				buttons[i],
				i,
				label
			);

			keyboard.push([btn]);
		}
	}

	if(Array.isArray(layout)) {
		let c = 0;
		
		for(let i = 0; i < layout.length; i++) {
			keyboard.push([]);
			
			for(let j = 0; j < layout[i]; j++) {
				let btn = getInlineKeyboardButton(
					buttons[c],
					c,
					label
				);

				keyboard[keyboard.length - 1].push(btn);
				c++;
			}
		}
	}

	if(typeof(layout) === "number") {
		let c = 0;
		
		for(let i = 0; i < buttons.length; i++) {
			if(c === 0) {
				keyboard.push([]);
			}
			
			let btn = getInlineKeyboardButton(
				buttons[i],
				i,
				label
			);

			keyboard[keyboard.length - 1].push(btn);
			c++;
			
			if(c === layout) {
				c = 0;
			}
		}
	}

	return {
		inline_keyboard: keyboard
	}
}