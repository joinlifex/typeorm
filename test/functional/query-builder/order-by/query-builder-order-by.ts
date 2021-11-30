import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";

describe("query builder > order-by", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be always in right order(default order)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(qr, [post1, post2]);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .getOne(qr);

        expect(loadedPost!.myOrder).to.be.equal(2);

        await qr.release();
    })));

    it("should be always in right order(custom order)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(qr, [post1, post2]);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC")
            .getOne(qr);

        expect(loadedPost!.myOrder).to.be.equal(1);

        await qr.release();
    })));

    it("should be always in right order(custom order)", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver)) // NULLS FIRST / LAST only supported by postgres
            return;
            const qr = connection.createQueryRunner();
        
        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(qr, [post1, post2]);

        const loadedPost1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC", "NULLS FIRST")
            .getOne(qr);

        expect(loadedPost1!.myOrder).to.be.equal(1);

        const loadedPost2 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder", "ASC", "NULLS LAST")
            .getOne(qr);

        expect(loadedPost2!.myOrder).to.be.equal(1);

        await qr.release();
    })));

    it("should be always in right order(custom order)", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof MysqlDriver)) // IS NULL / IS NOT NULL only supported by mysql
            return;
            const qr = connection.createQueryRunner();
        
        const post1 = new Post();
        post1.myOrder = 1;

        const post2 = new Post();
        post2.myOrder = 2;
        await connection.manager.save(qr, [post1, post2]);

        const loadedPost1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder IS NULL", "ASC")
            .getOne(qr);

        expect(loadedPost1!.myOrder).to.be.equal(1);

        const loadedPost2 = await connection.manager
            .createQueryBuilder(Post, "post")
            .addOrderBy("post.myOrder IS NOT NULL", "ASC")
            .getOne(qr);

        expect(loadedPost2!.myOrder).to.be.equal(1);

        await qr.release();
    })));

    it("should be able to order by sql statement", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof MysqlDriver)) return; // DIV statement does not supported by all drivers
        const qr = connection.createQueryRunner();
        
        const post1 = new Post();
        post1.myOrder = 1;
        post1.num1 = 10;
        post1.num2 = 5;

        const post2 = new Post();
        post2.myOrder = 2;
        post2.num1 = 10;
        post2.num2 = 2;
        await connection.manager.save(qr, [post1, post2]);

        const loadedPost1 = await connection.manager
            .createQueryBuilder(Post, "post")
            .orderBy("post.num1 DIV post.num2")
            .getOne(qr);

        expect(loadedPost1!.num1).to.be.equal(10);
        expect(loadedPost1!.num2).to.be.equal(5);

        const loadedPost2 = await connection.manager
            .createQueryBuilder(Post, "post")
            .orderBy("post.num1 DIV post.num2", "DESC")
            .getOne(qr);

        expect(loadedPost2!.num1).to.be.equal(10);
        expect(loadedPost2!.num2).to.be.equal(2);
        
        await qr.release();
    })));

});
