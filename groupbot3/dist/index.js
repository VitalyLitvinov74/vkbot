"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.strings = void 0;
const vkbot_1 = require("./vkbot");
const rg_1 = require("rg");
const storage_1 = require("./storage");
const fs_1 = require("fs");
const config = require("./config");
const SNIFF_TEMPLATE = fs_1.readFileSync("./sniff.txt", "utf-8");
let sniffed = {};
const splittedSniffedUsers = SNIFF_TEMPLATE.split("\n");
for (const sniffedUser of splittedSniffedUsers) {
    sniffed[+sniffedUser] = true;
}
let reads = {};
exports.strings = new storage_1.Storage();
exports.strings.read();
rg_1.setProduction();
const queue = [];
const bot = new vkbot_1.VKBot(config.VK_TOKEN);
function getUserNameByID(profiles, id) {
    for (const profile of profiles) {
        if (profile.id === id) {
            return profile.first_name;
        }
    }
    return null;
}
async function onConversation(conversation, profiles) {
    const conv = conversation.conversation;
    const msg = conversation.last_message;
    if (msg.from_id !== config.GROUP_ID) {
        return;
    }
    if (msg.text.indexOf(SNIFF_TEMPLATE) !== -1 && !sniffed[conv.peer.id]) {
        console.log("Записан пользователь в локальную базу: " + conv.peer.id);
        fs_1.appendFile("./sniffedusers.txt", conv.peer.id + "\n", "utf-8", () => { });
        sniffed[conv.peer.id] = true;
    }
    let txt = exports.strings.get(msg.text);
    if (!txt) {
        return;
    }
    const now = Math.floor(Date.now() / 1000);
    if (conv.peer.type !== "user") {
        return;
    }
    if (conv.peer.id === undefined) {
        return;
    }
    if (msg.id !== conv.out_read) {
        if (reads[conv.peer.id] === undefined) {
            console.log("Ключевое сообщение зарегистрировано", conv.peer.id);
        }
        reads[conv.peer.id] = 0;
    }
    else {
        if (!reads[conv.peer.id]) {
            console.log("Сообщение прочитано", conv.peer.id);
            reads[conv.peer.id] = now;
        }
    }
    if (reads[conv.peer.id] === 0) {
        return;
    }
    if (reads[conv.peer.id] === undefined) {
        return;
    }
    if (Math.floor((now - reads[conv.peer.id]) / 60) < config.TIME_DIFF_MINS) {
        return;
    }
    delete reads[conv.peer.id];
    const user = getUserNameByID(profiles, conv.peer.id);
    rg_1.assert(user);
    console.log("Отправлен ответ для", user, conv.peer.id);
    const entry = {
        to: conv.peer.id,
        text: rg_1.format(txt, {
            name: user
        })
    };
    queue.push(entry);
}
require("./admin");
bot.start((conversations, profiles) => {
    conversations.forEach((conv) => {
        onConversation(conv, profiles);
    });
});
function queueUpdate() {
    const entry = queue.pop();
    if (!entry) {
        return;
    }
    bot.sendMessage(entry.to, entry.text);
}
setInterval(queueUpdate, 500);
//# sourceMappingURL=index.js.map