import express from 'express';
import CONFIG from '../../config';
import { TransformController } from '../controllers/transform/transform.controller';

const TransformRouter = express.Router();

TransformRouter.post(
	`${CONFIG.PATHS.CODE_CONVERTER.PATH}${CONFIG.PATHS.CODE_CONVERTER.OPERATIONS.TRANSFORM}`,
	TransformController.CodeConverter
);

export { TransformRouter };
