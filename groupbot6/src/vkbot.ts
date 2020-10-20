import { RGWeb } from "rg-web";
import * as querystring from "querystring";
import { RGResult, assert, getRandom } from "rg";
import { VKResponse, VKGetConversationsResponse, VKConversation, VKMessage, VKUserResponse, VKRawMessage, VKGetMessagesResponse } from "./types";

const BASE_HOST = "api.vk.com";
const POLLING_INTERVAL = 10000;
const MAX_OFFSET = 1000;

type ConversationsCallback = (conversations: VKConversation[], profiles: VKUserResponse[]) => void;

export class VKBot {
    private token: string;
    private client: RGWeb;

    private callback?: ConversationsCallback;

    private lastCheckTime: number = 0;

    private currentOffset = 0;

    public constructor(token: string) {
        this.token = token;
        this.client = new RGWeb(BASE_HOST, 443, "https");
    }

    public start(callback: ConversationsCallback) {
        this.callback = callback;

        this.poll();
    }

    public async getConversations(
        offset: number, 
        count: number
    ): Promise<RGResult<VKGetConversationsResponse>> {
        return this.request<VKGetConversationsResponse>(
            "messages.getConversations",
            { offset, count, extended: 1 }
        );
    }

    public async getUsers(user_ids: number[]): Promise<RGResult<VKUserResponse[]>> {
        return this.request<VKUserResponse[]>(
            "users.get",
            { user_ids }
        );
    }

    public async getMessagesById(ids: number[]): Promise<RGResult<VKGetMessagesResponse>> {
        return this.request<VKGetMessagesResponse>(
            "messages.getById",
            { message_ids: ids, extended: 1 }
        );
    }

    public async sendMessage(
        user_id: number, 
        message: string
    ): Promise<RGResult<number>> {
        return this.request<number>(
            "messages.send",
            { user_id, message, random_id: getRandom(0, 10000) }
        );
    }

    private async request<T>(
        method: string, 
        params: querystring.ParsedUrlQueryInput
    ): Promise<RGResult<T>> {
        params.access_token = this.token;
        params.v = "5.103";

        const response = await this.client.request({
            path: "/method/" + method + "/?" + querystring.stringify(params)
        }, null);

        if(!response.is_success) {
            console.error(new Error("An error has occurred:"));
            console.error(response.error);
            return response;
        }

        if(response.http_status_code !== 200) {
            return {
                is_success: false,
                error: {
                    code: response.http_status_code
                }
            }
        }

        const vkResponse = <VKResponse<T>>JSON.parse(response.data);

        if(vkResponse.error) {
			console.error(new Error("An error has occurred:"));
            console.error(vkResponse.error);
			
            return {
                is_success: false,
                error: {
                    code: vkResponse.error.error_code,
                    message: vkResponse.error.error_msg
                }
            }
        }

        assert(vkResponse.response);

        return {
            is_success: true,
            data: vkResponse.response
        };
    }

    private async poll() {
        if(this.callback) {
            const conversations = await this.getConversations(this.currentOffset, 200);

            if(!conversations.is_success) {
                setTimeout(this.poll.bind(this), POLLING_INTERVAL);
                return;
            }

            const data = conversations.data;

            if(data.items.length === 0 || this.currentOffset === MAX_OFFSET) {
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