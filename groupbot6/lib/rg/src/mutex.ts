import { assert } from ".";

type PromiseResolve = () => void;

type MutexPromise = {
	promise: Promise<void>;
	resolve: PromiseResolve;
}

type Mutex = {
	queue: MutexPromise[];
}

let mutexes: Record<string, Mutex> = {};

async function mutexLockOrAwait(mutex_name: string): Promise<void> {
	let isLocked: boolean = true;
	
	if(!mutexes[mutex_name]) {
		mutexes[mutex_name] = <Mutex> {
			queue: []
		};
		
		isLocked = false;
	}
	
	let queue: MutexPromise[] = mutexes[mutex_name].queue;
	
	let queueEntry: {
		promise: Promise<void>|null;
		resolve: PromiseResolve|null;
	} = {
		promise: null,
		resolve: null
	};
	
	let result: Promise<void> = new Promise((resolve) => {		
		queueEntry.resolve = () => {
			resolve();
		}
	});

	assert(queueEntry.resolve);
	
	queueEntry.promise = result;

	queue.push({
		promise: queueEntry.promise,
		resolve: queueEntry.resolve
	});

	if(isLocked) {
		return queue[queue.length - 2].promise;
	}else{
		return;
	}
}

function mutexUnlock(mutex_name: string) {
	let mutex: Mutex = mutexes[mutex_name];
	
	assert(mutex);
	
	let nextPromise = mutex.queue.shift();
	
	if(!nextPromise) {
		throw new Error("nextPromise is undefined");
	}

	if(mutex.queue.length === 0) {
		delete mutexes[mutex_name];
	}
	
	nextPromise.resolve();
}

export {
	mutexLockOrAwait,
	mutexUnlock
}