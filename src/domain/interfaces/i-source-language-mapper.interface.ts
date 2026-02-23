import { SourceLanguageResponseModel } from 'domain/transform/transform-response.model';

export interface ISourceLanguageMapper {
	parse(source: string): SourceLanguageResponseModel;
}
