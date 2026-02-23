import { TransformController } from './transform.controller';

describe('TransformController', () => {
	it('parses simple print to JS', async () => {
		const req: any = { body: { sourceLang: 'simple', targetLang: 'js', code: 'print Hello' } };
		const res = await TransformController.CodeConverter(req, null, null as any);
		expect(res).toHaveProperty('code');
	});
});
