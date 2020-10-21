import {
	FormEntry,
	FormOptions,
	FormResult,
	FormPromise,
	FormEntryNumber,
	FormValidatorResult,
	FormInputError,
	FormEntryString,
	FormEntrySelect,
	FormTypes,
	FormPostHandler,
	FormCustomButton,
	FormErrorCodes
} from "./form-types";

import { Message } from "tg";
import { assert } from "rg"
import { UIMessage } from "./types";
import { Event } from "rg";
import { RGError } from "rg";

const TAG: string = "TGUI/FORM";

export class Form {
	public back_btn: FormCustomButton | void;
	public cancel_btn: FormCustomButton | void;
	public default_btn: FormCustomButton | void;

	private cancel_confirmation?: (user_id: number) => Promise<boolean> | boolean;

	private questions: FormEntry[];

	private offset: number = 0;
	private result: FormResult = {};
	private promise: FormPromise | null = null;

	private is_holding: boolean = false;
	private is_branch: boolean = false;

	private user_id: number;

	public finished = new Event<void>();

	constructor(user_id: number, questions: FormEntry[], options: FormOptions = {}) {
		this.back_btn = options.back_btn;
		this.cancel_btn = options.cancel_btn;
		this.default_btn = options.default_btn;

		this.cancel_confirmation = options.cancel_confirmation;

		if(this.back_btn === undefined) {
			this.back_btn = "◀️ Назад";
		}

		if(this.cancel_btn === undefined) {
			this.cancel_btn = "❌ Отмена"
		}

		if(this.default_btn === undefined) {
			this.default_btn = "🔶 Пропустить";
		}

		this.questions = questions;
		this.user_id = user_id;

		if(options.start_question) {
			this.setQuestionByLabel(options.start_question);
		}
	}

	public async onMessageHandler(msg: Message): Promise<UIMessage | null> {
		let input: string | number = "";

		if(msg.text) {
			input = msg.text;
		}

		let formEntry = this.getCurrentFormEntry();

		let back_btn = this.back_btn;

		if(formEntry.back_btn) {
			back_btn = formEntry.back_btn;
		}

		if(
			(this.is_branch || this.offset) &&
			input === back_btn &&
			back_btn
		) {
			// Обработчик кнопки назад
			if(this.offset === 0) {
				assert(this.promise);

				this.finished.emit();

				this.promise({
					is_success: false,
					error: {
						code: FormErrorCodes.Rollbacked
					}
				});

				return null;
			}

			this.offset--;
			return this.getCurrentQuestion();
		}

		let cancel_btn = this.cancel_btn;

		if(formEntry.cancel_btn) {
			cancel_btn = formEntry.cancel_btn;
		}

		if(cancel_btn && input === cancel_btn) {
			if(this.cancel_confirmation) {
				const isCancelAllowed = await this.cancel_confirmation(this.user_id);

				if(!isCancelAllowed) {
					return this.getCurrentQuestion();
				}
 			}

			assert(this.promise);

			this.finished.emit();

			this.promise({
				is_success: false,
				error: {
					code: FormErrorCodes.Aborted,
					message: "❌ Отменено"
				}
			});

			return null;
		}

		let default_btn = this.default_btn;

		if(formEntry.default_btn) {
			default_btn = formEntry.default_btn;
		}

		if(formEntry.default && default_btn && input === default_btn) {
			input = formEntry.default;
		}else{
			let validationResult = await this.validateFormEntryInput(msg, formEntry);

			if(this.is_holding) {
				return null;
			}

			if(validationResult.error) {
				return {
					text: validationResult.error
				};
			}

			if(validationResult.error === null) {
				return null;
			}

			input = validationResult.data;
		}

		this.setResult(formEntry.label, input);
		this.offset++;

		if(formEntry.postHandler) {
			let postHandler = <FormPostHandler<string|number>> formEntry.postHandler;

			let isNextProceedAllowed: boolean = await postHandler(
				this.result,
				input
			);

			if(this.is_holding) {
				this.offset--;
				return null;
			}

			if(!isNextProceedAllowed) {
				this.offset++;
			}
		}

		if(this.offset === this.questions.length) {
			// Если это последний элемент формы
			this.onFormFinished();
			return null;
		}

		return this.getCurrentQuestion();
	}

	private setQuestionByLabel(label: string): void {
		for(let i = 0; i < this.questions.length; i++) {
			const question = this.questions[i];
	
			this.setResult(question.label, question.default!);

			if(question.label === label) {
				this.offset = i;
				return;
			}
		}
	
		assert(false);
	}

	public overrideResult(newResult: FormResult): void {
		this.result = newResult;
	}

	public onFormFailed(err: RGError): void {
		this.finished.emit();

		if(!this.promise) {
			console.warn(TAG, new Error("form result promise is null"));
			return;
		}

		this.promise(err);
	}

	public onFormFinished(): void {
		this.finished.emit();

		if(!this.promise) {
			console.warn(TAG, new Error("form result promise is null"));
			return;
		}

		this.promise({
			is_success: true,
			data: this.result
		});
	}

	public start(): Promise<UIMessage | null> {
		return this.getCurrentQuestion();
	}

	public markAsBranch() {
		this.is_branch = true;
	}

	public setHolding(state: boolean) {
		this.is_holding = state;
	}

