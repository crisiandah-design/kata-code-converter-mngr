import { NextFunction, Request, Response } from 'express';
import { EventTypes } from '../../../domain/enums/event-types.enum';
import CodeConvertionRepository from '../../repositories/code-convertion.repository';
import { CodeConversionModel } from '../../../domain/database/code-convertion.model';
import { SourceLanguageEnum, TargetLanguageEnum } from '../../../domain/enums/transform-language.enum';
import { TransformRequestModel } from '../../../domain/transform/transform-request.model';

export default function Report(events?: Array<EventTypes>): any {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
        const originalValue = descriptor.value;

        descriptor.value = async (...args: any[]) => {
            const next = args[2] as NextFunction;
            const response = args[1] as Response;
            const request = args[0] as Request;
            const repo = new CodeConvertionRepository();

            const requestPayload = request.body as TransformRequestModel;
            const requestId = request.header('X-RqUID') || request.header('x-rquid');
            const ipHeader = request.header('X-IPAddr') || request.header('x-ipaddr');

            const baseRecord: CodeConversionModel = {
                sourceLanguage: mapSourceLanguage(requestPayload?.sourceLanguage),
                targetLanguage: mapTargetLanguage(requestPayload?.targetLanguage),
                inputCode: requestPayload?.code ?? '',
                conversionStatus: 'PENDING',
                requestId: requestId ?? undefined,
                ip: ipHeader || request.ip || '0.0.0.0'
            };

            try {
                const responseBody = await originalValue.apply(originalValue, args);

                await repo.createCodeConvertion({
                    ...baseRecord,
                    outputCode: responseBody?.code,
                    conversionStatus: 'SUCCESS'
                });

                return responseBody;
            } catch (error: any) {
                await repo.createCodeConvertion({
                    ...baseRecord,
                    conversionStatus: 'FAILED',
                    errorMessage: error?.message ?? 'Unknown error'
                });

                throw error;
            }
        };
    };
}

function mapSourceLanguage(source?: SourceLanguageEnum): CodeConversionModel['sourceLanguage'] {
    if (source === SourceLanguageEnum.DELPHI) return 'Delphi';
    return 'COBOL';
}

function mapTargetLanguage(target?: TargetLanguageEnum): CodeConversionModel['targetLanguage'] {
    switch (target) {
        case TargetLanguageEnum.NODE:
            return 'Node.js';
        case TargetLanguageEnum.PYTHON:
            return 'Python';
        case TargetLanguageEnum.GO:
            return 'GO';
        default:
            return 'Java';
    }
}