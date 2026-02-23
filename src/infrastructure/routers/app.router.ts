import CONFIG from '../../config';
import { Router } from 'express';
import { TransformRouter } from './code-converter.router';

const AppRouter = Router();

[TransformRouter].forEach((route: Router) => AppRouter.use(CONFIG.CONTEXT, route));

export { AppRouter };
