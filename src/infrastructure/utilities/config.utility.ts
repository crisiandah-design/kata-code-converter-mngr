export const paramIsNum = (param: string | undefined): number | undefined => {
	return param ? Number(param) : undefined;
};
