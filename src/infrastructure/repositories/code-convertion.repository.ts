import { IDatabaseModel } from "../../domain/database/database.model";
import { databaseConnectionProvider } from "../providers/data-base-connection.provider";
import CONFIG from "../../config";
import { codeConverterEntity } from "../../domain/entities/code-convertion.entity";
import { CodeConversionModel } from "domain/database/code-convertion.model";
import { Sequelize } from "sequelize";



class CodeConvertionRepository extends databaseConnectionProvider {
    private sqParams: IDatabaseModel;
    private sq: Sequelize | undefined;

    constructor() {
        super();
        this.sqParams = CONFIG.DATABASE;

    }
    public async createCodeConvertion(data: CodeConversionModel): Promise<void> {
        this.sq = await CodeConvertionRepository.getInstance(this.sqParams);
        const codeConversion = codeConverterEntity(this.sq);
        await codeConversion.create(data);
    }
}

export default CodeConvertionRepository;