	public async getCurrentQuestion(): Promise<UIMessage | null> {
		let formEntry = this.getCurrentFormEntry();
		let question: string | null = null;

		if(formEntry.preHandler) {
			let isProceedAllowed: boolean = await formEntry.preHandler(
				this.getResult(),
				this.user_id
			);

			if(this.is_holding) {
				return null;
			}

			if(!isProceedAllowed) {
				this.offset++;

				if(this.offset === this.questions.length) {
					if(this.promise) {
						this.onFormFinished();
					}

					return null;
				}else{
					return this.getCurrentQuestion();
				}
			}
		}

		if(typeof formEntry.q === "function") {
			question = await formEntry.q(this.getResult(), this.user_id);
		}

		if(typeof formEntry.q === "string") {
			question = formEntry.q;
		}
		
		assert(question);

		let buttons: string[] = Object.assign([], formEntry.buttons);

		let default_btn = this.default_btn;

		if(formEntry.default_btn) {
			default_btn = formEntry.default_btn;
		}

		if(formEntry.default && default_btn) {
			buttons.push(default_btn);
		}

		let back_btn = this.back_btn;

		if(formEntry.back_btn) {
			back_btn = formEntry.back_btn;
		}

		if((this.is_branch || this.offset) && back_btn) {
			buttons.push(back_btn);
		}

		let cancel_btn = this.cancel_btn;

		if(formEntry.cancel_btn) {
			cancel_btn = formEntry.cancel_btn;
		}

		if(cancel_btn) {
			buttons.push(cancel_btn);
		}

		let currentText = "";

		if(formEntry.current_callback) {
			const val = formEntry.default;

			if(val) {
				const currentCallbackResult = await formEntry.current_callback(
					val,
					this.result
				);

				if(currentCallbackResult) {
					currentText = currentCallbackResult;
				}
			}
		}

		return {
			text: question + currentText,
			keyboard: buttons,
			layout: formEntry.layout
		};
	}

	public setPromise(resolve: FormPromise): void {
		this.promise = resolve;
	}

	private setResult(label: string, value: string | number) {
		this.result[label] = value;
	}

	public getResult(): FormResult {
		return this.result;
	}

	private getCurrentFormEntry(): FormEntry {
		return this.questions[this.offset];
	}

	private getFormInputError<T>(
		formInputError: FormInputError<T>,
		val: T
	): Promise<string> | string {
		if(typeof formInputError === "function") {
			return formInputError(val);
		}
	
		return formInputError;
	}

	private async validateFormEntryNumber(
		input: number,
		formEntry: FormEntryNumber
	): Promise<FormValidatorResult<number>> {
		let err: string | null = null;

		if(isNaN(input)) {
			if(!formEntry.type_err) {
				formEntry.type_err = "Введите число!";
			}

			err = await this.getFormInputError<string>(
				formEntry.type_err,
				input + ""
			);

			return { error: err }
		}
		
		if(input < formEntry.range[0]) {
			if(!formEntry.range_err_min) {
				formEntry.range_err_min = "Введите число "
				+ "не меньше, чем " + formEntry.range[0];
			}

			err = await this.getFormInputError<number>(
				formEntry.range_err_min,
				input
			);
		}

		if(input > formEntry.range[1]) {
			if(!formEntry.range_err_max) {
				formEntry.range_err_max = "Введите число "
				+ "не больше, чем " + formEntry.range[1];
			}

			err = await this.getFormInputError<number>(
				formEntry.range_err_max,
				input
			);
		}		

		if(err) {
			return { error: err }
		}

		return { data: input }
	}

	private async validateFormEntryString(
		input: string,
		formEntry: FormEntryString
	): Promise<FormValidatorResult<string>> {
		let err: string | null = null;

		if(input.length < formEntry.range[0]) {
			if(!formEntry.range_err_min) {
				formEntry.range_err_min = "Количество символов"
				+ " должно быть не меньше " + formEntry.range[0];
			}

			err = await this.getFormInputError<string>(
				formEntry.range_err_min,
				input
			);
		}

		if(input.length > formEntry.range[1]) {
			if(!formEntry.range_err_max) {
				formEntry.range_err_max = "Количество символов"
				+ " должно быть не больше " + formEntry.range[1];
			}

			err = await this.getFormInputError<string>(
				formEntry.range_err_max,
				input
			);
		}	

		if(err) {
			return { error: err }
		}

		return { data: input }
	}

	private async validateFormEntrySelect(
		input: string,
		formEntry: FormEntrySelect
	): Promise<FormValidatorResult<string>> {
		let err: string | null = null;

		if(formEntry.buttons.indexOf(input) === -1) {
			if(!formEntry.err) {
				formEntry.err = "Используйте меню!";
			}

			err = await this.getFormInputError<string>(formEntry.err, input);
		}

		if(err) {
			return { error: err }
		}

		return { data: input }
	}

	private validateFormEntryInput(
		msg: Message,
		formEntry: FormEntry
	): Promise<FormValidatorResult<any>> | FormValidatorResult<any> {
		assert(msg.text);

		let inputNumber: number = NaN;

		switch(formEntry.type) {
			case FormTypes.Float:
				inputNumber = parseFloat(msg.text);
				return this.validateFormEntryNumber(inputNumber, formEntry);

			case FormTypes.Number:
				inputNumber = parseInt(msg.text, 10);
				return this.validateFormEntryNumber(inputNumber, formEntry);

			case FormTypes.String:
				return this.validateFormEntryString(msg.text, formEntry);

			case FormTypes.Select:
				return this.validateFormEntrySelect(msg.text, formEntry);
			
			case FormTypes.Custom:
				if(!formEntry.validator) {
					return { data: msg.text };
				}else{
					return formEntry.validator(msg);
				}
		}
	}
}