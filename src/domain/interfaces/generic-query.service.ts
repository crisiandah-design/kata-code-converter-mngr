export interface GenericQueryService<I, O> {
	query(params: I): O;
}
