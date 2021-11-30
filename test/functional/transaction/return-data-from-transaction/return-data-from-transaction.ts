import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe("transaction > return data from transaction", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "sqlite", "better-sqlite3", "postgres"] // todo: for some reasons mariadb tests are not passing here
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should allow to return typed data from transaction", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const { postId, categoryId } = await connection.manager.transaction<{ postId: number, categoryId: number }>(qr, async queryRunner => {

            const post = new Post();
            post.title = "Post #1";
            await queryRunner.manager.save(queryRunner, post);

            const category = new Category();
            category.name = "Category #1";
            await queryRunner.manager.save(queryRunner, category);

            return {
                postId: post.id,
                categoryId: category.id
            };

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

    it("should allow to return typed data from transaction using type inference", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const { postId, categoryId } = await connection.manager.transaction(qr, async queryRunner => {

            const post = new Post();
            post.title = "Post #1";
            await queryRunner.manager.save(queryRunner, post);

            const category = new Category();
            category.name = "Category #1";
            await queryRunner.manager.save(queryRunner, category);

            return {
                postId: post.id,
                categoryId: category.id
            };

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
