import { QueryRunner } from "../../../src";
import {EntityRepository} from "../../../src/decorator/EntityRepository";
import {EntityManager} from "../../../src/entity-manager/EntityManager";
import {User} from "../entity/User";

/**
 * Third type of custom repository - extends nothing and accepts entity manager as a first constructor parameter.
 */
@EntityRepository()
export class UserRepository {

    constructor(private manager: EntityManager) {
    }

    async createAndSave(queryRunner: QueryRunner, firstName: string, lastName: string) {
        const user = await this.manager.create(queryRunner, User, { firstName, lastName });
        return this.manager.save(queryRunner, user);
    }

    async findByName(queryRunner: QueryRunner, firstName: string, lastName: string) {
        return this.manager.createQueryBuilder(User, "user")
            .where("user.firstName = :firstName AND user.lastName = :lastName")
            .setParameters({ firstName, lastName })
            .getOne(queryRunner);
    }

}