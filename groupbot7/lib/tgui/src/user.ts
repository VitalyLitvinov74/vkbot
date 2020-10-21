import {
	UIMessage
} from "./types";

import { Form } from "./form";
import { Message } from "tg";
import { Menu } from "./menu";

export const enum UserHandlerResultTypes {
	None,
	Form,
	Menu
}

type UserMessageResultNone = {
	type: UserHandlerResultTypes.None
};

type UserMessageResultForm = {
	type: UserHandlerResultTypes.Form;
	data: UIMessage | null;
}

type UserMessageResultMenu = {
	type: UserHandlerResultTypes.Menu;
	data: UIMessage | null;
}

type UserHandlerResult = 
	UserMessageResultNone|
	UserMessageResultForm|
	UserMessageResultMenu;

export class User {
	public id: number;

	private isFormPaused: boolean = false;

	private currentMenu: Menu | null = null;
	private formStack: Form[] = [];

	constructor(user_id: number) {
		this.id = user_id;
	}

	public async onMessageHandler(msg: Message): Promise<UserHandlerResult> {
		const form = this.getCurrentForm();

		if(form) {
			const result = await form.onMessageHandler(msg);

			return {
				type: UserHandlerResultTypes.Form,
				data: result
			};
		}

		const menu = this.getCurrentMenu();

		if(menu) {
			const result = await menu.onMessageHandler(msg);

			return {
				type: UserHandlerResultTypes.Menu,
				data: result
			};
		}

		return { type: UserHandlerResultTypes.None };
	}

	public pauseForm(): void {
		this.isFormPaused = true;
	}

	public resumeForm(): void {
		this.isFormPaused = false;
	}

	public setMenu(menu: Menu) {
		this.currentMenu = menu;
	}

	public clearFormStack(): void {
		this.formStack = [];
	}

	public pushForm(form: Form) {
		form.finished.on(this.onFormFinished.bind(this));
		this.formStack.push(form);
	}

	private onFormFinished() {
		this.popForm();
	}

	private popForm() {
		return this.formStack.pop();
	}

	public getCurrentMenu(): Menu | null {
		return this.currentMenu;
	}

	public getFormStackLength(): number {
		return this.formStack.length;
	}

	public getCurrentForm(): Form | null {
		if(this.isFormPaused) {
			return null;
		}

		let lastIndex: number = this.formStack.length - 1;
		let formStackEntry: Form = this.formStack[lastIndex];

		if(!formStackEntry) {
			return null;
		}

		return formStackEntry;
	}
}