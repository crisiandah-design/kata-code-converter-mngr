import { AbstractEventService } from './abstract-event.service';
import { TransactionalEventMapper } from '../../mappers/events/transactional-event.mapper';
import Log from '../../../infrastructure/decorators/logger/log.aspect';

export class TechnicalEventService extends AbstractEventService {
	@Log()
	public publish<TechnicalEventModel>(payload: TechnicalEventModel): void {
		/* 		const body =
			CONFIG.ENV !== 'LOCAL'
				? TransactionalEventMapper.map(payload, CONFIG.EVENTS.TECHNICAL.EVENT_INDEX)
				: payload;
		const url = `${CONFIG.EVENTS.TECHNICAL.API_EVENT_HOST}${CONFIG.EVENTS.TECHNICAL.API_EVENT_PATH}`;
		RestAdapter.post({ url, body }, '_id').catch(); */
	}
}
