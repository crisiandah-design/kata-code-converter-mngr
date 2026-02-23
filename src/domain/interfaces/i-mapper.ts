export interface IMapper<I, O> {
	/**
	 * @function map
	 * @param {I} target
	 * @returns {O}
	 */
	map(target: I): O;
}
