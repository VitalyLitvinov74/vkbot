import { RGWeb } from "../"
import { assert } from "rg";

// Цель теста - убедиться в корректной работоспособности HTTPS-Протокола

async function test() {
	{
		let result = await new RGWeb("example.com", 443, "https").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("example.com", 80, "https").request({}, null);
		assert(!result.is_success);
	}
};

test();