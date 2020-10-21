"use strict";
const EventEmitter = require('events');
const BotAPI = require('./tg.js');
//const BotAPI = require('./iobot.js');
//const Agent = require('socks5-https-client/lib/Agent');

/*
## STATES ##

0 - Nothing
1 - Form
2 - Menu

*/

const RG_VERSION = 1.62;
const RG_DATE = "11.08.2019";

const INLINE_TYPES = {
	TEXT: 1,
	PHOTO: 2
}

function getFormByIndex(form, index) {
	let keys = Object.keys(form);
	return form[keys[index]];
}

function errFormString(form, str) {
	if(form.range) {
		if(str.length < form.range[0]) {
			if(form.range_err_min) {
				return form.range_err_min;
			}else{
				return form.range_err;
			}
		}else if(str.length > form.range[1]) {
			if(form.range_err_max) {
				return form.range_err_max;
			}else{
				return form.range_err;
			}
		}
	}
}

function errFormNumber(form, num) {
	num = parseInt(num, 10);
	
	if(isNaN(num)) return form.type_err;
	
	if(form.range) {
		if(num < form.range[0]) {
			if(form.range_err_min) {
				return form.range_err_min;
			}else{
				return form.range_err;
			}
		}else if(num > form.range[1]) {
			if(form.range_err_max) {
				return form.range_err_max;
			}else{
				return form.range_err;
			}
		}
	}
}

function errFormFloat(form, num) {
	num = parseFloat(num);
	
	if(isNaN(num)) return form.type_err;
	
	if(form.range) {
		if(num < form.range[0]) {
			if(form.range_err_min) {
				return form.range_err_min;
			}else{
				return form.range_err;
			}
		}else if(num > form.range[1]) {
			if(form.range_err_max) {
				return form.range_err_max;
			}else{
				return form.range_err;
			}
		}
	}
}

function errFormSelect(form, str) {
	if(form.select.indexOf(str) === -1) {
		if(str !== form.default_value) {
			return form.err;
		}
	}
}

function getMessage(msg, user) {
	switch(typeof msg) {
		case "string":
			return msg;
		case "function":
			return msg(user.id);
		default:
			throw new Error("Message type is not supported: " + typeof msg);
	}
}

class TextPreprocessor extends EventEmitter {
	constructor(output) {
		super();
		this.id = 0;
		this.currentState = 0;
		this.output = output;
		
		this.currentForm = {};
		this.currentFormData = {};
		this.currentFormFunction = function(result) {};
		this.currentFormOffset = 0;
		
		this.currentMenu = {};
		this.currentMenuData = [];
		this.currentMenuArgs = {};
		
		this.lastRenderedMenu = [];
	}
	
	input(str, args={}) {
		Object.assign(this.currentMenuArgs, args);
		
		switch(this.currentState) {
			case 1:
				this.formHandler(str);
				break;
			case 2:
				this.menuHandler(str);
				break;
		}
		
		return this.currentState;
	}
	
	menuHandler(str) {
		let newMenu = null;
		let currentMenu = this.currentMenu;
		
		if(currentMenu.buttons && currentMenu.buttons[str]) {
			newMenu = currentMenu.buttons[str];
		}else{
			if(!currentMenu.anyMatch) {
				if(currentMenu.restore) {
					newMenu = currentMenu.message;
				}else{
					return;
				}
			}else{
				newMenu = currentMenu.anyMatch;
			}
		}
		
		this.currentMenuData.push(str);
		let type = typeof(newMenu);
		let isArray = Array.isArray(newMenu);
		
		if(type !== "object" || isArray) {
			// Если это последний элемент меню
			if(!currentMenu.re) {
				this.currentState = 0;
			}
			
			if(!currentMenu.restore) {
				this.lastRenderedMenu = [];
			}else{
				if(!this.lastRenderedMenu.length) {
					this.lastRenderedMenu = getKeyboard(currentMenu);
				}
			}
			
			let data = this.currentMenuData;
			this.currentMenuData = [];
			
			if(isArray) {
				data.push(newMenu[1]);
				newMenu[0](data, this.currentMenuArgs);
			}
			
			if(type === "function") {
				newMenu(data, this.currentMenuArgs);
			}
			
			if(type === "string") {
				this.output(newMenu, this.lastRenderedMenu);
			}
			
			return;
		}
		
		this.currentMenu = newMenu;
		let keyboard = getKeyboard(newMenu);
		
		this.lastRenderedMenu = keyboard;
		this.output(getMessage( newMenu.message, this ), keyboard);
	}
	
