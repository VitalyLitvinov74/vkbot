export type VKError = {
    error_code: number;
    error_msg: string;
}

export type VKResponse<T> = {
    response?: T;
    error?: VKError
}

export type VKPeer = {
    id: number;
    type: string;
    local_id: number;
}

export type VKMessage = {
    date: number;
    from_id: number;
    id: number;
    out: number;
    peer_id: number;
    text: string;
    conversation_message_id: number;
    fwd_messages: VKMessage[];
    important: boolean;
    random_id: number;
}

export type VKRawMessage = {
    id: number;
    user_id: number;
    date: number;
    read_state: number;
    out: number;
    title: string;
    body: string;
}

export type VKGetMessagesResponse = {
    count: number;
    items: VKRawMessage[];
}

export type VKConversation = {
    conversation: {
        peer: VKPeer;
        last_message_id: number;
        in_read: number;
        out_read: number;
        push_settings: {
            disabled_forever: boolean,
            no_sound: boolean
        },
        can_write: {
            allowed: boolean
        }
    },
    last_message: VKMessage
}

export type VKUserResponse = {
    id: number;
    first_name: string;
    last_name: string;
    is_closed: boolean;
    can_access_closed: boolean;
}

export type VKGetConversationsResponse = {
    count: number;
    items: VKConversation[];
    profiles: VKUserResponse[];
}