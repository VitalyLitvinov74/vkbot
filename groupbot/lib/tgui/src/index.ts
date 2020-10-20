import {
	UIMessage,
	PreHandler,
	CommonMessageOptions,
	PreCallbackHandler
} from "./types";

import { RawMenu } from "./menu-types";
import { Event } from "rg";
import { assert } from "rg";
import { RGResult } from "rg";
import { User, UserHandlerResultTypes } from "./user";
import { Form } from "./form";
import { Menu } from "./menu";

import {
	TelegramClient,
	TelegramResult,
	TelegramAPIError,
	Dice,
	SendDiceOptions,
	ErrorCodes as TelegramErrorCodes,
	FormDataFile,
	SendDocumentOptions
} from "tg";

import {
	Message,
	SendPhotoOptions,
	ReplyMarkup,
	CallbackQuery,
	SendMessageOptions,
	AnswerCallbackQueryOptions
} from "tg";

import {
	FormResult,
	FormEntry,
	FormOptions,
	FormErrorCodes
} from "./form-types";

import {
	getKeyboadFromStrings,
	getInlineKeyboard
} from "./keyboards";

import { InlineManager } from "./inline-manager";

import {
	InlineMenu,
	InlineMenuClosure,
	InlineMenuLabeled,
	InlineButtonHandler,
	isInlineHandle,
	InlineMenuHandle,
	InlineFunctionHandle
} from "./inline-types";

import {
	CommandTerminal,
	CommandTerminalController
} from "./command-terminal";

export * from "./types";
export * from "./form-types";
export * from "./menu-types";
export * from "./inline-types";
export { CommandArgTypes } from "./command-terminal";

type DefaultHandler = (msg: Message) => void;
type MainMenuConstructor = (msg: Message) => RawMenu;
type RouteHandler = (msg: Message) => void;

export class TelegramUI {
	private tg: TelegramClient;
	private inlineManager: InlineManager;
	private users: Record<number, User|void> = {};

	private routes: Record<number, RouteHandler> = {};
	private commandTerminals: Record<number, CommandTerminal> = {};

	private preHandler: PreHandler | null = null;
	private preCallbackHandler: PreCallbackHandler | null = null;
	private defaultHandler: DefaultHandler | null = null;
	private defaultMenu: Menu | null = null;
	private defaultOptions: CommonMessageOptions = {};
	private mainMenuConstructor: MainMenuConstructor | null = null;
	
	private commands: Record<string, DefaultHandler> = {};

	public messages: Event<Message>;
	public callbackQueries: Event<CallbackQuery>;
	public apiErrors: Event<TelegramAPIError>;

	constructor(token: string) {
		this.tg = new TelegramClient(token);
		this.inlineManager = new InlineManager();

		this.messages = this.tg.messages;
		this.callbackQueries = this.tg.callbackQueries;
		this.apiErrors = this.tg.apiErrors;

		this.messages.on(this.onMessageHandler.bind(this));
		this.callbackQueries.on(this.onCallbackQuery.bind(this));
		this.apiErrors.on(this.onApiError.bind(this));
	}

	public createCommandTerminal(chat_id: number): CommandTerminalController {
		let commandTerminal = new CommandTerminal();
		this.commandTerminals[chat_id] = commandTerminal;

		return commandTerminal.createController();
	}

	public setCommand(command: string, handler: DefaultHandler): void {
		assert(!this.commands[command]);
		this.commands[command] = handler;
	}

	public setRoute(chat_id: number, handler: RouteHandler): void {
		this.routes[chat_id] = handler;
	}

	public setDefaultOptions(options: CommonMessageOptions) {
		this.defaultOptions = options;
	}

	public setPreHandler(preHandler: PreHandler): void {
		this.preHandler = preHandler;
	}

	public setPreCallbackHandler(preCallbackHandler: PreCallbackHandler): void {
		this.preCallbackHandler = preCallbackHandler;
	}

	public setDefaultMenu(menu: RawMenu): void {
		this.defaultMenu = new Menu(menu);
	}

	public setDefaultHandler(handler: DefaultHandler): void {
		this.defaultHandler = handler;
	}

	public setMainMenuConstructor(mainMenuConstructor: MainMenuConstructor): void {
		this.mainMenuConstructor = mainMenuConstructor;
	}

	public getBotInformation() {
		return this.tg.getMe();
	}

