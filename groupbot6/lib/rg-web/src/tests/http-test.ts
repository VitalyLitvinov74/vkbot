import { RGWeb } from "../"
import { assert } from "rg";

// Цель теста - убедиться в корректной работоспособности HTTP-Протокола

async function test() {
	{
		let result = await new RGWeb("example.com", 80, "http").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("example.com", 443, "http").request({}, null);
		assert(!result.is_success);
	}
};

test();