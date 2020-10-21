import { RGWeb } from "../"
import { assert } from "rg";

// Цель теста - убедиться в том что библиотека использует переданный в неё домен
// Запросы должны выполняться успешно только для валидных доменов
async function test() {
	{
		let result = await new RGWeb("google.com", 443, "https").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("random.org", 443, "https").request({}, null);
		assert(result.is_success);
	}

	{
		let result = await new RGWeb("r.com", 443, "https").request({}, null);
		assert(!result.is_success);
	}

	{
		let result = await new RGWeb("r.com", 80, "http").request({}, null);
		assert(!result.is_success);
	}
};

test();