	private regUser(user_id: number, msg?: Message): boolean {
		if(this.users[user_id]) {
			return false;
		}

		let user = new User(user_id);

		if(this.defaultMenu) {
			user.setMenu(this.defaultMenu);
		}else{
			if(this.mainMenuConstructor && msg) {
				let rawMenu = this.mainMenuConstructor(msg);
				let menu = new Menu(rawMenu);
				
				user.setMenu(menu);
			}
		}

		this.users[user_id] = user;

		return true;
	}

	private async onCallbackQuery(callbackQuery: CallbackQuery): Promise<void> {
		if(this.preCallbackHandler) {
			let isProceedAllowed = await this.preCallbackHandler(callbackQuery);

			if(!isProceedAllowed) {
				return;
			}
		}

		let handler = this.inlineManager.onCallbackQuery.bind(this.inlineManager);
		let next = await handler(callbackQuery);

		if(!next) {
			return;
		}

		this.sendCommonInline(callbackQuery.from.id, next, callbackQuery);
	}

	private async onMessageHandler(msg: Message): Promise<void> {
		if(!msg.text) {
			return;
		}

		if(this.commandTerminals[msg.chat.id]) {
			let terminal = this.commandTerminals[msg.chat.id];

			let result = await terminal.handler(msg);
			let options = terminal.getOptions();

			if(result) {
				this.sendTextMessage(msg.chat.id, result, options);
			}

			return;
		}

		if(this.routes[msg.chat.id]) {
			this.routes[msg.chat.id](msg);
			return;
		}

		let user = this.users[msg.chat.id];

		if(!user) {
			this.regUser(msg.chat.id, msg);
			user = this.users[msg.chat.id];
			assert(user);
		}

		if(this.preHandler) {
			let isProceedAllowed = await this.preHandler(msg);

			if(!isProceedAllowed) {
				return;
			}
		}

		if(this.commands[msg.text]) {
			this.commands[msg.text](msg);
			return;
		}

		let result = await user.onMessageHandler(msg);
		
		if(result.type === UserHandlerResultTypes.None) {
			if(this.defaultHandler) {
				this.defaultHandler(msg);
			}

			return;
		}

		if(!result.data) {
			return;
		}

		const message = result.data;

		if(!message.text && !message.photo) {
			return;
		}

		this.sendUIMessage(user.id, message);
	}

	public onApiError(err: TelegramAPIError): void {
		if(err.error.http_status_code === 403) {
			return;
		}

		console.error("Telegram API Error ", err.error);
	}

	public defineInlineCallback(
		label: string,
		callback: InlineButtonHandler
	): InlineFunctionHandle {
		return this.inlineManager.setCallback(label, callback);
	}

	public defineInline(menu: InlineMenuLabeled): InlineMenuHandle {
		return this.inlineManager.setHandler(menu);
	}

	public sendInline(
		user_id: number,
		menu: InlineMenuClosure | InlineMenuHandle,
		callbackQuery?: CallbackQuery,
		options?: CommonMessageOptions
	) {
		let menuToSend: InlineMenu | null = null;

		if(isInlineHandle(menu)) {
			let resolved = this.inlineManager.getEntryByHandle(menu);

			if(!resolved) {
				throw new Error("Invalid inline handle");
			}

			let handler = this.inlineManager.getHandler(resolved);

			assert(handler);
			assert(typeof handler !== "function");

			menuToSend = handler;
		}else{
			menuToSend = menu;
		}

		return this.sendCommonInline(user_id, menuToSend, callbackQuery, options);
	}

	private sendCommonInline(
		user_id: number,
		menu: InlineMenu,
		callbackQuery?: CallbackQuery,
		options?: CommonMessageOptions
	) {
		let message: UIMessage = {
			text: menu.message,
			photo: menu.photo,
			inline_keyboard: menu.buttons,
			layout: menu.layout,
			options: options
		}

		let inlineMenuLabeled = <InlineMenuLabeled> menu;

		if(inlineMenuLabeled.label) {
			message.inline_label = inlineMenuLabeled.label;
		}

		this.inlineManager.deferenceButtons(menu.buttons);

		if(callbackQuery) {
			return this.editCallbackQuery(callbackQuery, message);
		}else{
			return this.sendUIMessage(user_id, message);
		}
	}

