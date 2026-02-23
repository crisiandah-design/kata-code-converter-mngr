import { IntermediateRepresentation } from '../models/intermediate-representation.model';

export interface ITargetLanguageMapper {
	generate(ir: IntermediateRepresentation): string;
}
