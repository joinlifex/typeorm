import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("other issues > escaping function parameter", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("select query builder should ignore function-based parameters", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "Super title";
        await connection.manager.save(queryRunner, post);

        expect(() => {
            return connection
                .manager
                .createQueryBuilder(Post, "post")
                .where("post.title = :title", { title: () => "Super title" })
                .getOne(queryRunner);
        }).to.throw(Error);
        
        queryRunner.release();
    })));

    it("insert query builder should work with function parameters", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        await connection
            .manager
            .getRepository(Post)
            .createQueryBuilder()
            .insert()
            .values({
                title: () => "'super title'"
            })
            .execute(queryRunner);

        const post = await connection.manager.findOne(queryRunner, Post, { title: "super title" });
        expect(post).to.be.eql({ id: 1, title: "super title" });

        queryRunner.release();
    })));

    it("update query builder should work with function parameters", () => Promise.all(connections.map(async connection => {

        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "Super title";
        await connection.manager.save(queryRunner, post);

        await connection
            .manager
            .getRepository(Post)
            .createQueryBuilder()
            .update()
            .set({
                title: () => "'super title'"
            })
            .execute(queryRunner);

        const loadedPost = await connection.manager.findOne(queryRunner, Post, { title: "super title" });
        expect(loadedPost).to.be.eql({ id: 1, title: "super title" });

        queryRunner.release();
    })));

});