	public async sendMenu(user_id: number, rawMenu: RawMenu, text?: string) {
		this.regUser(user_id);

		const user = this.users[user_id];
		assert(user);

		if(user.getCurrentForm()) {
			this.dropForm(user_id);
		}
		
		const menu = new Menu(rawMenu);
		user.setMenu(menu);

		const message = await menu.start();

		if(text) {
			message.text = text;
		}

		return this.sendUIMessage(user.id, message);
	}

	private sendBranchForm(
		user_id: number,
		questions: FormEntry[],
		options: FormOptions = {}
	) {
		options.is_branch = true;

		let result = this.sendForm(user_id, questions, options);

		let user = this.users[user_id];
		assert(user);

		let form = user.getCurrentForm();
		assert(form);

		return result;
	}
	
	public pauseForm(user_id: number): void {
		this.regUser(user_id);

		const user = this.users[user_id];
		assert(user);

		user.pauseForm();
	}

	public resumeForm(user_id: number): void {
		this.regUser(user_id);

		const user = this.users[user_id];
		assert(user);

		user.resumeForm();
	}

	public dropForm(user_id: number): void {
		this.regUser(user_id);

		const user = this.users[user_id];
		assert(user);

		user.clearFormStack();
	}

	public sendFormAnswer(user_id: number, msg: Message): void {
		const user = this.users[user_id];
		assert(user);

		assert(user.getCurrentForm());

		this.onMessageHandler(msg);
	}

	public async resendFormQuestion(user_id: number) {
		this.regUser(user_id);

		const user = this.users[user_id];
		assert(user);

		const form = user.getCurrentForm();
		assert(form);

		const message = await form.getCurrentQuestion();

		if(message) {
			return this.sendUIMessage(user_id, message);
		}

		return null;
	}

	public async sendForm(
		user_id: number,
		questions: FormEntry[],
		options: FormOptions = {}
	): Promise<RGResult<FormResult>> {
		this.regUser(user_id);

		let user = this.users[user_id];
		assert(user);

		let form = new Form(user_id, questions, options);

		if(options.is_branch) {
			form.markAsBranch();
		}else{
			user.clearFormStack();
		}

		user.pushForm(form);

		let ret = <Promise<RGResult<FormResult>>> new Promise((resolve) => {
			form.setPromise(resolve);
		});

		let message = await form.start();

		if(!message) {
			return ret;
		}

		let result = await this.sendUIMessage(user.id, message);

		if(!result.is_success) {
			return {
				is_success: false,
				error: {
					code: FormErrorCodes.SendingMessageError,
					message: result.error.message
				}
			};
		}

		return ret;
	}

	public async setFormBranch(user_id: number, questions: FormEntry[]) {
		let user = this.users[user_id];
		assert(user);

		let form = user.getCurrentForm();

		if(!form) {
			throw new Error("Can't set branch: form is not found");
		}

		form.setHolding(true);
		
		let result = await this.sendBranchForm(user.id, questions);

		if(!result.is_success) {
			if(result.error.code === FormErrorCodes.Rollbacked) {
				form.setHolding(false);

				form.start().then((msg) => {
					assert(user);
	
					if(msg) {
						this.sendUIMessage(user.id, msg);
					}
				});

				return result;
			}else{
				let nextForm: Form | null = user.getCurrentForm();
				assert(nextForm);

				nextForm.onFormFailed(result);

				return;
			}
		}

		let formResult: FormResult = result.data;

		let nextForm: Form | null = user.getCurrentForm();
		assert(nextForm);

		Object.assign(formResult, nextForm.getResult());

		nextForm.overrideResult(formResult);
		nextForm.onFormFinished();
	}

	public editCallbackQuery(callbackQuery: CallbackQuery, newMessage: UIMessage) {
		if(callbackQuery.message) {
			this.editMessage(callbackQuery.message, newMessage);
		}else{
			this.sendUIMessage(callbackQuery.from.id, newMessage);
		}
	}

	public editMessageText(message: Message, text: string) {
		let options = {
			chat_id: message.chat.id,
			message_id: message.message_id
		};

		Object.assign(options, this.defaultOptions);

		return this.tg.editMessageText(text, options);
	}

	public async editMessage(oldMessage: Message, newMessage: UIMessage) {
		let deleteResult = await this.tg.deleteMessage(
			oldMessage.chat.id,
			oldMessage.message_id
		);

		if(deleteResult.is_success) {
			this.sendUIMessage(oldMessage.chat.id, newMessage);
		}
	}

