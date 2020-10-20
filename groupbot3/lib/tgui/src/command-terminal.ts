import { Message, ParseModes } from "tg";
import { assert, escapeHtml } from "rg";
import { CommonMessageOptions, PreHandler } from "./types";

export const enum CommandArgTypes {
	Word,
	Number,
	LineNumber,
	String,
	Text
};

type NumberableArgType = 
	CommandArgTypes.Number |
	CommandArgTypes.LineNumber;

type StringableArgType =
	CommandArgTypes.String |
	CommandArgTypes.Word   |
	CommandArgTypes.Text;

type CompileCommandType<T> =
	T extends NumberableArgType ? number :
	T extends StringableArgType      ? string : never;

type CommandResult = string | undefined | null;

type CommandArgsArray = {
	[k: number]: CommandArg,
	[Symbol.iterator](): Iterator<CommandArg>,
	length: number
};

type CommandHandler<T extends CommandArgsArray> = (
	msg: Message,
	args: TransformTuple<T>
) => CommandResult | Promise<CommandResult>;

export type CommandArg = {
	type: CommandArgTypes,
	name: string;
}

type CompileCommandTypeForObj<T> = T extends CommandArg ?
	CompileCommandType<T["type"]> : never;
	
type TransformTuple<T extends CommandArgsArray> = {
	[k in keyof T]: CompileCommandTypeForObj<T[k]>
};

type TerminalCommand<T extends CommandArgsArray> = {
	handler: CommandHandler<T>,
	description: string,
	args: T
};

export class CommandTerminal {
	private preHandler: PreHandler | null = null;
	private commands: Record<string, TerminalCommand<CommandArgsArray>> = {};
	private options: CommonMessageOptions = {};

	public async handler(msg: Message): Promise<string | undefined> {
		if(this.preHandler) {
			let isProceedAllowed = await this.preHandler(msg);

			if(!isProceedAllowed) {
				return;
			}
		}

		if(!msg.text) {
			return;
		}

		if(msg.text[0] !== "/") {
			return;
		}

		let lines = msg.text.split("\n");
		let firstLine = lines.shift();

		assert(firstLine);

		let args = firstLine.split(" ");

		if(args.length === 1) {
			args = args[0].split("_");
		}

		let commandName = args.shift();
		assert(commandName);

		commandName = commandName.split("@")[0];
		commandName = commandName.toLowerCase();

		let command = this.commands[commandName];

		if(!command) {
			return "Ошибка!\nТакой команды не существует!";
		}

		let parsedArgs: (string | number)[] = [];

		for(let i = 0; i < command.args.length; i++) {
			let arg = command.args[i];
			let val: string | null | undefined = null;	

			let isPrimitive =   arg.type !== CommandArgTypes.String &&
								arg.type !== CommandArgTypes.Text &&
								arg.type !== CommandArgTypes.LineNumber;

			if(isPrimitive) {
				val = args.shift();
			}else{
				if(
					arg.type === CommandArgTypes.String ||
					arg.type === CommandArgTypes.LineNumber
				) {
					val = lines.shift();
				}
				
				if(arg.type === CommandArgTypes.Text) {
					val = lines.join("\n");
					lines = [];
				}

				assert(val !== null);
			}

			if(!val) {
				return "Недостаточно аргументов\n"
				+ "Ожидаемое количество аргументов: " + command.args.length
				+ "\n\nСледующий ожидаемый аргумент:\n" + arg.name;
			}

			switch(arg.type) {
				case CommandArgTypes.LineNumber:
				case CommandArgTypes.Number:
					let num: number = parseFloat(val);

					if(isNaN(num)) {
						return `Значение "${arg.name}" должно быть числом!`;
					}

					parsedArgs.push(num);
					break;
				case CommandArgTypes.Word:
				case CommandArgTypes.String:
				case CommandArgTypes.Text:
					parsedArgs.push(val);
					break;
			}
		}

		try {
			let result = await command.handler(msg, <TransformTuple<any>> <unknown> parsedArgs);

			if(!result) {
				if(result === undefined) {
					return "Команда выполнена успешно";
				}else{
					return;
				}
			}

			return result;
		}catch(err) {
			console.error(err);

			return "Произошла ошибка:\n"
			+ err.message;
		}
	}

	private helpHandler(msg: Message): string {
		if(Object.keys(this.commands).length === 0) {
			return "Нет команд";
		}

		let result = "";

		for(let i in this.commands) {
			let command = this.commands[i];

			result += command.description + ":\n" + i;

			for(let arg of command.args) {
				switch(arg.type) {
					case CommandArgTypes.Word:
					case CommandArgTypes.Number:
						result += " ";
						break;
					case CommandArgTypes.LineNumber:
					case CommandArgTypes.String:
					case CommandArgTypes.Text:
						result += "\n";
						break;
				}

				result += "<" + arg.name + ">";
			}

			result += "\n\n";
		}

		if(this.options.parse_mode === ParseModes.HTML) {
			result = escapeHtml(result);
		}

		return result;
	}

	public setCommand<T extends CommandArgsArray>(
		command: string,
		description: string,
		handler: CommandHandler<T>,
		args: T = (<T> <unknown> [])
	): void {
		if(command in this.commands) {
			throw new Error("This command already exists " + command);
		}

		let anyHandler = <CommandHandler<CommandArgsArray>> handler;

		for(let i in this.commands) {
			let handler = this.commands[i];

			if(handler.handler === anyHandler) {
				throw new Error("This handler already used " + command);
			}
		}

		let isTextUsed = false;

		for(let arg of args) {
			if(isTextUsed) {
				throw new Error("The Text parameter must be the last");
			}

			if(arg.type === CommandArgTypes.Text) {
				isTextUsed = true;
			}
		}

		this.commands[command] = {
			handler: anyHandler,
			description,
			args
		};
	}

	public setHelp(
		command: string,
		description: string = "Помощь"
	): void {
		return this.setCommand(command, description, this.helpHandler.bind(this));
	}

	public setPreHandler(preHandler: PreHandler): void {
		this.preHandler = preHandler;
	}

	public setOptions(options: CommonMessageOptions): void {
		this.options = options;
	}

	public getOptions(): CommonMessageOptions {
		return this.options;
	}

	public createController() {
		return new CommandTerminalController(this);
	}
}

// Класс-контроллер нужен для того чтобы не допустить доступ логики приложения
// к методам, доступ к которым должен быть только в рамках библиотеки TelegramUI
export class CommandTerminalController {
	private commandTerminal: CommandTerminal;

	constructor(commandTerminal: CommandTerminal) {
		this.commandTerminal = commandTerminal;
	}

	public setHelp(
		command: string,
		description: string = "Помощь"
	): void {
		return this.commandTerminal.setHelp(command, description);
	}

	public setPreHandler(preHandler: PreHandler): void {
		return this.commandTerminal.setPreHandler(preHandler);
	}

	public setOptions(options: CommonMessageOptions): void {
		return this.commandTerminal.setOptions(options);
	}

	public setCommand<T extends CommandArgsArray>(
		command: string,
		description: string,
		handler: CommandHandler<T>,
		args: T = (<T> <unknown> [])
	): void {
		return this.commandTerminal.setCommand(command, description, handler, args);
	}
}