"use strict";
const fs = require("fs");
const http = require("http");
const RGE = require("./rge.js");
const Admin = require("./admin.js");

const PORT = 8080;

const RAW_SETTINGS = fs.readFileSync("./settings.json", "utf-8");
const INDEX_FILE = fs.readFileSync("./index.html", "utf-8");

const settings = JSON.parse(RAW_SETTINGS);

const ADMIN = -1001315542341;
const tg = new RGE("994422455:AAFUSlnS1zVXqDxIJ-yPjk7BQVMvZf7wJLI");

let admin = new Admin(ADMIN, settings);

let server = http.createServer(requestListener);

server.listen(8080, "127.0.0.1");

function requestListener(req, res) {
	let parsedURL = req.url.split("/");
	let endpoint = parsedURL[1];
	
	let response = null;

	if(endpoint === "joinchat") {
		response = getJoinchatResponse(req, res, parsedURL);
	}else{
		response = getPublicResponse(req, res, parsedURL);
	}

	if(!response) {
		res.statusCode = 404;
		res.end("Not found");

		return;
	}	

	if(!response.is_success) {
		res.statusCode = response.error.code;
		res.end(response.error.message);
		
		return;
	}
	
	res.writeHead(200, {
		"content-type": "text/html; charset=UTF-8"
	});
	
	res.end(response.data);
}

function getPublicResponse(req, res, parsedURL) {
	let link = parsedURL[1];
	
	if(!link) {
		return {
			is_success: false,
			error: {
				code: 400,
				message: "Bad Request"
			}
		};
	}
	
	let result = {
		is_success: true,
		data: getPublicPage(link)
	}

	return result;
}

function getJoinchatResponse(req, res, parsedURL) {
	let link = parsedURL[2];
	
	if(!link) {
		return {
			is_success: false,
			error: {
				code: 400,
				message: "Bad Request"
			}
		};
	}
	
	let result = {
		is_success: true,
		data: getJoinchatPage(link)
	}

	return result;
}

tg.routes[ADMIN] = admin.handler.bind(admin);

tg.preHandler = function(msg, ctx) {
	console.log("От: " + ctx.id + ": " + msg.text);
	return true;
}

tg.start();

console.log("Бот запущен!");

function getPublicPage(link) {
	if(settings[link]) {
		link = settings[link];
	}
	
	return replaceAll(INDEX_FILE, "{ link }", "resolve?domain=" + link);
}

function getJoinchatPage(link) {
	if(settings[link]) {
		link = settings[link];
	}
	
	return replaceAll(INDEX_FILE, "{ link }", "join?invite=" + link);
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(find, 'g'), replace);
}