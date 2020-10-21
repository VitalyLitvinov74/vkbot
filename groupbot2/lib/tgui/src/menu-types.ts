import { Message } from "tg";
import { Layout } from "./types";

export type ButtonHandler = (msg: Message) => any;

export type Button = {
	text: string;
	handler: ButtonHandler | string;
}

export type MenuMessagePreprocessor = (msg?: Message) => (string | Promise<string>);

export type RawMenu = {
	message?: string | MenuMessagePreprocessor;
	photo?: string;
	layout?: Layout;
	default?: string | ButtonHandler;
	buttons: Button[];
}

export const enum MenuErrorCodes {
	UnknownError
}