import { RGWeb } from "../"
import { assert } from "rg";

// Цель теста - убедиться в том что библиотека использует переданный в неё порт
// Запросы должны выполняться успешно только для HTTP 80 и HTTPS 443 для example.com

async function test() {
	{
		let result = await new RGWeb("example.com", 80, "http").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("example.com", 23, "http").request({}, null);
		assert(!result.is_success);
	}

	{
		let result = await new RGWeb("example.com", 443, "https").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("example.com", 1024, "http").request({}, null);
		assert(!result.is_success);
	}
};

test();