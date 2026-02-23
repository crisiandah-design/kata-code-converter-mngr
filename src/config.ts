import { IDatabaseModel } from './domain/database/database.model';
import { paramIsNum } from './infrastructure/utilities/config.utility';

const VERSIONS = {
	V1: '/V1',
};
const URI_DEFAULT = 'http://localhost:9001';
export default {
	PORT: process.env.APPLICATION_PORT ?? '8001',
	ENV: process.env.NODE_ENV ?? 'LOCAL',
	CONTEXT: process.env.CONTEXT ?? '/kata-senior',
	PATHS: {
		CODE_CONVERTER: {
			PATH: `${VERSIONS.V1}`,
			OPERATIONS: {
				TRANSFORM: '/transform',
			},
		},
	},
	RESOURCE: './static',
	OAS: {
		FILE: '/OAS.json',
		PATH: '/api-docs',
	},
	MASK_FIELDS: process.env.MASK_FIELDS ?? 'x-api-key,api-key,custIdentNum,email,identification',
	DATABASE: {
		dialect: process.env.DB_DIALECT ?? 'mysql',
		database: process.env.db_name ?? 'BBOG_KATA_CODE_CONVERTER',
		username: process.env.user ?? 'db_user',
		password: process.env.password ?? '123456',
		host: process.env.host ?? 'localhost',
		port: paramIsNum(process.env.port) ?? 3308,
		pool: {
			min: paramIsNum(process.env.DB_POOL_MIN) ?? 0,
			max: paramIsNum(process.env.DB_POOL_MAX) ?? 50,
			acquire: paramIsNum(process.env.DB_POOL_ACQUIRE) ?? 3000,
			idle: paramIsNum(process.env.DB_POOL_IDLE) ?? 10000,
		},
		logging: process.env.DB_LOGGING === 'true',
	} as IDatabaseModel,
};