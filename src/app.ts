import express from 'express';
import { ErrorMiddleware } from './infrastructure/middleware/error.middleware';
import { ValidatorRouter } from './infrastructure/routers/validator.router';
import { AppRouter } from './infrastructure/routers/app.router';

const app = express();
app.disable('x-powered-by');
app.use(ValidatorRouter);
app.use(AppRouter);
app.use(ErrorMiddleware.handler);

export default app;
