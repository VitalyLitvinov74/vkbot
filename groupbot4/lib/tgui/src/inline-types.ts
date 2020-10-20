import { CallbackQuery } from "tg";
import { Layout } from "./types";

export type InlineButtonArgument = string;

export type InlineButtonHandler = (
	msg: CallbackQuery,
	args: InlineButtonArgument[]
) => any;

export type InlineTableEntry = InlineButtonHandler | InlineMenuLabeled;

export type InlineMenuHandle = {
	inline_menu_handle: number;
};

export type InlineFunctionHandle = {
	inline_function_handle: number;
};

export type InlineHandle = InlineMenuHandle | InlineFunctionHandle;

type InlineButtonBase = {
	text: string;
	url?: string;
	arguments?: InlineButtonArgument[];
}

export type InlineButton = InlineButtonBase & {
	handler?:	InlineButtonHandler|
				string|
				InlineMenuLabeled|
				InlineHandle;
}

export type InlineButtonClosure = InlineButtonBase & {
	handler?: InlineHandle;
}

type InlineMenuBase = {
	message?: string;
	photo?: string;
	layout?: Layout;
}

export type InlineMenuLabeled = InlineMenuBase & {
	label: string;
	buttons: InlineButton[];
}

export type InlineMenuClosure = InlineMenuBase & {
	buttons: InlineButtonClosure[];
}

export type InlineMenu = InlineMenuClosure | InlineMenuLabeled;

export function isInlineMenuHandle(inlineHandle: object): inlineHandle is InlineMenuHandle {
	if(!isNaN((inlineHandle as InlineMenuHandle).inline_menu_handle)) {
		return true;
	}

	return false;
}

export function isInlineFunctionHandle(inlineHandle: object): inlineHandle is InlineFunctionHandle {
	if(!isNaN((inlineHandle as InlineFunctionHandle).inline_function_handle)) {
		return true;
	}

	return false;
}

export function isInlineHandle(inlineHandle: object): inlineHandle is InlineHandle {
	if(isInlineMenuHandle(inlineHandle)) {
		return true;
	}

	if(isInlineFunctionHandle(inlineHandle)) {
		return true;
	}

	return false;
}