export type User = {
	id: number;
	is_bot: boolean;
	first_name: string;
	last_name?: string;
	username?: string;
	language_code?: string;
	can_join_groups?: boolean;
	can_read_all_group_messages?: boolean;
	supports_inline_queries?: boolean;
}

export const enum ChatTypes {
	Private = "private",
	Group = "group",
	Supergroup = "supergroup",
	Channel = "channel"
}

export const enum ChatMemberStatuses {
	Creator = "creator",
	Administrator = "administrator",
	Member = "member",
	Restricted = "restricted",
	Left = "left",
	Kicked = "kicked"
}

export type PhotoSize = {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	file_size?: number;
}

export type ChatPhoto = {
	small_file_id: string;
	small_file_unique_id: string;
	big_file_id: string;
	big_file_unique_id: string;
}

export type ChatMember = {
	user: User;
	status: ChatMemberStatuses;
	custom_title?: string;
	until_date?: number;
	can_be_edited?: boolean;
	can_post_messages?: boolean;
	can_edit_messages?: boolean;
	can_delete_messages?: boolean;
	can_restrict_members?: boolean;
	can_promote_members?: boolean;
	can_change_info?: boolean;
	can_invite_users?: boolean;
	can_pin_messages?: boolean;
	is_member?: boolean;
	can_send_messages?: boolean;
	can_send_media_messages?: boolean;
	can_send_polls?: boolean;
	can_send_other_messages?: boolean;
	can_add_web_page_previews?: boolean;
}

export type ChatPermissions = {
	can_send_messages?: boolean;
	can_send_media_messages?: boolean;
	can_send_polls: boolean;
	can_send_other_messages: boolean;
	can_add_web_page_previews: boolean;
	can_change_info: boolean;
	can_invite_users: boolean;
	can_pin_messages: boolean;
}

export type Chat = {
	id: number;
	type: ChatTypes;
	title?: string;
	username?: string;
	first_name?: string;
	last_name?: string;
	photo?: ChatPhoto;
	description?: string;
	invite_link?: string;
	pinned_message?: Message;
	permissions?: ChatPermissions;
	slow_mode_delay?: number;
	sticker_set_name?: number;
	can_set_sticker_set?: boolean;
}

export type MessageEntity = {
	type: string;
	offset: number;
	length: number;
	url?: string;
	user?: User;
	language?: string;
}

export type Audio = {
	file_id: string;
	file_unique_id: string;
	duration: number;
	performer?: string;
	title?: string;
	mime_type?: string;
	file_size?: number;
	thumb?: PhotoSize;
}

