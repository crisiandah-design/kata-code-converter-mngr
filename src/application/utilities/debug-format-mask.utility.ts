import debugLib from 'debug';
import { MaskUtility } from './mask-utility';

debugLib.formatters.M = (M) => {
	return MaskUtility.truncate(JSON.stringify(MaskUtility.findAndSetMaskOnObj(M)), 100, 100, 400);
};

debugLib.formatters.m = (m) => {
	return MaskUtility.truncate(
		JSON.stringify(MaskUtility.findAndSetMaskOnSimpleObj(m)),
		100,
		100,
		400
	);
};

export { debugLib };
