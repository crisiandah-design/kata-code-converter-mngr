export type IRNode = {
	type: string;
	value?: any;
	children?: IRNode[];
};

export type IntermediateRepresentation = {
	root: IRNode;
};