	async formHandler(str) {
		let keys = Object.keys(this.currentForm);
		let attribute = keys[this.currentFormOffset];
		
		if(this.cancelButton === str) {
			this.currentState = 0;
			this.currentFormFunction(this.currentFormData, "aborted");
			return;
		}
		
		let form = null;

		while(form === null) {
			form = getFormByIndex(this.currentForm, this.currentFormOffset);

			if(form === null) {
				this.currentFormOffset++;
			}
		}
		
		if(this.backButton === str) {
			this.currentFormOffset--;
			
			form = null;

			while(form === null) {
				form = getFormByIndex(this.currentForm, this.currentFormOffset);

				if(form === null) {
					this.currentFormOffset--;
				}
			}
			
			if(!form || typeof form !== "object") {
				return;
			}
			
			let response = form.q;
			
			if(typeof(response) === "function") {
				response = await response(
					this.currentFormData,
					this.id,
					this.currentForm
				);
			}

			if(!response) {
				return;
			}
			
			this.output(response, this.getFormSelectMenu(form));
			
			return;
		}
		
		if(this.defaultButton === str) {
			str = form.default_value;
		}
		
		this.currentFormData[attribute] = str;
		
		let err = false;
		
		switch(form.type) {
			case "string":
				err = errFormString(form, str);
				break;
			case "number":
				err = errFormNumber(form, str);
				this.currentFormData[attribute] = parseInt(str, 10);
				break;
			case "select":
				err = errFormSelect(form, str);
				break;
			case "float":
				err = errFormFloat(form, str);
				this.currentFormData[attribute] = parseFloat(str);
				break;
			default:
				throw new Error("Unsupported form type: " + form.type);
		}
		
		if(err) {
			this.output(err, this.lastMarkup);
			return;
		}

		if(form.postHandler) {
			await form.postHandler(
				this.currentFormData,
				this.id,
				this.currentForm
			);
		}
		
		this.currentFormOffset++;
		
		let new_form = null;

		while(new_form === null) {
			new_form = getFormByIndex(
				this.currentForm,
				this.currentFormOffset
			);

			if(new_form === null) {
				this.currentFormOffset++;
			}
		}
		
		let keyboard = [];
		
		if(new_form) {
			keyboard = this.getFormSelectMenu(new_form);
		}
		
		if(keys.length === this.currentFormOffset) {
			// Если это последний элемент формы
			this.currentState = 0;
			this.currentFormFunction(this.currentFormData);
		}else{
			let markup = keyboard;

			if(markup.keyboard.length === 0) {
				markup = {
					keyboard: [],
					remove_keyboard: true
				}
			}
			
			this.lastMarkup = markup;
			
			let response = new_form.q;
			
			if(typeof(response) === "function") {
				response = await response(
					this.currentFormData,
					this.id,
					this.currentForm
				);
			}

			if(!response) {
				return;
			}

			this.output(response, markup);
		}
	}
	
