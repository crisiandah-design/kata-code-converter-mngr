export interface CacheModel<I> {
	key: string;
	body: I;
	time: number;
	timeUnit: string;
}
