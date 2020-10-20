import { InlineButton } from "./inline-types";

import {
	Message,
	ParseModes,
	CallbackQuery,
	FormDataFile
} from "tg";

export type Layout = number[] | number | null | void;

export type UIMessage = {
	text?: string;
	photo?: string;
	document?: string | FormDataFile;
	keyboard?: string[];
	inline_keyboard?: InlineButton[];
	inline_label?: string;
	layout?: Layout;
	options?: CommonMessageOptions;
}

export type PreHandler =
	(msg: Message) => Promise<boolean> | boolean;

export type PreCallbackHandler = 
	(callbackQuery: CallbackQuery) => Promise<boolean> | boolean;

export type CommonMessageOptions = {
	parse_mode?: ParseModes;
	disable_web_page_preview?: boolean;
	disable_notification?: boolean;
	reply_to_message?: Message;
}