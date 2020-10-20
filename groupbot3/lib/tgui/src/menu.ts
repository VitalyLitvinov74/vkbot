import { Message } from "tg";

import {
	Layout,
	UIMessage
} from "./types";

import {
	Button,
	RawMenu,
	MenuMessagePreprocessor,
	ButtonHandler
} from "./menu-types";

export class Menu {
	private message?: string | MenuMessagePreprocessor;
	private photo?: string;
	private layout: Layout;
	private default?: string | ButtonHandler;
	private buttons: Button[];

	constructor(rawMenu: RawMenu) {
		this.message = rawMenu.message;
		this.photo = rawMenu.photo;
		this.layout = rawMenu.layout;
		this.buttons = rawMenu.buttons;
		this.default = rawMenu.default;
	}

	public onMessageHandler(msg: Message): Promise<UIMessage> | UIMessage | null {
		let button: Button | null = null;

		for(let btn of this.buttons) {
			if(btn.text === msg.text) {
				button = btn;
				break;
			}
		}

		if(!button) {
			if(this.default) {
				if(typeof this.default === "string") {
					return {
						text: this.default
					};
				}
				
				if(typeof this.default === "function") {
					this.default(msg);
					return null;
				}
			}

			return this.start(msg);
		}

		if(typeof button.handler === "string") {
			return {
				text: button.handler
			};
		}

		if(typeof button.handler === "function") {
			button.handler(msg);
			return null;
		}

		return null;
	}

	public async start(msg?: Message): Promise<UIMessage> {
		let keyboard: string[] = [];

		for(let btn of this.buttons) {
			keyboard.push(btn.text);
		}

		let message = this.message;
		let response: string | undefined | null = null;

		if(typeof message === "function") {
			response = await message(msg);
		}else{
			response = message;
		}

		return {
			text: response,
			photo: this.photo,
			keyboard: keyboard,
			layout: this.layout
		}
	}
}