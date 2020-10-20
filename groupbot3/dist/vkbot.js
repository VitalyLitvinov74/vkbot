"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VKBot = void 0;
const rg_web_1 = require("rg-web");
const querystring = require("querystring");
const rg_1 = require("rg");
const BASE_HOST = "api.vk.com";
const POLLING_INTERVAL = 10000;
const MAX_OFFSET = 1000;
class VKBot {
    constructor(token) {
        this.lastCheckTime = 0;
        this.currentOffset = 0;
        this.token = token;
        this.client = new rg_web_1.RGWeb(BASE_HOST, 443, "https");
    }
    start(callback) {
        this.callback = callback;
        this.poll();
    }
    async getConversations(offset, count) {
        return this.request("messages.getConversations", { offset, count, extended: 1 });
    }
    async getUsers(user_ids) {
        return this.request("users.get", { user_ids });
    }
    async getMessagesById(ids) {
        return this.request("messages.getById", { message_ids: ids, extended: 1 });
    }
    async sendMessage(user_id, message) {
        return this.request("messages.send", { user_id, message, random_id: rg_1.getRandom(0, 10000) });
    }
    async request(method, params) {
        params.access_token = this.token;
        params.v = "5.103";
        const response = await this.client.request({
            path: "/method/" + method + "/?" + querystring.stringify(params)
        }, null);
        if (!response.is_success) {
            console.error(new Error("An error has occurred:"));
            console.error(response.error);
            return response;
        }
        if (response.http_status_code !== 200) {
            return {
                is_success: false,
                error: {
                    code: response.http_status_code
                }
            };
        }
        const vkResponse = JSON.parse(response.data);
        if (vkResponse.error) {
            console.error(new Error("An error has occurred:"));
            console.error(vkResponse.error);
            return {
                is_success: false,
                error: {
                    code: vkResponse.error.error_code,
                    message: vkResponse.error.error_msg
                }
            };
        }
        rg_1.assert(vkResponse.response);
        return {
            is_success: true,
            data: vkResponse.response
        };
    }
    async poll() {
        if (this.callback) {
            const conversations = await this.getConversations(this.currentOffset, 200);
            if (!conversations.is_success) {
                setTimeout(this.poll.bind(this), POLLING_INTERVAL);
                return;
            }
            const data = conversations.data;
            if (data.items.length === 0 || this.currentOffset === MAX_OFFSET) {
                this.currentOffset = 0;
                setTimeout(this.poll.bind(this), POLLING_INTERVAL);
                return;
            }
            this.callback(data.items, data.profiles);
            this.currentOffset += 200;
        }
        setTimeout(this.poll.bind(this), POLLING_INTERVAL);
    }
}
exports.VKBot = VKBot;
//# sourceMappingURL=vkbot.js.map