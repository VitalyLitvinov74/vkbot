import { RGResult } from "rg";
import { Message } from "tg";
import { Layout } from "./types";

export const enum FormTypes {
	String,
	Number,
	Float,
	Select,
	Custom
}

export type FormPostHandler<T> = (
	formResult: FormResult,
	input: T
) => boolean | Promise<boolean>;

export type FormPreHandler = (formResult: FormResult, user_id: number) => boolean | Promise<boolean>;
export type FormInputError<T> = ((input: T) => string | Promise<string>) | string;

type FormQuestionData = string | null;

type FormEntryBase = {
	label: string;
	back_btn?: FormCustomButton;
	cancel_btn?: FormCustomButton;
	default_btn?: FormCustomButton;
	q: ((
			formResult: FormResult,
			user_id: number
		) => FormQuestionData | Promise<FormQuestionData>
	) | FormQuestionData;
	current_callback?: (
		val: string | number,
		fullResult: FormResult
	) => Promise<string | null> | (string | null);
	layout?: Layout;
	buttons?: string[];
	preHandler?: FormPreHandler;
}

export type FormEntryString = FormEntryBase & {
	default?: string;
	type: FormTypes.String;
	range: [number, number];
	range_err_min?: FormInputError<string>;
	range_err_max?: FormInputError<string>;
	postHandler?: FormPostHandler<string>;
}

export type FormEntryNumber = FormEntryBase & {
	default?: number;
	type: FormTypes.Number | FormTypes.Float;
	range: [number, number];
	range_err_min?: FormInputError<number>;
	range_err_max?: FormInputError<number>;
	type_err?: FormInputError<string>;
	postHandler?: FormPostHandler<number>;
}

export type FormEntrySelect = FormEntryBase & {
	default?: string;
	type: FormTypes.Select;
	buttons: string[];
	err?: FormInputError<string>;
	postHandler?: FormPostHandler<string>;
}

export type FormEntryCustom = FormEntryBase & {
	default?: string | number;
	type: FormTypes.Custom;
	postHandler?: FormPostHandler<string>;
	validator?: (msg: Message) =>
								FormValidatorResult<any>|
								Promise<FormValidatorResult<any>>;
}

export type FormEntry = FormEntryString|
						FormEntryNumber|
						FormEntrySelect|
						FormEntryCustom;

export type FormPromise = ((formResult: RGResult<FormResult>) => any);

export type FormResult = {
	[index: string]: string | number
}

export const enum FormErrorCodes {
	SendingMessageError,
	Rollbacked,
	Aborted,
	Timedout,
	UnknownError
}

export type FormValidatorResult<T> = {
	data?: T;
	error?: string | null;
}

export type FormCustomButton = string | null;

export type FormOptions = {
	back_btn?: FormCustomButton;
	cancel_btn?: FormCustomButton;
	default_btn?: FormCustomButton;
	is_branch?: boolean;
	start_question?: string;
	cancel_confirmation?: (user_id: number) => Promise<boolean> | boolean;
}