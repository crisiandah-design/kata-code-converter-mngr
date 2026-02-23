import { EventTypes } from '../enums/event-types.enum';

export interface TechnicalEventModel {
	errorMessage?: string;
	identification?: string;
	identificationType?: string;
	channel?: string;
	requestId?: string;
	httpStatus?: number;
	operationPath?: string;
	method?: string;
	flowName: string;
	operation: string;
	serviceName: string;
	executionTimeMs?: number;
	events: Array<EventTypes>;
}
