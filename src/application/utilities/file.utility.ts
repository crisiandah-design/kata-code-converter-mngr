import fs from 'fs';
import CONFIG from '../../config';

export class FileUtility {
	public static get(path: string): any {
		const file = fs.readFileSync(`${CONFIG.RESOURCE}${path}`, 'utf8');
		return JSON.parse(file);
	}
}
