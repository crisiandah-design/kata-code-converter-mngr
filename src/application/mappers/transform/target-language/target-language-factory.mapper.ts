import { IMapper } from '../../../../domain/interfaces/i-mapper';
import { IntermediateRepresentation } from '../../../../domain/models/intermediate-representation.model';
import { TargetLanguageEnum } from '../../../../domain/enums/transform-language.enum';
import { javaMapper } from './java.mapper';
import { pythonMapper } from './python.mapper';
import { nodeMapper } from './node.mapper';
import { goMapper } from './go.mapper';

export default class TargetLanguageMapperFactory
	implements
		IMapper<{ inputCode: IntermediateRepresentation; language: TargetLanguageEnum }, string>
{
	// se Impleneta mal intencionalmente este strategy ya que se estan instanciando desde cada clase y solo se usara
	// un mapper por cada lenguaje, por lo que no se necesita una instancia de cada uno, solo se usara el metodo generate de cada clase
	private readonly strategyTransformCode: { [key in TargetLanguageEnum]: any } = {
		JAVA: javaMapper,
		PYTHON: pythonMapper,
		NODE: nodeMapper,
		GO: goMapper,
	};

	public map(target: {
		inputCode: IntermediateRepresentation;
		language: TargetLanguageEnum;
	}): string {
		try {
			const { inputCode, language } = target;
			return this.strategyTransformCode[language].generate(inputCode);
		} catch (error) {
			throw new Error(`Unsupported target language: ${target.language}`);
		}
	}
}

export const targetLanguageMapperFactory = new TargetLanguageMapperFactory();
