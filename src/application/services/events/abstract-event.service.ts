export abstract class AbstractEventService {
	protected additionalData: any;
	public abstract publish<T>(additionalData: T): void;
}
