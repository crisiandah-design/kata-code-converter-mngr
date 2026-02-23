import { IMapper } from '../../../../domain/interfaces/i-mapper';
import { TransformRequestModel } from '../../../../domain/transform/transform-request.model';
import { CobolMapper } from './cobol.mapper';
import { DelphiMapper } from './delphi.mapper';
import { SourceLanguageEnum } from '../../../../domain/enums/transform-language.enum';
import { SourceLanguageResponseModel } from '../../../../domain/transform/transform-response.model';
import { TRANSFORM_ERRORS } from '../../../../domain/constants/tranform-error.constants';

export default class SourceLanguageMapperFactory
	implements IMapper<TransformRequestModel, SourceLanguageResponseModel>
{
	private readonly strategyTransformCode: { [key in SourceLanguageEnum]: any } = {
		COBOL: CobolMapper,
		DELPHI: DelphiMapper,
	};

	public map({ sourceLanguage, code }: TransformRequestModel): SourceLanguageResponseModel {
		try {
			const mapperInstance = new this.strategyTransformCode[sourceLanguage as SourceLanguageEnum]();
			const mapperResponse: SourceLanguageResponseModel = mapperInstance.parse(code);
			return mapperResponse;
		} catch (error) {
			throw new Error(`${TRANSFORM_ERRORS.UNSUPPORTED_LANGUAGE} ${sourceLanguage}`);
		}
	}
}

export const sourceLanguageMapperFactory = new SourceLanguageMapperFactory();
