import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import { QueryRunner, TransactionAlreadyStartedError } from "../../../../src";
import sinon from "sinon";


const testFunction = sinon.spy();

const transaction = (qr: QueryRunner) => qr.manager.transaction(qr, async (queryRunner) => {
    const post = new Post();
    post.title = "Post #1";
    await queryRunner.manager.save(queryRunner, post);
    await testFunction();
    const category = new Category();
    category.name = "Category #1";
    await queryRunner.manager.save(queryRunner, category);
});

describe("transaction > return data from transaction", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "sqlite", "better-sqlite3", "postgres"] // todo: for some reasons mariadb tests are not passing here
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not transaction only once", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        Promise.all([
            transaction(qr),
            transaction(qr),
            transaction(qr),
            transaction(qr),
        ]).should.be.rejectedWith(TransactionAlreadyStartedError);
        await qr.release();
    })));
});
