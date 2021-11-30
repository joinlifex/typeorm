import "reflect-metadata";
import {SapDriver} from "../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {expect} from "chai";
import { Category } from "./entity/Category";
import { OracleDriver } from "../../../src/driver/oracle/OracleDriver";

describe("github issues > #3363 Isolation Level in transaction() from Connection", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should execute operations in READ UNCOMMITED isolation level", () => Promise.all(connections.map(async function(connection) {
        // SAP, Oracle does not support READ UNCOMMITTED isolation level
        if (connection.driver instanceof SapDriver || connection.driver instanceof OracleDriver)
            return;

        let postId: number|undefined = undefined, categoryId: number|undefined = undefined;
        const qr = connection.createQueryRunner();

        await connection.transaction(qr, "READ UNCOMMITTED", async queryRunner => {

            const post = new Post();
            post.title = "Post #1";
            await queryRunner.manager.save(queryRunner, post);

            const category = new Category();
            category.name = "Category #1";
            await queryRunner.manager.save(queryRunner, category);

            postId = post.id;
            categoryId = category.id;

        });

        const post = await connection.manager.findOne(qr, Post, { where: { title: "Post #1" }});
        expect(post).not.to.be.undefined;
        post!.should.be.eql({
            id: postId,
            title: "Post #1"
        });

        const category = await connection.manager.findOne(qr, Category, { where: { name: "Category #1" }});
        expect(category).not.to.be.undefined;
        category!.should.be.eql({
            id: categoryId,
            name: "Category #1"
        });

        await qr.release();
    })));

    it("should execute operations in SERIALIZABLE isolation level", () => Promise.all(connections.map(async connection => {

        let postId: number|undefined = undefined, categoryId: number|undefined = undefined;

        const qr = connection.createQueryRunner();
        await connection.transaction(qr, "SERIALIZABLE", async queryRunner => {

            const post = new Post();
            post.title = "Post #1";
            await queryRunner.manager.save(queryRunner, post);

            const category = new Category();
            category.name = "Category #1";
            await queryRunner.manager.save(queryRunner, category);

            postId = post.id;
            categoryId = category.id;

        });

        const post = await connection.manager.findOne(qr, Post, { where: { title: "Post #1" }});
        expect(post).not.to.be.undefined;
        post!.should.be.eql({
            id: postId,
            title: "Post #1"
        });

        const category = await connection.manager.findOne(qr, Category, { where: { name: "Category #1" }});
        expect(category).not.to.be.undefined;
        category!.should.be.eql({
            id: categoryId,
            name: "Category #1"
        });

        await qr.release();
    })));

});
