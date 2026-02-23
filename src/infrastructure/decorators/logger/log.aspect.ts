import { EventTypes, LogOptions, LogService } from './log.service';

export default function Log(): any {
	return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
		const originalValue = descriptor.value;
		const className = target.name ?? target.constructor.name;
		LogService.cleanUuid();
		descriptor.value = async (...args: any[]) => {
			LogService.print({
				className,
				event: EventTypes.START,
				method: propertyKey,
				data: args,
			} as LogOptions);
			try {
				const result = await originalValue.apply(originalValue, args);
				if (result && JSON.stringify(result) !== '{}') {
					LogService.print({
						className,
						event: EventTypes.SUCCESS,
						method: propertyKey,
						data: result,
					} as LogOptions);
				}
				return result;
			} finally {
				LogService.print({
					className,
					event: EventTypes.END,
					method: propertyKey,
				} as LogOptions);
			}
		};
	};
}