	getFormSelectMenu(new_form) {
		let keyboard = [];
		let kbflag = false;
		let compareOffset = 0;
		
		let selectMenu = {
			options: new_form.options,
			layout: new_form.layout,
			buttons: {}
		};
		
		if(new_form.type && new_form.type === "select") {
			let kb = new_form.select;
			
			for(let i = 0; i < kb.length; i++) {
				selectMenu.buttons[kb[i]] = 0;
			}
			
			kbflag = true;
		}
		
		if(this.currentForm.cancel_btn) {
			compareOffset++;
		}
		
		if(this.currentForm.default_btn) {
			this.defaultButton = this.currentForm.default_btn;
			
			if(new_form.default_value !== undefined
			&& new_form.default_value !== null) {
				selectMenu.buttons[this.currentForm.default_btn] = 0;
			}
			
			compareOffset++;
			
			kbflag = true;
		}
		
		if(this.currentForm.back_btn) {
			this.backButton = this.currentForm.back_btn;
			
			compareOffset++;
			
			// Если это первый элемент формы и кнопка "Назад" для него не актуальна
			if(compareOffset !== this.currentFormOffset) {
				selectMenu.buttons[this.currentForm.back_btn] = 0;
				kbflag = true;
			}
		}
		
		if(this.currentForm.cancel_btn) {
			this.cancelButton = this.currentForm.cancel_btn;
			selectMenu.buttons[this.currentForm.cancel_btn] = 0;
			
			kbflag = true;
		}
		
		if(kbflag || new_form.options) {
			keyboard = getKeyboard(selectMenu);
		}
		
		this.lastMarkup = keyboard;
		
		return keyboard;
	}
	
	async startForm(form, callback) {
		this.currentForm = form;
		this.currentState = 1;
		this.currentFormOffset = 0;
		this.currentFormFunction = callback;
		this.currentFormData = {};
		
		this.lastMarkup = null;
		
		if(form.cancel_btn) {
			this.currentFormOffset++;
		}
		
		if(form.back_btn) {
			this.currentFormOffset++;
		}
		
		if(form.default_btn) {
			this.currentFormOffset++;
		}
		
		let payloadForm = null;

		while(payloadForm === null) {
			payloadForm = getFormByIndex(
				form,
				this.currentFormOffset
			);

			if(payloadForm === null) {
				this.currentFormOffset++;
			}
		}
		
		let keyboard = this.getFormSelectMenu(payloadForm);
		
		let response = payloadForm.q;
		
		if(typeof(response) === "function") {
			response = await response(this.currentFormData, this.id);
		}
		
		return this.output(response, keyboard);
	}
	
	startMenu(menu, args, options) {
		this.currentState = 2;
		this.currentMenu = menu;
		this.currentMenuArgs = args;
		
		let response = menu.message;

		if(options) {
			if(options.message) {
				response = options.message;
			}
			
			if(typeof options === "string") {
				response = options;
				options = [];
			}
		}
		
		let keyboard = getKeyboard(menu);
		
		return this.output(getMessage( response, this ), keyboard, options);
	}
}

function getButton(button) {
	let result = {};
	
	if(typeof(button) === "string") {
		result.text = button;
	}
	
	if(typeof(button) === "object") {
		result = button;
	}
	
	return result;
}

