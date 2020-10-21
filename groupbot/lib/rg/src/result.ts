interface RGSuccess<T> {
	is_success: true;
	data: T;
}

interface RGError<E = number> {
	is_success: false;
	error: {
		code: E;
		message?: string;
	}
}

type RGResult<T, E = number> = RGSuccess<T> | RGError<E>;

export { RGResult, RGSuccess, RGError };

export function getRGErrorByError(err: NodeJS.ErrnoException): RGError {
	let code: number = 0;

	if(err.errno) {
		code = err.errno;
	}

	return {
		is_success: false,
		error: {
			code: code,
			message: err.message
		}
	};
}