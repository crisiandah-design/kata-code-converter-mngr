import { Response } from 'express';
import { constants } from 'http2';
import { ApplicationException } from '../../domain/errors/application.exception';
import { GenericResponse } from '../../domain/generics/generic.response.model';
import Log from '../decorators/logger/log.aspect';

export class ErrorHandler {
	@Log()
	public static setErrorResponse(
		applicationError: ApplicationException | Error,
		res: Response
	): void {
		const status =
			applicationError instanceof ApplicationException
				? applicationError.statusCode
				: constants.HTTP_STATUS_INTERNAL_SERVER_ERROR;

		res
			.status(status)
			.json(new GenericResponse(status, applicationError, applicationError.message));
	}
}
