import { QueryRunner } from "../../../src";
import {EntityRepository} from "../../../src/decorator/EntityRepository";
import {AbstractRepository} from "../../../src/repository/AbstractRepository";
import {Author} from "../entity/Author";

/**
 * First type of custom repository - extends abstract repository.
 */
@EntityRepository(Author)
export class AuthorRepository extends AbstractRepository<Author> {

    createAndSave(queryRunner: QueryRunner, firstName: string, lastName: string) {
        const author = new Author();
        author.firstName = firstName;
        author.lastName = lastName;

        return this.manager.save(queryRunner, author);
    }

    findMyAuthor(queryRunner: QueryRunner) {
        return this
            .createQueryBuilder("author")
            .getOne(queryRunner);
    }

}