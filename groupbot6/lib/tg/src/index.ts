import * as util from "util"
import * as http from "http";

import {
	Update,
	TelegramResponse,
	User,
	SendMessageOptions,
	Message,
	Chat,
	SendPhotoOptions,
	EditMessageTextOptions,
	EditMessageCaptionOptions,
	AnswerCallbackQueryOptions,
	PreCheckoutQuery,
	CallbackQuery,
	ChatMember,
	SendDiceOptions,
	SendDocumentOptions
} from "./types";

export * from "./types";

import { RequestOptions, RGWeb, ErrorCodes as WebErrorCodes } from "rg-web";
import { assert, timeout } from "rg";
import { Event } from "rg"
import { getFormData, FormDataFile } from "./form-data";

export { FormDataFile };

interface AnyObject {
	[index: string]: any;
}

const HOST = "api.telegram.org";
const PORT = 443;
const PROTOCOL = "HTTPS";

const RAW_QUERY: string = "/bot%s/%s";

export const enum ErrorCodes {
	CommunicationTimedOut,
	CommunicationError,
	InvalidResponse,
	ParseError,
	TelegramAPIError,
	UnknownError
}

export type TelegramSuccess<T> = {
	is_success: true;
	http_status_code: number;
	data: T;
}

export type TelegramCommunicationError = {
	is_success: false;
	error: {
		code: Exclude<ErrorCodes, ErrorCodes.TelegramAPIError>;
		message?: string;
	}
}

export type TelegramAPIError = {
	is_success: false;
	error: {
		code: ErrorCodes.TelegramAPIError;
		http_status_code: number;
		message?: string;
	}
}

export type TelegramError = TelegramCommunicationError|TelegramAPIError;
export type TelegramResult<T> = TelegramSuccess<T>|TelegramError;

export class TelegramClient  {
	private token: string;
	private offset: number = 0;

	private polling: boolean = false; // Целевое состояние пуллинга
	private pollingState: boolean = false; // Фактическое состояние пуллинга
	
	private webClient: RGWeb;

	public messages = new Event<Message>();
	public channelPosts = new Event<Message>();
	public apiErrors = new Event<TelegramAPIError>();

	public preCheckoutQueries = new Event<PreCheckoutQuery>();
	public callbackQueries = new Event<CallbackQuery>();

	constructor(token: string) {
		this.token = token;
		this.webClient = new RGWeb(HOST, PORT, PROTOCOL);
	}

	public start() {
		this.polling = true;
		
		if(!this.pollingState) {
			this.pollingState = true;
			this.poll();
		}
	}

	public stop() {
		this.polling = false;
	}

	private async poll() {
		let updatesResult = await this.getUpdates(this.offset);

		if(!updatesResult.is_success) {
			let errMsg: string|null = null;
			let timeout: number|null = null;

			if(updatesResult.error.code !== ErrorCodes.TelegramAPIError) {
				errMsg = "Telegram communication problem. Code: "
				+ updatesResult.error.code + "\n"
				+ updatesResult.error.message;
				
				timeout = 700;

				console.warn(errMsg);
			}else{
				errMsg = "Telegram API long poll problem. Code: "
				+ updatesResult.error.code + "\n"
				+ updatesResult.error.message;
				
				timeout = 4000;

				console.error(errMsg);
			}
				
			setTimeout(this.poll.bind(this), timeout);

			return;
		}

		if(!this.polling) {
			this.pollingState = false;
			return;
		}

		let updates: Update[] = updatesResult.data;
		let maxUpdateID: number = 0;

		for(let update of updates) {
			let updateID: number = update.update_id;

			if(maxUpdateID < updateID) {
				maxUpdateID = updateID;
			}

			if(update.callback_query) {
				this.callbackQueries.emit(update.callback_query);
			}

			if(update.pre_checkout_query) {
				this.preCheckoutQueries.emit(update.pre_checkout_query);
			}
			
			if(update.channel_post) {
				this.channelPosts.emit(update.channel_post);
			}

			if(update.message) {
				this.messages.emit(update.message);
			}
		}

		if(maxUpdateID) {
			this.offset = maxUpdateID + 1;
		}
		
		this.poll();
	}

