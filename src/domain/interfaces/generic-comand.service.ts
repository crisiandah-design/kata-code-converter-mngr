export interface GenericCommandService<I, O> {
	command(body: I): Promise<O>;
}
