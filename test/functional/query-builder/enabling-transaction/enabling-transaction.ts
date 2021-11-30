import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("query builder > enabling transaction", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({ __dirname }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should execute query in a transaction", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        const post = new Post();
        post.title = "about transactions in query builder";

        await connection.createQueryBuilder()
            .insert()
            .into(Post)
            .values(post)
            .useTransaction(true)
            .execute(qr);

        // todo: check if transaction query was executed

        await qr.release();
    })));

    // todo: add tests for update and remove queries as well

});