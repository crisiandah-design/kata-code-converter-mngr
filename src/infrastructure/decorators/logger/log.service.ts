import { Request } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { debugLib } from '../../../application/utilities/debug-format-mask.utility';

export class LogService {
	private static uuid: string;

	public static printEvent(event: string, method: string, error: any): void {
		const debug = debugLib(`bdb:${event}:${method}`);
		debug(`[END ${LogService.getUuid()}] Catch exception publish with exception: %j`, error);
	}

	public static print(options: LogOptions): void {
		const debug = debugLib(`bdb:${options.className}:${options.method}`);
		const dataInput = LogService.getData(options);
		if (options.data instanceof Error) {
			debug(
				'[%s:%s] exec method: %s, with exception: %j',
				options.event,
				LogService.uuid,
				options.method,
				dataInput
			);
		} else if (dataInput) {
			const msg =
				dataInput instanceof Error
					? '[%s:%s] exception on: %s, details: %j'
					: '[%s:%s] exec method: %s, with data: %M';
			debug(msg, options.event, LogService.uuid, options.method, dataInput);
		} else {
			debug('[%s:%s] method: %s', options.event, LogService.uuid, options.method);
		}
	}

	private static getData(options: LogOptions): any {
		const data = options.data;
		if (Array.isArray(data) && data.length > 0) {
			const request = data[0] ? (data[0] as Request) : null;
			LogService.initUuid(options, request);
			const error = data[0] && data[0] instanceof Error ? data[0].stack : null;
			if (error) {
				return error;
			}
			if (request && request.body) {
				return {
					params: request.params,
					body: request.body,
					headers: request.headers,
					url: request.url,
				};
			} else {
				return request;
			}
		} else {
			return data;
		}
	}

	private static initUuid(options: LogOptions, request: Request | null): void {
		if (
			options.className.endsWith('Controller') &&
			options.event === EventTypes.START &&
			!!request
		) {
			LogService.uuid = request.header('X-RqUid') ?? uuidv4();
		}
	}

	public static cleanUuid(): void {
		LogService.uuid = '';
	}

	public static getUuid(): string {
		return LogService.uuid;
	}
}

export interface LogOptions {
	event: string;
	className: string;
	method: string;
	message?: string;
	data?: any;
}

export enum EventTypes {
	END = 'END',
	ERROR = 'ERROR',
	SUCCESS = 'SUCCESS',
	START = 'START',
}
