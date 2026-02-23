import { AbstractEventService } from './abstract-event.service';
import { TechnicalEventService } from './technical.event.service';
import { EventTypes } from '../../../domain/enums/event-types.enum';

export class EventFacadeService {
	private static readonly eventMap = new Map<EventTypes, AbstractEventService>([
		[EventTypes.technical, new TechnicalEventService()],
	]);

	public static publish(additionalData: any): void {
		const eventList = additionalData.events;
		delete additionalData.events;
		eventList.forEach((type: EventTypes) => this.eventMap.get(type)?.publish(additionalData));
	}
}
