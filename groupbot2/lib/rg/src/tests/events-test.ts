import { Event } from "../events";

type TestStruct = {
	a: number;
	b: number;
}

let testEvents = new Event<TestStruct>();

testEvents.on((arg: TestStruct) => {
	console.log("Пришло событие: ", arg.a, arg.b);
});

testEvents.emit({
	a: 15,
	b: 28
});

testEvents.emit({
	a: 34,
	b: 35
});

testEvents.emit({
	a: 47,
	b: 19
});