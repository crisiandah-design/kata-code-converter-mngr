import Controller from '../../decorators/controller/controller.aspect';
import Report from '../../decorators/report/report.aspect';

import { NextFunction, Request } from 'express';
import { EventTypes } from '../../../domain/enums/event-types.enum';
import { TransformRequestModel } from '../../../domain/transform/transform-request.model';
import { transformService } from '../../../application/services/transform/transform.service';
import { TransformResponseModel } from '../../../domain/transform/transform-response.model';

export class TransformController {
	@Controller([EventTypes.technical])
	@Report()
	public static async CodeConverter(
		req: Request,
		_res: any,
		_next: NextFunction
	): Promise<TransformResponseModel> {
		console.log('Received request for code transformation with params:', JSON.stringify(req.body));
		return transformService.command(req.body as unknown as TransformRequestModel);
	}
}
