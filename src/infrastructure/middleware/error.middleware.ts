import { NextFunction, Request, Response } from 'express';
import { ErrorHandler } from '../errors/error.handler';
import { ApplicationException } from '../../domain/errors/application.exception';

export class ErrorMiddleware {
	public static handler = (
		err: ApplicationException,
		_req: Request,
		res: Response,
		_nxt: NextFunction
	): void => {
		ErrorHandler.setErrorResponse(err, res);
	};
}
