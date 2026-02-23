export const tblNameCodeConversion = 'CODE_CONVERSION';

export interface CodeConversionModel {
	sourceLanguage: 'Delphi' | 'COBOL';
	targetLanguage: 'Java' | 'Node.js' | 'Python' | 'GO';
	inputCode: string;
	outputCode?: string;
	conversionStatus: 'PENDING' | 'SUCCESS' | 'FAILED';
	errorMessage?: string;
	requestId?: string;
	ip: string;
}