import {getConnection, getMetadataArgsStorage} from "../../globals";
import {TransactionOptions} from "../options/TransactionOptions";
import {IsolationLevel} from "../../driver/types/IsolationLevel";
import { Repository } from "../../repository/Repository";
import { MongoRepository } from "../../repository/MongoRepository";
import { TreeRepository } from "../../repository/TreeRepository";
import { QueryRunner } from "../..";

/**
 * Wraps some method into the transaction.
 *
 * Method result will return a promise if this decorator applied.
 * All database operations in the wrapped method should be executed using entity managed passed
 * as a first parameter into the wrapped method.
 *
 * If you want to control at what position in your method parameters entity manager should be injected,
 * then use @TransactionManager() decorator.
 *
 * If you want to use repositories instead of bare entity manager,
 * then use @TransactionRepository() decorator.
 */
export function Transaction(connectionName?: string): MethodDecorator;
export function Transaction(options?: TransactionOptions): MethodDecorator;
export function Transaction(connectionOrOptions?: string | TransactionOptions): MethodDecorator {
    return function (target: Object, methodName: string, descriptor: PropertyDescriptor) {

        // save original method - we gonna need it
        const originalMethod = descriptor.value;

        // override method descriptor with proxy method
        descriptor.value = function(...args: any[]) {
            let connectionName = "default";
            let isolationLevel: IsolationLevel | undefined = undefined;
            if (connectionOrOptions) {
                if (typeof connectionOrOptions === "string") {
                    connectionName = connectionOrOptions;
                } else {
                    if (connectionOrOptions.connectionName) {
                        connectionName = connectionOrOptions.connectionName;
                    }
                    if (connectionOrOptions.isolation) {
                        isolationLevel = connectionOrOptions.isolation;
                    }
                }
            }

            const transactionCallback = (qr: QueryRunner) => {
                let argsWithInjectedTransactionManagerAndRepositories: any[];

                // filter all @TransactionManager() and @TransactionRepository() decorator usages for this method
                const transactionEntityManagerMetadatas = getMetadataArgsStorage()
                    .filterTransactionEntityManagers(target.constructor, methodName)
                    .reverse();
                const transactionRepositoryMetadatas = getMetadataArgsStorage()
                    .filterTransactionRepository(target.constructor, methodName)
                    .reverse();

                // if there are @TransactionManager() decorator usages the inject them
                if (transactionEntityManagerMetadatas.length > 0) {
                    argsWithInjectedTransactionManagerAndRepositories = [...args];
                    // replace method params with injection of transactionEntityManager
                    transactionEntityManagerMetadatas.forEach(metadata => {
                        argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, qr.manager);
                    });

                } else if (transactionRepositoryMetadatas.length === 0) { // otherwise if there's no transaction repositories in use, inject it as a first parameter
                    argsWithInjectedTransactionManagerAndRepositories = [qr.manager, ...args];

                } else {
                    argsWithInjectedTransactionManagerAndRepositories = [...args];
                }

                // for every usage of @TransactionRepository decorator
                transactionRepositoryMetadatas.forEach(metadata => {
                    let repositoryInstance: any;

                    // detect type of the repository and get instance from transaction entity manager
                    switch (metadata.repositoryType) {
                        case Repository:
                            repositoryInstance = qr.manager.getRepository(metadata.entityType!);
                            break;
                        case MongoRepository:
                            repositoryInstance = qr.manager.getMongoRepository(metadata.entityType!);
                            break;
                        case TreeRepository:
                            repositoryInstance = qr.manager.getTreeRepository(metadata.entityType!);
                            break;
                        // if not the TypeORM's ones, there must be custom repository classes
                        default:
                            repositoryInstance = qr.manager.getCustomRepository(metadata.repositoryType);
                    }

                    // replace method param with injection of repository instance
                    argsWithInjectedTransactionManagerAndRepositories.splice(metadata.index, 0, repositoryInstance);
                });

                return originalMethod.apply(this, argsWithInjectedTransactionManagerAndRepositories);
            };
            const connection = getConnection(connectionName);
            const queryRunner = connection.createQueryRunner();
            if (isolationLevel) {
                return connection.manager.transaction(queryRunner, isolationLevel, transactionCallback);
            } else {
                return connection.manager.transaction(queryRunner, transactionCallback);
            }
        };
    };
}
