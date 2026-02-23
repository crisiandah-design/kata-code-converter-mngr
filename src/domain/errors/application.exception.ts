import { constants } from 'http2';

export class ApplicationException extends Error {
	public statusCode: number = constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;
	public details: any;
	public request: any;

	public constructor(message: string, details: any, request: any) {
		super();
		this.message = message;
		this.details = details;
		this.request = request;
	}
}
