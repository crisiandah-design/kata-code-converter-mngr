import debugLib from 'debug';
import { IDatabaseModel } from '../../domain/database/database.model';
import { Sequelize } from 'sequelize';


const debug = debugLib('bdb:DatabaseService');

export class databaseConnectionProvider {
    private static connection: Sequelize | null = null;

    public static async getInstance(config: IDatabaseModel): Promise<Sequelize> {
        if (!databaseConnectionProvider.connection) {
            debug('[INFO]: Creating new Sequelize connection...');
            databaseConnectionProvider.connection = await this.getConnection(config);
        } else {
            debug('[INFO]: Returning existing Sequelize connection...');
        }
        return databaseConnectionProvider.connection;
    }

    private static async getConnection(config: IDatabaseModel): Promise<Sequelize> {
        const { dialect, database, username, password, host, port, pool, logging } = config;
        return new Sequelize(
            database,
            username,
            password,
            {
                logging,
                dialect,
                host,
                port,
                sync: { schema: database },
                pool
            }
        );
    }
}
