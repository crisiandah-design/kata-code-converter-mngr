export interface IGenericResponse<T> {
	status: number;
	message?: string;
	data?: T;
}

export class GenericResponse<O> implements IGenericResponse<O> {
	status: number;
	message?: string;
	data?: O;
	public constructor(status: number, data: O, message?: string) {
		this.status = status;
		this.message = message;
		this.data = data;
	}
}
