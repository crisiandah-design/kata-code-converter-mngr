import { GenericCommandService } from '../../../domain/interfaces/generic-comand.service';
import Log from '../../../infrastructure/decorators/logger/log.aspect';
import { TransformRequestModel } from '../../../domain/transform/transform-request.model';
import { sourceLanguageMapperFactory } from '../../../application/mappers/transform/source-language/source-language-factory.mapper';
import { IntermediateRepresentation } from '../../../domain/models/intermediate-representation.model';
import { targetLanguageMapperFactory } from '../../../application/mappers/transform/target-language/target-language-factory.mapper';
import { TargetLanguageEnum } from '../../../domain/enums/transform-language.enum';
import {
	SourceLanguageResponseModel,
	TransformResponseModel,
} from 'domain/transform/transform-response.model';

class TransformService
	implements GenericCommandService<TransformRequestModel, TransformResponseModel>
{
	public async command(request: TransformRequestModel): Promise<TransformResponseModel> {
		const inputCodeIR = this.inputCodeIntermediateRepresentation(request);
		const response = this.outputCode(
			inputCodeIR.intermediateRepresentation,
			request.targetLanguage as TargetLanguageEnum
		);
		console.log('Generated output code:', response);
		return { code: response, detail: inputCodeIR.detail };
	}
	private inputCodeIntermediateRepresentation(
		request: TransformRequestModel
	): SourceLanguageResponseModel {
		return sourceLanguageMapperFactory.map(request);
	}

	private outputCode(
		intermediateRepresentation: IntermediateRepresentation,
		targetLanguage: TargetLanguageEnum
	): string {
		return targetLanguageMapperFactory.map({
			inputCode: intermediateRepresentation,
			language: targetLanguage,
		});
	}
}

export const transformService = new TransformService();
