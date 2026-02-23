
import { CodeConversionModel, tblNameCodeConversion } from '../database/code-convertion.model';
import { Sequelize, Model, DataTypes } from 'sequelize';

export const codeConverterEntity = (sequelize: Sequelize) => {
	class Availability extends Model<CodeConversionModel> {}

	Availability.init(
		{
            sourceLanguage: {
                type: DataTypes.ENUM('Delphi', 'COBOL'),
                allowNull: false,
                field: 'SOURCE_LANGUAGE',
                comment: 'source code language'
            },
            targetLanguage: {
                type: DataTypes.ENUM('Java', 'Node.js', 'Python', 'GO'),
                allowNull: false,
                field: 'TARGET_LANGUAGE',
                comment: 'target code language'
            },
            inputCode: {
                type: DataTypes.TEXT('long'),
                allowNull: false,
                field: 'INPUT_CODE'
            },
            outputCode: {
                type: DataTypes.TEXT('long'),
                allowNull: true,
                field: 'OUTPUT_CODE'
            },
            conversionStatus: {
                type: DataTypes.ENUM('PENDING', 'SUCCESS', 'FAILED'),
                defaultValue: 'PENDING',
                field: 'CONVERSION_STATUS'
            },
            errorMessage: {
                type: DataTypes.STRING(512),
                allowNull: true,
                field: 'ERROR_MESSAGE'
            },
            requestId: {
                type: DataTypes.STRING(100),
                allowNull: true,
                field: 'REQUEST_ID'
            },
            ip: {
                type: DataTypes.STRING(45),
                allowNull: false,
                field: 'IP'
            }
		},
		{
			sequelize,
			modelName: tblNameCodeConversion,
			tableName: tblNameCodeConversion,
			timestamps: false,
		}
	);

	Availability.removeAttribute('id');
	return Availability;
};
