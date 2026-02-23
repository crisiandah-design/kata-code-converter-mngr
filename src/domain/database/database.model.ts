import { QueryTypes } from 'sequelize';
import { Dialect } from 'sequelize/types/sequelize';

export interface IDatabaseModel {
	dialect: Dialect;
	database: string;
	username: string;
	password: string;
	host: string;
	port: number;
	pool: IPool;
	logging: boolean;
}

export interface IPool {
	min: number;
	max: number;
	idle: number;
	acquire: number;
}

export interface ResponseModel {
	sentence: string;
	result: boolean;
	response: any | null;
	message: string;
	type: QueryTypes;
}
