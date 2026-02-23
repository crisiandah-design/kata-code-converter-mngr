import { IntermediateRepresentation } from '../../domain/models/intermediate-representation.model';

export interface TransformResponseModel {
	code: string;
	detail: RuleLog[];
}

export interface SourceLanguageResponseModel {
	intermediateRepresentation: IntermediateRepresentation;
	detail: RuleLog[];
}

export interface RuleLog {
	ruleName: string;
	description: string;
	line?: number;
}