	private async getUpdates(offset: number): Promise<TelegramResult<Update[]>> {
		let result = await this.invoke("getUpdates", {
			offset: offset,
			timeout: 24,
			allowed_updates: [
				"message",
				"callback_query",
				"pre_checkout_query",
				"channel_post"
			]
		}, {}, 25000);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Update[]> result.data
		}
	}

	public async answerCallbackQuery(
		callback_query_id: string,
		options: AnswerCallbackQueryOptions = {}
	): Promise<TelegramResult<boolean>> {
		let params: AnyObject = options;

		params.callback_query_id = callback_query_id;

		let result = await this.invoke("answerCallbackQuery", options);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <boolean> <unknown> result.data
		}
	}

	public async editMessageCaption(
		options: EditMessageCaptionOptions = {}
	): Promise<TelegramResult<Message>> {
		let result = await this.invoke("editMessageCaption", options);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async editMessageText(
		text: string,
		options: EditMessageTextOptions = {}
	): Promise<TelegramResult<Message>> {
		let params: AnyObject = options;

		params.text = text;

		let result = await this.invoke("editMessageText", params);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async sendDocument(
		chat_id: number|string,
		document: string | {
			data: Buffer,
			filename: string
		},
		options: SendDocumentOptions = {},
	): Promise<TelegramResult<Message>> {
		let params: AnyObject = options;

		params.chat_id = chat_id;
		
		let result: TelegramResult<AnyObject>;

		if(typeof document === "string") {
			params.document = document;
			result = await this.invoke("sendDocument", params);
		}else{
			const file: FormDataFile = document;

			params.document = file;

			const formData = getFormData(params);

			const headers: http.IncomingHttpHeaders = {
				"content-type": 'multipart/form-data; boundary=' + formData.boundary
			};

			result = await this.invoke(
				"sendDocument",
				formData.data,
				headers,
				5000
			);
		}

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async sendPhoto(
		chat_id: number|string,
		photo: string,
		options: SendPhotoOptions = {}
	): Promise<TelegramResult<Message>> {
		let params: AnyObject = options;

		params.chat_id = chat_id;
		params.photo = photo;

		let result = await this.invoke("sendPhoto", params);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async deleteMessage(
		chat_id: number|string,
		message_id: number
	): Promise<TelegramResult<boolean>> {
		let result = await this.invoke("deleteMessage", {
			chat_id,
			message_id
		});

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <boolean> <unknown> result.data
		}
	}

	public async sendMessage(
		chat_id: number|string,
		text: string,
		options: SendMessageOptions = {}
	): Promise<TelegramResult<Message>> {
		let params: AnyObject = options;

		params.chat_id = chat_id;
		params.text = text;

		let result = await this.invoke("sendMessage", params);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async sendDice(
		chat_id: number | string,
		options: SendDiceOptions = {}
	): Promise<TelegramResult<Message>> {
		let params: AnyObject = options;

		params.chat_id = chat_id;

		let result = await this.invoke("sendDice", params);

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Message> result.data
		}
	}

	public async getChat(chat_id: number | string): Promise<TelegramResult<Chat>> {
		let result = await this.invoke("getChat", {
			chat_id
		});

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <Chat> result.data
		}
	}

	public async getChatMember(
		chat_id: number | string,
		user_id: number
	): Promise<TelegramResult<ChatMember>> {
		let result = await this.invoke("getChatMember", {
			chat_id,
			user_id
		});

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <ChatMember> result.data
		}
	}

	public async exportChatInviteLink(
		chat_id: number | string
	): Promise<TelegramResult<string>> {
		let result = await this.invoke("exportChatInviteLink", {
			chat_id
		});

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <string> <unknown> result.data
		}
	}

	public async getMe(): Promise<TelegramResult<User>> {
		let result = await this.invoke("getMe");

		if(!result.is_success) {
			return result;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: <User> result.data
		}
	}

	private async invoke(
		method: string,
		params: AnyObject | Buffer = {},
		headers: http.IncomingHttpHeaders = {},
		timeout: number = 8000
	): Promise<TelegramResult<AnyObject>> {
		let queryParameters: string | Buffer = "";

		if(!Buffer.isBuffer(params)) {
			for(let i in params) {
				let param = params[i];
	
				if(param === null || param === undefined) {
					continue;
				}
	
				if(typeof param !== "string") {
					param = JSON.stringify(param);
				}
	
				queryParameters += i + "=" + encodeURIComponent(param) + "&";
			}
		}else{
			queryParameters = params;
		}

		let path: string = util.format(RAW_QUERY, this.token, method);

		const options: RequestOptions = {
			path: encodeURI(path),
			method: "POST",
			timeout: timeout,
			headers: Object.assign({
				"content-type": 'application/x-www-form-urlencoded',
				"content-length": Buffer.byteLength(queryParameters)
			}, headers)
		};

		let buf: Buffer | null = null;

		if(typeof queryParameters === "string") {
			buf = Buffer.from(queryParameters);
		}else{
			buf = queryParameters;
		}

		let result = await this.webClient.request(
			options,
			buf
		);

		if(!result.is_success) {
			let code: number|null = null;

			switch(result.error.code) {
				case WebErrorCodes.CommunicationError:
					code = ErrorCodes.CommunicationError;
					break;
				case WebErrorCodes.CommunicationTimedOut:
					code = ErrorCodes.CommunicationTimedOut;
					break;
				default:
					code = ErrorCodes.UnknownError;
					break;
			}

			return {
				is_success: false,
				error: {
					code: code,
					message: result.error.message
				}
			}
		}

		if(result.headers["content-type"] !== "application/json") {
			return {
				is_success: false,
				error: {
					code: ErrorCodes.InvalidResponse,
					message: "Response headers does not have expected key"
				}
			};
		}

		let telegramResponse: TelegramResponse|null = null;

		try {
			telegramResponse = JSON.parse(result.data);
		}catch(err) {
			return {
				is_success: false,
				error: {
					code: ErrorCodes.ParseError,
					message: "Telegram response cannot be parsed: "
					+ err.message
				}
			};
		}

		assert(telegramResponse !== null);

		if(!telegramResponse.ok) {
			const err: TelegramAPIError = {
				is_success: false,
				error: {
					code: ErrorCodes.TelegramAPIError,
					http_status_code: result.http_status_code,
					message: telegramResponse.description
				}
			};

			this.apiErrors.emit(err);

			return err;
		}

		return {
			is_success: true,
			http_status_code: result.http_status_code,
			data: telegramResponse.result
		};
	}
}