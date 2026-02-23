import CONFIG from '../../config';

export class MaskUtility {
	public static readonly sensibleList: string[] = CONFIG.MASK_FIELDS.split(',').map((item) =>
		item.toLowerCase()
	);

	public static setMask(value: any): string {
		let data = value;
		if (data) {
			data = data.toString();
			if (data.length > 4) {
				if (data.includes('@')) {
					const emailParts = data.split('@');
					const user = emailParts[0];
					const username = MaskUtility.reduce(user);
					data = `${username}@${emailParts[1]}`;
				} else {
					data = MaskUtility.reduce(data);
				}
			} else {
				data = MaskUtility.reduce(data, 2);
			}
		}
		return data;
	}

	public static reduce(value: string, limit = 4): string {
		if (value.length >= limit) {
			return '*'.repeat(value.length - limit).concat(value.substring(value.length - limit));
		} else {
			return '*'.repeat(3).concat(value.substring(0 - 1));
		}
	}

	/**
	 * Use to mask attributes on complex objects
	 * @param data
	 */
	public static findAndSetMaskOnObj(data: any): any {
		let obj = MaskUtility.clone(data);
		if (data && typeof data === 'object') {
			Object.keys(data).forEach((item) => {
				if (typeof data[item] === 'object') {
					obj[item] = MaskUtility.findAndSetMaskOnObj(data[item]);
				} else if (MaskUtility.sensibleList.includes(item.toString().toLowerCase())) {
					obj[item] = MaskUtility.setMask(data[item]);
				}
			});
		} else {
			obj =
				data && MaskUtility.sensibleList.includes(data.toString().toLowerCase())
					? MaskUtility.setMask(data)
					: data;
		}
		return obj;
	}

	/**
	 * Use to mask attributes on simple objects
	 * @param data
	 */
	public static findAndSetMaskOnSimpleObj(data: any): any {
		const obj = MaskUtility.clone(data);
		if (obj && typeof obj === 'object') {
			Object.keys(obj).forEach((item) => {
				if (MaskUtility.sensibleList.includes(item.toString().toLowerCase())) {
					obj[item] = MaskUtility.setMask(data[item]);
				}
			});
		}
		return obj;
	}

	public static clone(data: any): any {
		return typeof data === 'object' ? JSON.parse(JSON.stringify(data)) : data;
	}

	public static truncate(
		text: string,
		startChars: number,
		endChars: number,
		maxLength: number
	): string {
		if (text.length > maxLength) {
			const start = text.substring(0, startChars);
			const end = text.substring(text.length - endChars, text.length);
			return `${start}...${end}`;
		}
		return text;
	}
}
