"use strict";
const https = require('https');
const EventEmitter = require('events');
const util = require("util");

const httpsAgent = new https.Agent({
	maxSockets: 4096,
	keepAlive: true,
	maxFreeSockets: 1024
});

function request(options, data) {
	if(!options.timeout) {
		options.timeout = 8000;
	}
	
	return new Promise((resolve, reject) => {
		let req = https.request(options, (res) => {
			//console.log('statusCode:', res.statusCode);
			//console.log('headers:', res.headers);

			res.setEncoding("utf-8");

			let responseData = "";

			res.on("data", (chunk) => {
				responseData += chunk;
				//console.log(responseData);
			});

			res.on("end", () => {
				resolve({
					statusCode: res.statusCode,
					headers: res.headers,
					body: responseData
				});
			});
		});

		req.on('error', (e) => {
			console.log("HTTPS Request Error:\n", e.message);
			reject(e);
		});
		
		req.on('timeout', (e) => {
			console.log("HTTPS Request has timed out!");
			reject(new Error("Timed out"));
		});
		
		req.write(data);
		req.end();
	});
}

const RAW_QUERY = "https://api.telegram.org/bot%s/%s";

class TelegramClient extends EventEmitter {
	constructor(token) {
		super();
		
		this.token = token;
		this.offset = 0;
		
		this.polling = false; // Target state
		this.pollingState = false; // Actual state
	}
	
	start() {
		this.polling = true;
		
		if(!this.pollingState) {
			this.pollingState = true;
			this._poll();
		}
	}
	
	stop() {
		this.polling = false;
	}
	
	async _poll() {
		let updates = null;
		
		try {
			updates = await this.getUpdates(this.offset);
		}catch(err) {
			if(err.code === "ECONNABORTED") {
				this._poll();
				return;
			}
			
			console.log("Ошибка long poll:\n", err.message);
			setTimeout(this._poll.bind(this), 1000);
			return;
		}
		
		if(!this.polling) {
			this.pollingState = false;
			return;
		}
		
		let maxUpdateID = 0;
		
		let update = null;
		let updateID = null;
		
		for(let i = 0; i < updates.length; i++) {
			update = updates[i];
			updateID = update.update_id;
			
			if(maxUpdateID < updateID) {
				maxUpdateID = updateID;
			}
			
			if(update.callback_query) {
				this.emit("callback_query", update.callback_query);
			}
			
			if(update.pre_checkout_query) {
				this.emit("pre_checkout_query", update.pre_checkout_query);
			}
			
			if(update.message) {
				let msg = update.message;
				
				this.emit("message", msg);
				
				if(msg.forward_from_chat || msg.forward_from) {
					msg.forwarded = true;
					this.emit("forward", msg);
				}
				
				if(msg.text) {
					this.emit("text", msg);
				}
				
				if(msg.successful_payment) {
					this.emit("successful_payment", msg);
				}
			}
		}
		
		if(maxUpdateID) {
			this.offset = maxUpdateID + 1;
		}
		
		this._poll();
	}
	
	answerCallbackQuery(callback_query_id, options={}) {
		options.callback_query_id = callback_query_id;
		
		return this.invoke('answerCallbackQuery', options);
	}
	
	answerPreCheckoutQuery(pre_checkout_query_id, ok, options={}) {
		options.pre_checkout_query_id = pre_checkout_query_id;
		options.ok = ok;
		
		return this.invoke("answerPreCheckoutQuery", options);
	}
	
	getUpdates(offset) {
		return this.invoke("getUpdates", {
			offset: offset,
			timeout: 24,
			allowed_updates: ['message', 'callback_query', 'pre_checkout_query']
		}, 25000);
	}
	
	getMe() {
		return this.invoke("getMe");
	}
	
	getUserProfilePhotos(user_id, options={}) {
		options.user_id = user_id;
		return this.invoke("getUserProfilePhotos", options);
	}
	
	getFile(file_id) {
		return this.invoke("getFile", { file_id });
	}
	
	downloadFile(file_path) {
		let query = `https://api.telegram.org/file/bot${this.token}/${file_path}`;
		
		return request.get(query, {
			responseType: 'arraybuffer'
		});
	}
	
	getChat(chat_id) {
		return this.invoke("getChat", {
			chat_id: chat_id
		});
	}
	
	getChatMember(chat_id, user_id) {
		return this.invoke("getChatMember", {
			chat_id: chat_id,
			user_id: user_id
		});
	}
	
	deleteMessage(chat_id, message_id) {
		return this.invoke("deleteMessage", {
			chat_id: chat_id,
			message_id: message_id
		});
	}
	
	editMessageMedia(media, options={}) {
		options.media = media;

		return this.invoke("editMessageMedia", options);
	}

	editMessageText(text, options={}) {
		options.text = text;
		
		return this.invoke("editMessageText", options);
	}
	
	editMessageCaption(caption, options={}) {
		options.caption = caption;
		
		return this.invoke("editMessageCaption", options);
	}
	
	sendMessage(chat_id, text, options={}) {
		options.chat_id = chat_id;
		options.text = text;
		
		return this.invoke("sendMessage", options);
	}
	
	forwardMessage(chat_id, from_chat_id, message_id, options={}) {
		options.chat_id = chat_id;
		options.from_chat_id = from_chat_id;
		options.message_id = message_id;
		
		return this.invoke("forwardMessage", options);
	}
	
	exportChatInviteLink(chat_id) {
		return this.invoke("exportChatInviteLink", {
			chat_id: chat_id
		});
	}
	
	sendInvoice(
		chat_id,
		title,
		description,
		payload,
		provider_token,
		start_parameter,
		currency,
		prices,
		options={}
	) {
		options.chat_id = chat_id;
		options.title = title;
		options.description = description;
		options.payload = payload;
		options.provider_token = provider_token;
		options.start_parameter = start_parameter;
		options.currency = currency;
		options.prices = prices;
		
		return this.invoke("sendInvoice", options);
	}
	
	async invoke(method, params={}, timeout=0) {
		let parameters = "";
		let param = null;
		
		for(let i in params) {
			param = params[i];
			
			if(typeof param !== "string") {
				param = JSON.stringify(param);
			}
			
			parameters += i + "=" + encodeURIComponent(param) + "&";
		}
		
		let q = util.format(RAW_QUERY, this.token, method);
		
		const options = {
			hostname: 'api.telegram.org',
			port: 443,
			path: encodeURI(q),
			method: 'POST',
			agent: httpsAgent,
			timeout: timeout,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': parameters.length
			}
		};

		let result = null;
		
		try {
			result = await request(options, parameters);
		}catch(err) {
			throw getError(err, method, params, q);
		}

		if(result.headers["content-type"] === "application/json") {
			try {
				result.data = JSON.parse(result.body);
			}catch(err) {
				result.data = result.body;
			}
		}else{
			result.data = result.body;
		}

		if(!result.data.ok) {
			let e = result.data.error_code + ": " + result.data.description;
			let err = new Error(e);
			
			throw getError(err, method, params, q, result);
			return;
		}
		
		return result.data.result;
	}
}

function getError(err, method, params, q, result) {
	if(result) {
		err.statusCode = result.statusCode;
	}
	
	err.method = method;
	err.parameters = params;
	err.url = q;
	
	return err;
}

module.exports = TelegramClient;