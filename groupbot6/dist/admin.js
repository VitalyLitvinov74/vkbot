"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tgui_1 = require("tgui");
const _1 = require("./");
const fs_1 = require("fs");
let keyStack = [];
const config = require("./config");
const bot = new tgui_1.TelegramUI(config.TELEGRAM_TOKEN);
let admin = bot.createCommandTerminal(config.ADMIN_CHAT_ID);
function onAdd(msg, args) {
    keyStack.push(args[0]);
    return "Успешно! Теперь введите /set";
}
function onSet(msg, args) {
    const key = keyStack.pop();
    if (!key) {
        return "Ключевое слово не задано!";
    }
    _1.strings.set(key, args[0]);
    return "Успешно!";
}
function onDrop(msg, args) {
    if (!_1.strings.remove(args[0])) {
        return "Ключевая фраза не найдена!";
    }
    return "Удалено!";
}
function onGetAll(msg, args) {
    return _1.strings.getFormat();
}
admin.setHelp("/help");
admin.setCommand("/getall", "Возвращает все фразы", onGetAll);
admin.setCommand("/drop", "Удалить ключевую фразу", onDrop, [
    {
        name: "Ключевая фраза",
        type: 4 /* Text */
    }
]);
admin.setCommand("/set", "Изменить ответ на ключевую фразу", onSet, [
    {
        name: "Ответ",
        type: 4 /* Text */
    }
]);
admin.setCommand("/add", "Добавить ключевую фразу", onAdd, [
    {
        name: "Ключевая фраза",
        type: 4 /* Text */
    }
]);
admin.setCommand("/db", "Получить базу", onDb);
async function onDb(msg) {
    await bot.sendTextMessage(msg.chat.id, "Подготовка результата. Пожалуйста, подождите...");
    const file = await fs_1.promises.readFile("./sniffedusers.txt");
    const document = {
        filename: Date.now() + ".txt",
        data: file
    };
    bot.sendDocument(msg.chat.id, document);
    return null;
}
bot.start();
//# sourceMappingURL=admin.js.map