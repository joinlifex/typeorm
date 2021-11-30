import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe("github issues > #175 ManyToMany relation doesn't put an empty array when the relation is empty", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return post with categories if they are attached to the post", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const postWithCategories = new Post();
        postWithCategories.title = "post with categories";
        postWithCategories.categories = [category1, category2];
        await connection.manager.save(qr, postWithCategories);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.title = :title", { title: "post with categories" })
            .getOne(qr);

        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql({
            id: 1,
            title: "post with categories",
            categories: [{
                id: 1,
                name: "category #1"
            }, {
                id: 2,
                name: "category #2"
            }]
        });
        await qr.release();
    })));
    
    it("should return post with categories even if post with empty categories was saved", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const postWithoutCategories = new Post();
        postWithoutCategories.title = "post without categories";
        postWithoutCategories.categories = [];
        await connection.manager.save(qr, postWithoutCategories);

        const justPost = new Post();
        justPost.title = "just post";

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.categories", "categories")
            .where("post.title = :title", { title: "post without categories" })
            .getOne(qr);

        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql({
            id: 1,
            title: "post without categories",
            categories: []
        });
        await qr.release();
    })));
    
    it("should return post with categories even if post was saved without categories set", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const justPost = new Post();
        justPost.title = "just post";
        await connection.manager.save(qr, justPost);

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .leftJoinAndSelect("post.secondaryCategories", "secondaryCategories")
            .where("post.title = :title", { title: "just post" })
            .getOne(qr);

        expect(loadedPost).not.to.be.undefined;
        loadedPost!.should.be.eql({
            id: 1,
            title: "just post",
            secondaryCategories: []
        });
        await qr.release();
    })));

});