function getKeyboard(menu, inline=false, ignoreOptions=false) {
	let keyboard = [];
	
	let layout = menu.layout;
	let options = menu.options;
	
	let buttons = null;
	
	if(!inline) {
		buttons = Object.keys(menu.buttons);
	}else{
		buttons = menu.buttons;
	}
	
	if(!layout) {
		for(let i = 0; i < buttons.length; i++) {
			keyboard.push([getButton(buttons[i])]);
		}
	}
	
	if(typeof(layout) === "object") {
		let c = 0;
		
		for(let i = 0; i < layout.length; i++) {
			keyboard.push([]);
			
			for(let j = 0; j < layout[i]; j++) {
				keyboard[keyboard.length - 1].push(getButton(buttons[c]));
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
			
			keyboard[keyboard.length - 1].push(getButton(buttons[i]));
			c++;
			
			if(c === layout) {
				c = 0;
			}
		}
	}
	
	if(ignoreOptions || inline) {
		return keyboard;
	}
	
	if(options && options.remove_keyboard) {
		keyboard[0] = null;
	}
	
	return {
		keyboard: keyboard,
		options: options
	};
}

class TelegramClient extends EventEmitter {
	constructor(token, config) {
		super();
		this.token = token;
		
		this.bot = new BotAPI(this.token, {
			polling: true,
		});
		
		this.bot.on("text", this.textHandler.bind(this));
		this.bot.on("callback_query", this.callbackHandler.bind(this));
		
		this.config = config;
		this.defaultMenu = false;
		
		this.commands = {
			"/realgrace?": checkVersionHandler
		};
		
		this.routes = {};
		this.users = {};
		this.banned = {};
		this.preHandler = false;
		
		this.logs = [];
		this.logsChecked = true;
	}
	
	async callbackHandler(data) {
		let msg = data.message;
		let chat = msg.chat.id;
		let user = this.users[chat];
		let callbackData = data.data;
		
		console.log("callback_query:", chat, callbackData);

		if(!user) {
			return;
		}

		let now = Date.now();

		if(now - user.lastInline < 270) {
			return;
		}else{
			user.lastInline = now;
		}
		
		let handler = user.inlineCallbacks[callbackData];
		
		if(!handler) {
			return;
		}
		
		let nextStep = handler[0];
		let ctx = handler[4];
		let messageType = handler[3];
		let inlineId = handler[5];

		if(ctx.lastInlineId - inlineId > 1) {
			return;
		}
		
		ctx.messageType = messageType;
		ctx.inlineKeyboard = handler[1];
		ctx.msg = msg;
		ctx.chatId = msg.chat.id;
		ctx.userId = data.from.id;
		ctx.inlineMessageId = msg.message_id;
		ctx.callid = data.id;
		ctx.answered = false;
		
		if(typeof(nextStep) === "object") {
			ctx.inline(handler[2], nextStep);
		}else{
			await nextStep(handler[2], ctx);
		}
	
		if(!ctx.answered) {
			ctx.answer();
		}
	}
	
	async textHandler(msg) {
		if(this.banned[msg.chat.id]) {
			return;
		}
		
		let ctx = this.getContext(msg.chat.id, msg);
		
		if(this.preHandler) {		
			if(!(await this.preHandler(msg, ctx))) {
				return;
			}
		}
		
		let id = msg.chat.id;
		
		if(this.routes[msg.chat.id]) {
			this.routes[msg.chat.id](msg, ctx);
			return;
		}
		
		if(msg.chat.type !== "private") return;
		
		if(this.logs.length === 25) {
			this.logs.splice(0, 1);
		}
		
		this.logs.push(msg.chat.id + ": " + msg.text);
		this.logsChecked = false;
		
		if(!this.users[id]) {
			this.regUser(id, msg);
		}
		
		let command = this.commandHandler(msg, ctx);
		
		if(command) return;
		
		let state = this.users[id].input(msg.text, { msg: msg });
	}
	
	regUser(id, msg) {	
		this.users[id] = new TextPreprocessor(function(str, kb, options) {
			return this.outputHandler(id, str, kb, options);
		}.bind(this));
		
		let userPointer = this.users[id];
		
		userPointer.id = id;
		userPointer.lastSentMessage = 0;
		userPointer.lastInline = 0;
		
		userPointer.lockCommands = false;
	
		userPointer.currentMenu = this.defaultMenu;
		userPointer.currentMenuArgs = this.getContext(id, msg);
		userPointer.currentState = 2;
		
		userPointer.inlineCallbacks = {};
	}
	
	async outputHandler(id, str, kb=null, options={}) {		
		let reply_markup = {
			keyboard: []
		};
		
		if(kb && typeof(kb) === "object") {
			if(kb.keyboard) {
				reply_markup = kb;
				
				reply_markup.one_time_keyboard = false;
				reply_markup.resize_keyboard = true;
			}else{				
				reply_markup = {
					keyboard: kb,
					one_time_keyboard: false,
					resize_keyboard: true
				}
			}
			
			if(kb.options) {
				Object.assign(options, kb.options);
			}
		}
		
		let resp = null;
		
		options.reply_markup = reply_markup
		
		if(reply_markup.keyboard[0] === null) {
			options.reply_markup = {
				remove_keyboard: true
			}
		}
		
		if(options) {
			if(options.message) {
				delete options['message'];
			}
			
			if(options.options) {
				delete options['options'];
			}
		}
		
		if(options && options.photo) {
			if(str) {
				options.caption = str;
			}
			
			resp = await this.bot.sendPhoto(id, options.photo, options);
		}else{
			resp = await this.bot.sendMessage(id, str, options);
		}
		
		this.users[id].lastSentMessage = resp.message_id;
		
		return resp;
	}
	
	commandHandler(msg, context) {
		if(context.user.lockCommands) {
			return false;
		}
		
		let command = this.commands[msg.text.split(" ")[0]];
		let id = msg.chat.id;
		
		if(!command) {
			if(this.users[id].currentMenu) return false;
			
			if(this.commands['other']) {
				command = this.commands['other'];
			}else{
				return false;
			}
		}
		
		command(msg, context);
		
		return true;
	}
	
	inline(user, data, keyboard, inlineMessageId, edit, messageType, ctx) {
		let self = this;
		
		if(!("length" in keyboard)) {
			keyboard = Object.assign({}, keyboard);
		}
		
		function deleteMessage() {
			self.bot.deleteMessage(user.id, inlineMessageId);
			edit = false;
		}
		
		if(inlineMessageId === 0) {
			messageType = INLINE_TYPES.TEXT;
			
			if(data.photo) {
				messageType = INLINE_TYPES.PHOTO;
			}
			
			edit = false;
		}else{
			if(!edit) {
				deleteMessage();
			}else{
				if(messageType === INLINE_TYPES.TEXT) {
					if(data.photo) {
						deleteMessage();
						messageType = INLINE_TYPES.PHOTO;
					}
				}
				
				if(messageType === INLINE_TYPES.PHOTO) {
					if(!data.photo) {
						deleteMessage();
						messageType = INLINE_TYPES.TEXT;
					}
				}
			}
		}
		
		let buttons = keyboard.buttons;
		
		if(buttons) {
			let button = null;
			let inlineButtons = [];
			
			let callbackFunction = null;
			let urlOrCallbackData = null;
			
			let inlineCallbacks = [];
			
			for(let i in buttons) {
				button = buttons[i];
				
				urlOrCallbackData = button[0];
				callbackFunction = button[1];
				
				if(callbackFunction) {
					inlineCallbacks.push([
						urlOrCallbackData,
						callbackFunction,
						button[2]
					]);
					
					inlineButtons.push({
						text: i,
						callback_data: urlOrCallbackData
					});
				}else{
					inlineButtons.push({
						text: i,
						url: urlOrCallbackData
					});
				}
			}
			
			keyboard.buttons = inlineButtons;
			keyboard = getKeyboard(keyboard, true);
			
			let inlineId = ctx.lastInlineId++;

			for(let i = 0; i < inlineCallbacks.length; i++) {
				let callback = inlineCallbacks[i];
				
				user.inlineCallbacks[callback[0]] = [
					callback[1],
					keyboard,
					callback[2],
					messageType,
					ctx,
					inlineId
				];
			}
		}
		
		let options = {
			reply_markup: {}
		};
		
		let text = null;
		
		if(typeof(data) === "object") {
			text = data.message;
			delete data['message'];
			
			Object.assign(options, data);
		}else{
			text = data;
		}
		
		if(options.remove_inline) {
			delete options['remove_inline'];
		}else{
			options.reply_markup.inline_keyboard = keyboard;
		}
		
		if(edit) {
			options.chat_id = user.id;
			options.message_id = inlineMessageId;
		}
		
		if(messageType === INLINE_TYPES.PHOTO) {
			if(text) {
				options.caption = text;
			}
			
			if(!edit) {
				return this.bot.sendPhoto(user.id, options.photo, options);
			}else{
				let media = {
					type: "photo",
					media: options.photo,
					caption: options.caption,
					parse_mode: options.parse_mode
				}

				return this.bot.editMessageMedia(media, options);
			}
		}
		
		if(!edit) {
			return this.bot.sendMessage(user.id, text, options);
		}else{
			return this.bot.editMessageText(text, options);
		}
	}
	
	getContext(
		id,
		msg={},
		inlineMessageId=0,
		inlineKeyboard=null,
		callid=0,
		messageType=0
	) {
		let self = this;
		
		if(!this.users[id]) {
			this.regUser(id, msg);
		}
		
		if(!msg.chat) {
			msg.chat = {
				id: id
			}
		}
		
		if(!msg.from) {
			msg.from = {
				id: id
			}
		}
		
		let context = {
			id: id,
			chatId: msg.chat.id,
			userId: msg.from.id,
			msg: msg,
			user: this.users[id],
			inlineMessageId: inlineMessageId,
			messageType: messageType,
			inlineKeyboard: inlineKeyboard,
			callid: callid,
			lastInlineId: 0,
			answered: false,
			
			deleteLast: function() {
				return this.bot.deleteMessage(
					id,
					this.users[id].lastSentMessage
				);
			}.bind(this),
			
			response: async function(data, options={}) {
				let resp = await this.bot.sendMessage(id, data, options);
				this.users[id].lastSentMessage = resp.message_id;
				
				return resp;
			}.bind(this),
			
			answer(text="", show_alert=false) {
				this.answered = true;

				return self.bot.answerCallbackQuery(this.callid, {
					text: text,
					show_alert: show_alert
				});
			},
			
			inline: async function(data, keyboard=this.inlineKeyboard, edit=true) {
				if(keyboard === null) {
					keyboard = {
						layout: 0,
						buttons: {}
					};
				}
				
				let inlineCtx = this;

				if(this.inlineMessageId === 0) {
					let uid = this.user.id;

					inlineCtx = self.getContext(uid, {
						from: {
							id: uid
						}
					});
				}

				return self.inline(
					inlineCtx.user,
					data,
					keyboard,
					inlineCtx.inlineMessageId,
					edit,
					inlineCtx.messageType,
					inlineCtx
				);
			},
			
			startForm: function(form, callback) {
				return this.users[id].startForm(form, function(data, err) {
					callback(data, self.getContext(id, msg), err);
				});
			}.bind(this),
			
			startMenu: function(menu, options) {
				return this.users[id].startMenu(
					menu,
					self.getContext(id, msg),
					options
				);
			}.bind(this),
			
			re: function(menu, message) {
				this.setState(id, 2);
			}.bind(this),
			
			setState: function(newState) {
				this.setState(id, newState);
			}.bind(this)
		};

		return context;
	}
	
	setState(id, state) {
		this.users[id].currentState = state;
	}
	
	start() {
		this.bot.start();
		
		//this.bot = new BotAPI(this.config);
		
		/*this.bot.on("callback_query", (data) => {
			
			if(this.banned[data.from.id]) {
				return;
			}
			
			this.emit("callback_query",
				data,
				this.getContext(data.from.id, data.message)
			);
			
			this.bot.answerCallbackQuery(data.id);
		});*/
	}
}

function checkVersionHandler(data, ctx) {
	let response = "Powered by Real Grace Engine v"
	+ RG_VERSION.toFixed(2) + " (" + RG_DATE +")";
	
	ctx.response(response);
}

module.exports = TelegramClient;