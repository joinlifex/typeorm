import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("other issues > joining empty relations", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return empty array if its joined and nothing was found", () => Promise.all(connections.map(async function(connection) {

        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "Hello Post";
        await connection.manager.save(queryRunner, post);

        // check if ordering by main object works correctly

        const loadedPosts1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .getMany(queryRunner);

        expect(loadedPosts1).not.to.be.undefined;
        loadedPosts1.should.be.eql([{
            id: 1,
            title: "Hello Post",
            categories: []
        }]);

        queryRunner.release();
    })));

    it("should return empty array if its joined and nothing was found, but relations in empty results should be skipped", () => Promise.all(connections.map(async function(connection) {

        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "Hello Post";
        await connection.manager.save(queryRunner, post);

        // check if ordering by main object works correctly

        const loadedPosts1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .leftJoinAndSelect("categories.authors", "authors")
            .getMany(queryRunner);

        expect(loadedPosts1).not.to.be.undefined;
        loadedPosts1.should.be.eql([{
            id: 1,
            title: "Hello Post",
            categories: []
        }]);

        queryRunner.release();
    })));

});
