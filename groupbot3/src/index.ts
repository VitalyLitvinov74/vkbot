import { VKBot } from "./vkbot";
import { VKConversation, VKUserResponse } from "./types";
import { format, assert, setProduction } from "rg";
import { Storage } from "./storage";
import { readFileSync, appendFile } from "fs";

import * as config from "./config";

const SNIFF_TEMPLATE = readFileSync("./sniff.txt", "utf-8");

let sniffed: Record<number, boolean> = {};

const splittedSniffedUsers = SNIFF_TEMPLATE.split("\n");

for (const sniffedUser of splittedSniffedUsers) {
	sniffed[+sniffedUser] = true;
}

let reads: Record<number, number> = {};

export let strings = new Storage();
strings.read();

setProduction();

type QueueEntry = {
	to: number;
	text: string;
}

const queue: QueueEntry[] = [];

const bot = new VKBot(config.VK_TOKEN);

function getUserNameByID(profiles: VKUserResponse[], id: number): string | null {
    for(const profile of profiles) {
        if(profile.id === id) {
            return profile.first_name;
        }
    }

    return null;
}

async function onConversation(conversation: VKConversation, profiles: VKUserResponse[]) {
    const conv = conversation.conversation;
    const msg = conversation.last_message;

    if(msg.from_id !== config.GROUP_ID) {
        return;
    }
	
	if(msg.text.indexOf(SNIFF_TEMPLATE) !== -1 && !sniffed[conv.peer.id]) {
		console.log("Записан пользователь в локальную базу: " + conv.peer.id);
		
		appendFile(
			"./sniffedusers.txt",
			conv.peer.id + "\n",
			"utf-8",
			() => {}
		);
		
		sniffed[conv.peer.id] = true;
	}

    let txt: string | undefined = strings.get(msg.text);

    if(!txt) {
        return;
    }

    const now = Math.floor(Date.now() / 1000);

    if(conv.peer.type !== "user") {
        return;
    }

    if(conv.peer.id === undefined) {
        return;
    }

    if(msg.id !== conv.out_read) {
		if(reads[conv.peer.id] === undefined) {
			console.log("Ключевое сообщение зарегистрировано", conv.peer.id);
		}
		
		reads[conv.peer.id] = 0;
    } else {
        if(!reads[conv.peer.id]) {
			console.log("Сообщение прочитано", conv.peer.id);
            reads[conv.peer.id] = now;
        }
    }

    if(reads[conv.peer.id] === 0) {
        return;
    }

    if(reads[conv.peer.id] === undefined) {
        return;
    }
    
    if(Math.floor((now - reads[conv.peer.id]) / 60) < config.TIME_DIFF_MINS) {
        return;
    }

    delete reads[conv.peer.id];

    const user = getUserNameByID(profiles, conv.peer.id);
    assert(user);
    
	console.log("Отправлен ответ для", user, conv.peer.id);
	
	const entry: QueueEntry = {
		to: conv.peer.id,
		text: format(
			txt,
			{
				name: user
			}
		)
	};
	
    queue.push(entry);
}

import "./admin";

bot.start((conversations: VKConversation[], profiles: VKUserResponse[]) => {
    conversations.forEach((conv) => {
        onConversation(conv, profiles);
    });
});

function queueUpdate() {
	const entry = queue.pop();
	
	if(!entry) {
		return;
	}
	
	bot.sendMessage(entry.to, entry.text);
}

setInterval(queueUpdate, 500);