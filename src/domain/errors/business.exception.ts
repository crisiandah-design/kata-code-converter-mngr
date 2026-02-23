import { constants } from 'http2';
import { ApplicationException } from './application.exception';

export class BusinessException extends ApplicationException {
	public statusCode: number = constants.HTTP_STATUS_CONFLICT;
	public serverStatusCode?: number;

	public constructor(message: string, details: any, request: any, serverStatusCode?: number) {
		super(message, details, request);
		this.serverStatusCode = serverStatusCode;
	}
}
