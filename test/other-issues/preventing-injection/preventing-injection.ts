import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {EntityColumnNotFound} from "../../../src/error/EntityColumnNotFound";

describe("other issues > preventing-injection", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not allow selection of non-exist columns via FindOptions", () => Promise.all(connections.map(async function(connection) {
        const post = new Post();
        post.title = "hello";
        const queryRunner = connection.createQueryRunner();
        await connection.manager.save(queryRunner, post);

        const postWithOnlyIdSelected = await connection.manager.find(queryRunner, Post, {
            select: ["id"]
        });
        postWithOnlyIdSelected.should.be.eql([{ id: 1 }]);

        await connection.manager.find(queryRunner, Post, {
            select: ["(WHERE LIMIT 1)" as any]
        }).should.be.rejected;
        queryRunner.release();
    })));

    it("should throw error for non-exist columns in where expression via FindOptions", () => Promise.all(connections.map(async function(connection) {
        
        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "hello";
        await connection.manager.save(queryRunner, post);

        const postWithOnlyIdSelected = await connection.manager.find(queryRunner, Post, {
            where: {
                title: "hello"
            }
        });
        postWithOnlyIdSelected.should.be.eql([{ id: 1, title: "hello" }]);

        let error: Error | undefined;
        try {
            await connection.manager.find(queryRunner, Post, {
                where: {
                    id: 2,
                    ["(WHERE LIMIT 1)"]: "hello"
                }
            });
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an.instanceof(EntityColumnNotFound);
        queryRunner.release();
    })));

    it("should not allow selection of non-exist columns via FindOptions", () => Promise.all(connections.map(async function(connection) {
        
        const queryRunner = connection.createQueryRunner();
        const post = new Post();
        post.title = "hello";
        await connection.manager.save(queryRunner, post);

        const loadedPosts = await connection.manager.find(queryRunner, Post, {
            order: {
                title: "DESC"
            }
        });
        loadedPosts.should.be.eql([{ id: 1, title: "hello" }]);

        await connection.manager.find(queryRunner, Post, {
            order: {
                ["(WHERE LIMIT 1)" as any]: "DESC"
            }
        }).should.be.rejected;

        queryRunner.release();
    })));

    it("should not allow non-numeric values in skip and take via FindOptions", () => Promise.all(connections.map(async function(connection) {

        const queryRunner = connection.createQueryRunner();
        await connection.manager.find(queryRunner, Post, {
            take: "(WHERE XXX)" as any
        }).should.be.rejected;

        await connection.manager.find(queryRunner, Post, {
            skip: "(WHERE LIMIT 1)" as any,
            take: "(WHERE XXX)" as any,
        }).should.be.rejected;

        queryRunner.release();
    })));

    it("should not allow non-numeric values in skip and take in QueryBuilder", () => Promise.all(connections.map(async function(connection) {
        expect(() => {
            connection.manager
                .createQueryBuilder(Post, "post")
                .take("(WHERE XXX)" as any);
        }).to.throw(Error);

        expect(() => {
            connection.manager
                .createQueryBuilder(Post, "post")
                .skip("(WHERE LIMIT 1)" as any);
        }).to.throw(Error);

    })));

    it("should not allow non-allowed values in order by in QueryBuilder", () => Promise.all(connections.map(async function(connection) {
        expect(() => {
            connection.manager
                .createQueryBuilder(Post, "post")
                .orderBy("post.id", "MIX" as any);
        }).to.throw(Error);

        expect(() => {
            connection.manager
                .createQueryBuilder(Post, "post")
                .orderBy("post.id", "DESC", "SOMETHING LAST" as any);
        }).to.throw(Error);

    })));

});
