import {
	InlineTableEntry,
	InlineMenuLabeled,
	InlineMenuClosure,
	InlineButtonClosure,
	InlineButtonHandler,
	InlineHandle,
	InlineButton,
	isInlineHandle,
	InlineFunctionHandle,
	isInlineFunctionHandle,
	isInlineMenuHandle,
	InlineMenuHandle
} from "./inline-types";

import { assert } from "rg";
import { CallbackQuery } from "tg";

export const DELIMETER = '卐';

export class InlineManager {
	private inlineHandlersTable: Record<string, InlineTableEntry> = {};
	private handles: string[] = [];

	public async onCallbackQuery(
		callbackQuery: CallbackQuery
	): Promise<InlineMenuLabeled | void> {
		let rawArgs: string | void = callbackQuery.data;

		if(!rawArgs) {
			return;
		}
		
		let args = rawArgs.split(DELIMETER);
		let handlerName = args.shift();

		if(!handlerName) {
			return;
		}

		let handler = this.getHandler(handlerName);

		if(!handler) {
			return;
		}

		if(typeof handler === "function") {
			handler(callbackQuery, args);
			return;
		}

		if(typeof handler === "object") {
			if(args.length === 0) {
				return handler;
			}else{
				let rawButtonIndex = args.shift();

				if(!rawButtonIndex) {
					return;
				}

				let buttonIndex = +rawButtonIndex;

				if(isNaN(buttonIndex)) {
					return;
				}

				let button = handler.buttons[buttonIndex];

				if(!button) {
					return;
				}

				let buttonHandler = button.handler;

				if(typeof buttonHandler !== "function") {
					return;
				}

				buttonHandler(callbackQuery, args);
				return;
			}
		}
	}

	private getEntryByRawHandle(handle: number): string | void {
		return this.handles[handle];
	}

	public getEntryByHandle(handle: InlineHandle): string | void {
		if(isInlineFunctionHandle(handle)) {
			return this.getEntryByRawHandle(handle.inline_function_handle);
		}

		if(isInlineMenuHandle(handle)) {
			return this.getEntryByRawHandle(handle.inline_menu_handle);
		}
	}

	private createRawHandle(entry: string): number {
		let index: number = this.handles.push(entry) - 1;
		return index;
	}

	private createFunctionHandle(entry: string): InlineFunctionHandle {
		return {
			inline_function_handle: this.createRawHandle(entry)
		};
	}

	private createMenuHandle(entry: string): InlineMenuHandle {
		return {
			inline_menu_handle: this.createRawHandle(entry)
		};
	}

	public getHandler(label: string): InlineTableEntry | void {
		return this.inlineHandlersTable[label];
	}

	public setHandler(entry: InlineMenuLabeled | InlineMenuHandle): InlineMenuHandle {
		let result: InlineMenuHandle | null = null;

		if(isInlineHandle(entry)) {
			let keyResolved = this.getEntryByHandle(entry);
			
			if(!keyResolved) {
				throw new Error("Invalid inline handle");
			}

			let resolved = this.getHandler(keyResolved);

			if(typeof resolved === "function") {
				throw new Error("This method does not allow to define callbacks");
			}

			assert(resolved);

			result = entry;
			entry = resolved;
		}

		if(entry.label.length === 0) {
			throw new Error("Label can't be empty");
		}

		if(this.getHandler(entry.label)) {
			throw new Error("This label is already busy: " + entry.label);
		}

		for(let btn of entry.buttons) {
			if(typeof btn.handler === "string") {
				if(!this.getHandler(btn.handler)) {
					throw new Error("Menu is not found: " + btn.handler);
				}
			}

			if(typeof btn.handler !== "object") {
				continue;
			}else{
				if(isInlineHandle(btn.handler)) {
					continue;
				}
			}

			this.setHandler(btn.handler);
		}

		this.inlineHandlersTable[entry.label] = entry;

		if(!result) {
			result = this.createMenuHandle(entry.label);
		}

		return result;
	}
	
	public setCallback(
		label: string,
		callback: InlineButtonHandler | InlineFunctionHandle
	): InlineFunctionHandle {
		let result: InlineHandle | null = null;

		if(isInlineHandle(callback)) {
			let keyResolved = this.getEntryByHandle(callback);
			
			if(!keyResolved) {
				throw new Error("Invalid inline handle");
			}

			let resolved = this.getHandler(keyResolved);

			assert(typeof resolved !== "object");
			assert(resolved);

			result = callback;
			callback = resolved;
		}

		if(this.getHandler(label)) {
			throw new Error("This label is already busy: " + label);
		}

		this.inlineHandlersTable[label] = callback;

		if(!result) {
			result = this.createFunctionHandle(label);
		}

		return result;
	}

	public deferenceButtons(
		buttons: InlineButton[] | InlineButtonClosure[]
	): void {
		for(let btn of buttons) {
			if(typeof btn.handler !== "object" || !isInlineHandle(btn.handler)) {
				continue;
			}

			let resolved = this.getEntryByHandle(btn.handler);

			if(!resolved) {
				throw new Error("Invalid inline handle");
			}

			btn.handler = resolved;
		}
	}
}