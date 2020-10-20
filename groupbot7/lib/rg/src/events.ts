type EventResult<R> = R | Promise<R>;
type EventListener<T, R> = (event: T) => EventResult<R>;

type EventListenerEntry<T, R> = {
	callback: EventListener<T, R>;
}

export class Event<T, R = void> {
	private listeners: EventListenerEntry<T, R>[] = [];

	public on(callback: EventListener<T, R>) {
		this.listeners.push({
			callback
		});
	}

	public emit(event: T): Promise<R[]> {
		let promises: EventResult<R>[] = [];

		for(let listener of this.listeners) {
			let result = listener.callback(event);
			promises.push(result);
		}

		return Promise.all(promises);
	}
}