import { NextFunction, Response } from 'express';
import { constants } from 'http2';
import { GenericResponse } from '../../../domain/generics/generic.response.model';
import { OnFinishedUtility } from '../../../application/utilities/on-finished.utility';
import Config from '../../../config';
import { TechnicalEventModel } from '../../../domain/events/technical.event.model';
import { EventTypes } from '../../../domain/enums/event-types.enum';

export default function Controller(events?: Array<EventTypes>): any {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalValue = descriptor.value;

		descriptor.value = async (...args: any[]) => {
			const next = args[2] as NextFunction;
			const response = args[1] as Response;
			let responseBody: any;
			try {
				responseBody = await originalValue.apply(originalValue, args);
			} catch (error) {
				responseBody = error;
			} finally {
				setResponse(responseBody, response, next);
			}
		};
	};
}

function setResponse<T>(responseBody: T, response: Response, next: NextFunction) {
	if (responseBody instanceof Error) {
		next(responseBody);
	} else {
		response
			.status(constants.HTTP_STATUS_OK)
			.send(new GenericResponse(constants.HTTP_STATUS_OK, responseBody, 'Ok'));
	}
}
