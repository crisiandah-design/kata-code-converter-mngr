import { SourceLanguageEnum, TargetLanguageEnum } from '../enums/transform-language.enum';

export interface TransformRequestModel {
	sourceLanguage: SourceLanguageEnum;
	targetLanguage: TargetLanguageEnum;
	code: string;
}
