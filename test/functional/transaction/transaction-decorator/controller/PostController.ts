import {Repository} from "../../../../../src/repository/Repository";
import {Transaction} from "../../../../../src/decorator/transaction/Transaction";
import {TransactionManager} from "../../../../../src/decorator/transaction/TransactionManager";
import {TransactionRepository} from "../../../../../src/decorator/transaction/TransactionRepository";
import {EntityManager} from "../../../../../src/entity-manager/EntityManager";

import {Post} from "../entity/Post";
import {Category} from "../entity/Category";
import {CategoryRepository} from "../repository/CategoryRepository";
import { QueryRunner } from "../../../../../src";

export class PostController {

    @Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
    async save(post: Post, category: Category, @TransactionManager() entityManager: EntityManager) {
        const qr = entityManager.connection.createQueryRunner();
        await entityManager.save(qr, post);
        await entityManager.save(qr, category);
        await qr.release();
    }

    // this save is not wrapped into the transaction
    async nonSafeSave(entityManager: EntityManager, post: Post, category: Category) {
        const qr = entityManager.connection.createQueryRunner();
        await entityManager.save(qr, post);
        await entityManager.save(qr, category);
        await qr.release();
    }

    @Transaction("mysql") // "mysql" is a connection name. you can not pass it if you are using default connection.
    async saveWithRepository(
        queryRunner: QueryRunner, 
        post: Post,
        category: Category,
        @TransactionRepository(Post) postRepository: Repository<Post>,
        @TransactionRepository() categoryRepository: CategoryRepository,
    ) {
        await postRepository.save(queryRunner, post);
        await categoryRepository.save(queryRunner, category);

        return categoryRepository.findByName(queryRunner, category.name);
    }

    @Transaction({ connectionName: "mysql", isolation: "SERIALIZABLE" }) // "mysql" is a connection name. you can not pass it if you are using default connection.
    async saveWithNonDefaultIsolation(post: Post, category: Category, @TransactionManager() entityManager: EntityManager) {
        
        const qr = entityManager.connection.createQueryRunner();
        await entityManager.save(qr, post);
        await entityManager.save(qr, category);
        await qr.release();
    }

}