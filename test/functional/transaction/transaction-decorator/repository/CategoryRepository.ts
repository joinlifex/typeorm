import { Repository } from "../../../../../src/repository/Repository";
import { EntityRepository } from "../../../../../src/decorator/EntityRepository";
import {Category} from "../entity/Category";
import { QueryRunner } from "../../../../../src";

@EntityRepository(Category)
export class CategoryRepository extends Repository<Category> {

    findByName(queryRunner: QueryRunner, name: string) {
        return this.findOne(queryRunner, { name });
    }

}