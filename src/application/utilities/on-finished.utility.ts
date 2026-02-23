export class OnFinishedUtility {
	private static data: any;

	public static setData<T>(value: T): void {
		this.data = value;
	}

	public static getData(): any {
		return this.data;
	}
}
