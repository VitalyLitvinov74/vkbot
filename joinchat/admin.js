"use strict";
const util = require('util');
const fs = require('fs');

function getRand(min, max) {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function toHHMMSS(str) {
    let rawSeconds = parseInt(str, 10);
	
    let hours   = Math.floor(rawSeconds / 3600);
    let minutes = Math.floor((rawSeconds - (hours * 3600)) / 60);
    let seconds = rawSeconds - (hours * 3600) - (minutes * 60);

    if (hours   < 10) { hours   = "0" + hours;   }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
	
    let time = hours + ':' + minutes + ':' + seconds;
	
    return time;
}

function objToStr(obj) {
	var str = "";
	
	for(var i in obj) {
		str += i + ": " + obj[i] + "\n";
		
		if(obj[i] && typeof obj[i] === "object") {
			str += objToStr(obj[i]) + "\n";
		}
	}
	
	return str;
}

class Admin {
	constructor(admin, settings, update) {
		this.admin = admin;
		this.settings = settings;
	}
	
	async handler(msg, ctx) {
		//if(msg.chat.type !== "group") return;
		
		if(msg.chat.id !== this.admin) return;
		
		if(msg.text[0] !== "/") return;
		
		var args = msg.text.split("\n").join(" ").split("@")[0].split(" ");
		
		if(args.length === 1) {
			args = args[0].split("_");
		}
		
		var command = args[0].toLowerCase();
		
		if(!this[command]) {
			ctx.response("Ошибка.\nТакой команды не существует.");
			return;
		}
		
		try {
			await this[command](msg, ctx, args);
		}catch(err) {
			let en = "Произошла ошибка при выполнении команды:\n"
			+ err.message;
			
			let additionalInfo = "";
			let attempts = 5;
			
			while(true) {
				try {
					await ctx.response(en + additionalInfo);
				}catch(err) {
					if(attempts === 0) {
						break;
					}
					
					additionalInfo = "\n\nНаблюдаются проблемы с "
					+ "доступностью серверов Telegram";
					
					attempts--;
					
					continue;
				}
				
				break;
			}
		}
	}
	
	['/set'](msg, ctx, args) {
		args = msg.text.split("\n");
		
		if(args.length < 3) {
			ctx.response("Ожидается как минимум 2 аргумента!");
			return;
		}
		
		if(!args[1] || !args[2]) {
			ctx.response("Синтаксическая ошибка!");
			return;
		}
		
		this.settings[args[1]] = args[2];
		
		this.updateSettings();
		
		ctx.response("Значение успешно задано!");
	}
	
	['/del'](msg, ctx, args) {
		args = msg.text.split("\n");
		
		if(args.length < 2) {
			ctx.response("Ожидается как минимум 1 аргумент!");
			return;
		}
		
		if(!args[1]) {
			ctx.response("Синтаксическая ошибка!");
			return;
		}
		
		if(!this.settings[args[1]]) {
			ctx.response("Не найдена такая ссылка!");
			return;
		}
		
		delete this.settings[args[1]];
		
		this.updateSettings();
		
		ctx.response("Значение успешно удалено!");
	}
	
	updateSettings() {
		let settings = JSON.stringify(this.settings, null, "\t");
		
		fs.writeFile("./settings.json", settings, "utf-8", () => {});
	}
	
	['/test'](msg, ctx) {
		ctx.response("Tost!");
	}
	
	['/remkb'](msg, ctx) {
		ctx.response("Клавиатура удалена!", {
			reply_markup: {
				remove_keyboard: true
			}
		});
	}
	
	['/ram'](msg, ctx) {
		let memoryUsage = process.memoryUsage();
		let response = "";
		
		for(let i in memoryUsage) {
			let key = i.toUpperCase();
			let value = Math.floor(memoryUsage[i]/1048576) + ' MB';
			
			response += key + ": " + value + "\n";
		}
		
		ctx.response("Потребление оперативной памяти:\n\n" + response);
	}
	
	async ['/uptime'](msg, ctx) {
		let time = process.uptime();
		let uptime = toHHMMSS(time);
		
		let result = await ctx.response(uptime);
	}
}

module.exports = Admin;