export type Document = {
	file_id: string;
	file_unique_id: string;
	thumb?: PhotoSize;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

export type Animation = {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	duration: number;
	thumb?: PhotoSize;
	file_name?: string;
	mime_type?: string;
	file_size?: number;
}

export type Game = {
	title: string;
	description: string;
	photo: PhotoSize[];
	text?: string;
	text_entities?: MessageEntity[];
	animation?: Animation;
}

export type MaskPosition = {
	point: string;
	x_shift: number;
	y_shift: number;
	scale: number;
}

export type Sticker = {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	is_animated: boolean;
	thumb?: PhotoSize;
	emoji?: string;
	set_name?: string;
	mask_position?: MaskPosition;
	file_size?: number;
}

export type Video = {
	file_id: string;
	file_unique_id: string;
	width: number;
	height: number;
	duration: number;
	thumb?: PhotoSize;
	mime_type?: string;
	file_size?: number;
}

export type Voice = {
	file_id: string;
	file_unique_id: string;
	duration: number;
	mime_type?: string;
	file_size?: number;
}

export type VideoNote = {
	file_id: string;
	file_unique_id: string;
	length: number;
	duration: number;
	thumb?: PhotoSize;
	file_size?: number;
}

export type Contact = {
	phone_number: string;
	first_name: string;
	last_name?: string;
	user_id?: number;
	vcard?: string;
}

export type Location = {
	longitude: number;
	latitude: number;
}

export type Venue = {
	location: Location;
	title: string;
	address: string;
	foursquare_id?: string;
	foursquare_type?: string;
}

export type PollOptions = {
	text: string;
	voter_count: number;
}

export type Poll = {
	id: string;
	question: string;
	options: PollOptions[];
	total_voter_count: number;
	is_closed: boolean;
	is_anonymous: boolean;
	type: string;
	allows_multiple_answers: boolean;
	correct_option_id?: number;
}

export type Dice = {
	emoji: string;
	value: number;
}

export type Invoice = {
	title: string;
	description: string;
	start_parameter: string;
	currency: string;
	total_amount: number;
}

export type SuccessfulPayment = {
	currency: string;
	total_amount: number;
	invoice_payload: string;
	shipping_option_id?: string;
	order_info?: string;
	telegram_payment_charge_id: string;
	provider_payment_charge_id: string;
}

export type InlineKeyboardButton = {
	text: string;
	url?: string;
	login_url?: string;
	callback_data?: string;
	switch_inline_query?: string;
	switch_inline_query_current_chat?: string;
	pay?: boolean;
}

export type InlineKeyboardMarkup = {
	inline_keyboard: InlineKeyboardButton[][]
}

export type KeyboardButton = {
	text: string;
	request_contact?: boolean;
	request_location?: boolean;
}

export type ReplyKeyboardMarkup = {
	keyboard: KeyboardButton[][];
	resize_keyboard?: boolean;
	one_time_keyboard?: boolean;
	selective?: boolean;
}

export type Message = {
	message_id: number;
	from?: User;
	date: number;
	chat: Chat;
	forward_from?: User;
	forward_from_chat?: Chat;
	forward_from_message_id?: number;
	forward_signature?: string;
	forward_sender_name?: string;
	forward_date?: number;
	reply_to_message?: Message;
	edit_date?: number;
	media_group_id?: string;
	author_signature?: string;
	text?: string;
	entities?: MessageEntity[];
	caption_entities?: MessageEntity[];
	audio?: Audio;
	document?: Document;
	animation?: Animation;
	game?: Game;
	photo?: PhotoSize[];
	sticker?: Sticker;
	video?: Video;
	voice?: Voice;
	video_note?: VideoNote;
	caption?: string;
	contact?: Contact;
	location?: Location;
	venue?: Venue;
	poll?: Poll;
	dice?: Dice;
	new_chat_members?: User[];
	left_chat_member?: User;
	new_chat_title?: string;
	new_chat_photo?: PhotoSize[];
	delete_chat_photo?: true;
	group_chat_created?: true;
	supergroup_chat_created?: true;
	channel_chat_created?: true;
	migrate_to_chat_id?: number;
	migrate_from_chat_id?: number;
	pinned_message?: Message;
	invoice?: Invoice;
	successful_payment?: SuccessfulPayment;
	connected_website?: string;
	reply_markup?: InlineKeyboardMarkup;
}

export type InlineQuery = {
	id: string;
	from: User;
	location?: Location;
	query: string;
	offset: string;
}

export type ChosenInlineResult = {
	result_id: string;
	from: User;
	location?: Location;
	inline_message_id: string;
	query: string;
}

export type CallbackQuery = {
	id: string;
	from: User;
	message?: Message;
	inline_message_id?: string;
	chat_instance?: string;
	data?: string;
	game_short_name?: string;
}

export type ShippingAddress = {
	country_code: string;
	state: string;
	city: string;
	street_line1: string;
	street_line2: string;
	post_code: string;
}

export type OrderInfo = {
	name?: string;
	phone_number?: string;
	email?: string;
	shipping_address?: ShippingAddress;
}

export type PreCheckoutQuery = {
	id: string;
	from: User;
	currency: string;
	total_amount: number;
	invoice_payload: string;
	shipping_option_id?: string;
	order_info?: OrderInfo;
}

export type PollAnswer = {
	poll_id: string;
	user: User;
	option_ids: number[];
}

export type Update = {
	update_id: number;
	message?: Message;
	edited_message?: Message;
	channel_post?: Message;
	edited_channel_post?: Message;
	inline_query?: InlineQuery;
	chosen_inline_result?: ChosenInlineResult;
	callback_query?: CallbackQuery;
	pre_checkout_query?: PreCheckoutQuery;
	poll?: Poll;
	poll_answer?: PollAnswer;
}

export const enum ParseModes {
	HTML = "HTML",
	Markdown = "Markdown"
}

export type ReplyKeyboardRemove = {
	remove_keyboard: true;
	selective?: boolean;
}

export type ReplyMarkup = InlineKeyboardMarkup|ReplyKeyboardMarkup|ReplyKeyboardRemove;

export type SendMessageOptions = {
	parse_mode?: ParseModes;
	disable_web_page_preview?: boolean;
	disable_notification?: boolean;
	reply_to_message_id?: number;
	reply_markup?: ReplyMarkup;
}

export type SendDocumentOptions = {
	caption?: string;
	parse_mode?: ParseModes;
	disable_notification?: boolean;
	reply_to_message_id?: number;
	reply_markup?: ReplyMarkup;
}

export type SendPhotoOptions = {
	caption?: string;
	parse_mode?: ParseModes;
	disable_notification?: boolean;
	reply_to_message_id?: number;
	reply_markup?: ReplyMarkup;
}

export type EditMessageTextOptions = {
	chat_id?: number|string;
	message_id?: number;
	inline_message_id?: number;
	parse_mode?: ParseModes;
	disable_web_page_preview?: boolean;
	reply_markup?: ReplyMarkup;
}

export type EditMessageCaptionOptions = {
	chat_id?: number|string;
	message_id?: number;
	inline_message_id?: number;
	caption?: string;
	parse_mode?: ParseModes;
	reply_markup?: ReplyMarkup;
}

export type AnswerCallbackQueryOptions = {
	text?: string;
	show_alert?: boolean;
	url?: string;
	cache_time?: number;
}

export type SendDiceOptions = {
	emoji?: "🎲" | "🎯";
	disable_notification?: boolean;
	reply_to_message_id?: number;
	reply_markup?: ReplyMarkup;
}

export type TelegramResponseSuccess = {
	ok: true;
	result: any;
}

export type TelegramResponseError = {
	ok: false;
	description?: string;
}

export type TelegramResponse = TelegramResponseSuccess|TelegramResponseError;