	public sendTextMessage(
		user_id: number,
		text: string,
		options?: CommonMessageOptions
	) {
		return this.sendUIMessage(user_id, {
			text,
			options
		});
	}

	public sendDocument(
		chat_id: number | string,
		document: string | FormDataFile,
		text?: string,
		options: SendDocumentOptions = {}
	): Promise<TelegramResult<Message>> {
		const message: UIMessage = {
			document,
			text,
			options
		}

		return this.sendUIMessage(chat_id, message);
	}

	public sendUIMessage(chat_id: number | string, message: UIMessage) {
		let options = message.options;

		let keyboard: ReplyMarkup | null = null;

		if(message.keyboard) {
			keyboard = getKeyboadFromStrings(
				message.keyboard,
				message.layout
			);
		}

		if(message.inline_keyboard) {
			keyboard = getInlineKeyboard(
				message.inline_keyboard,
				message.layout,
				message.inline_label
			);
		}

		if(message.photo) {
			let photoOptions: SendPhotoOptions = Object.assign({}, this.defaultOptions);

			if(keyboard) {
				photoOptions.reply_markup = keyboard;
			}

			if(message.text) {
				photoOptions.caption = message.text;
			}

			if(options) {
				Object.assign(photoOptions, options);
			}
			
			return this.tg.sendPhoto(chat_id, message.photo, photoOptions);
		}

		if(message.document) {
			let documentOptions: SendDocumentOptions = Object.assign({}, this.defaultOptions);

			if(keyboard) {
				documentOptions.reply_markup = keyboard;
			}

			if(message.text) {
				documentOptions.caption = message.text;
			}

			if(options) {
				Object.assign(documentOptions, options);
			}

			return this.tg.sendDocument(chat_id, message.document, documentOptions);
		}

		assert(message.text);

		let sendMessageOptions: SendMessageOptions = {};

		if(keyboard) {
			sendMessageOptions.reply_markup = keyboard;
		}

		if(options) {
			Object.assign(sendMessageOptions, options);

			let reply = options.reply_to_message;

			if(reply) {
				sendMessageOptions.reply_to_message_id = reply.message_id;
			}
		}else{
			Object.assign(sendMessageOptions, this.defaultOptions);
		}

		return this.tg.sendMessage(
			chat_id,
			message.text,
			sendMessageOptions
		);
	}

	public deleteMessage(chat_id: number, message_id: number) {
		return this.tg.deleteMessage(chat_id, message_id);
	}

	public answerAlert(callbackQuery: CallbackQuery, text: string) {
		return this.answerCallbackQuery(callbackQuery, { text });
	}

	public answerCallbackQuery(
		callbackQuery: CallbackQuery,
		options: AnswerCallbackQueryOptions
	) {
		if(typeof options.show_alert !== "boolean") {
			if(options.text) {
				options.show_alert = true;
			}
		}

		return this.tg.answerCallbackQuery(callbackQuery.id, options);
	}

	public getChat(chat_id: number | string) {
		return this.tg.getChat(chat_id);
	}

	public async sendDice(
		chat_id: number | string,
		options: SendDiceOptions = {}
	): Promise<TelegramResult<Dice>> {
		const result = await this.tg.sendDice(chat_id, options);

		if(!result.is_success) {
			return result;
		}

		if(!result.data.dice) {
			console.error("dice is expected in result message", result.data);

			return {
				is_success: false,
				error: {
					code: TelegramErrorCodes.UnknownError
				}
			}
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: result.data.dice
		}
	}

	public async isSubscriber(
		user_id: number,
		chat_id: number | string
	): Promise<TelegramResult<boolean>> {
		let chatMemberResult = await this.tg.getChatMember(chat_id, user_id);

		if(!chatMemberResult.is_success) {
			return chatMemberResult
		}

		let chatMember = chatMemberResult.data;

		return {
			is_success: true,
			http_status_code: chatMemberResult.http_status_code,
			data: chatMember.status !== "left"
		};
	}

	public getChatMember(chat_id: string | number, user_id: number) {
		return this.tg.getChatMember(chat_id, user_id);
	}

	public exportChatInviteLink(chat_id: number | string) {
		return this.tg.exportChatInviteLink(chat_id);
	}

	public start() {
		this.tg.start();
	}

	public stop() {
		this.tg.stop();
	}
}