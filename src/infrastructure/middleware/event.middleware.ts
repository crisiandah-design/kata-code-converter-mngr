import { NextFunction, Request, Response } from 'express';
import { OnFinishedUtility } from '../../application/utilities/on-finished.utility';
import { EventFacadeService } from '../../application/services/events/event.facade.service';

export class EventMiddleware {
	public static handler = (req: Request, res: Response, next: NextFunction): void => {
		const startTime = process.hrtime();
		OnFinishedUtility.setData(null);

		res.on('finish', () => {
			const totalTime = process.hrtime(startTime);
			const executionTimeMs = totalTime[0] * 1000 + totalTime[1] / 1e6;
			if (OnFinishedUtility.getData()) {
				EventFacadeService.publish({
					...OnFinishedUtility.getData(),
					executionTimeMs,
					httpStatus: res.statusCode,
					identification: req.header('X-CustIdentNum'),
					identificationType: req.header('X-CustIdentType'),
					channel: req.header('X-Channel'),
					requestId: req.header('X-RqUID'),
					operationPath: req.originalUrl,
					method: req.method,
				});
			}
		});

		next();
	};
}
