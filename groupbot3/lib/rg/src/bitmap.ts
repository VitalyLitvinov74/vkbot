export class Bitmap<T extends number> {
	private storage: number = 0;

	constructor(map: number) {
		this.storage = map;
	}

	set(field: T, value: boolean) {
		if(this.get(field) !== value) {
			this.switch(field);
		}
	}

	switch(field: T) {
		this.storage ^= (1 << field);
	}

	get(field: T): boolean {
		return !!(this.storage & (1 << field));
	}

	getNumber(): number {
		return this.storage;
	}
}