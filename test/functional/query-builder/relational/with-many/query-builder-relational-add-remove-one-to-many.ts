import "reflect-metadata";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {expect} from "chai";
import {Connection} from "../../../../../src/connection/Connection";

describe("query builder > relational query builder > add operation > one to many relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should add entity relation of a given entity by entity objects", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(qr, category3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category1)
            .add(qr, post1);

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 1, name: "category #1" });

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category1)
            .remove(qr, post1);

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;
        
        await qr.release();
    })));

    it("should add entity relation of a given entity by entity id", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(qr, category3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(2) // category id
            .add(qr, 2); // post id

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.eql({ id: 2, name: "category #2" });

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(2) // category id
            .remove(qr, 2); // post id

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;
        
        await qr.release();
    })));

    it("should add entity relation of a given entity by entity id map", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(qr, category3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category id
            .add(qr, { id: 3 }); // post id

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.eql({ id: 3, name: "category #3" });

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category id
            .remove(qr, { id: 3 }); // post id

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;
        
        await qr.release();
    })));

    it("should add multiple entities into relation of a multiple entities", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(qr, category3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category
            .add(qr, [{ id: 1 }, { id: 3 }]); // posts

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.eql({ id: 3, name: "category #3" });

        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of({ id: 3 }) // category
            .remove(qr, [{ id: 1 }, { id: 3 }]); // posts

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost2!.category).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["category"] });
        expect(loadedPost3!.category).to.be.null;
        
        await qr.release();
    })));

    it("should handle addAndRemove method as well", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const category1 = new Category();
        category1.name = "category #1";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "category #2";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "category #3";
        await connection.manager.save(qr, category3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        // add initial data
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .add(qr, post2); // post

        let loadedPost1 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        // when nothing is specified nothing should be performed
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .addAndRemove(qr, [], []); // post

        loadedPost1 = await connection.manager.findOne(qr, Post, 2, { relations: ["category"] });
        expect(loadedPost1!.category).to.be.eql({ id: 3, name: "category #3" });

        // now add and remove =)
        await connection
            .createQueryBuilder()
            .relation(Category, "posts")
            .of(category3) // category
            .addAndRemove(qr, [post1, post3], [post2]); // post

        const loadedCategory = await connection.manager.findOne(qr, Category, 3, { relations: ["posts"] });
        expect(loadedCategory!.posts).to.deep.include({ id: 1, title: "post #1" });
        expect(loadedCategory!.posts).to.not.contain({ id: 2, title: "post #2" });
        expect(loadedCategory!.posts).to.deep.include({ id: 3, title: "post #3" });
        
        await qr.release();
    })));

});
