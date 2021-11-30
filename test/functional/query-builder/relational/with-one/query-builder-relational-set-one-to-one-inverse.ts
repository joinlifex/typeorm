import "reflect-metadata";
import {Post} from "./entity/Post";
import {Image} from "./entity/Image";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {expect} from "chai";
import {Connection} from "../../../../../src/connection/Connection";

describe("query builder > relational query builder > set operation > one-to-one non owner side", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should set entity relation of a given entity by entity objects", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const image1 = new Image();
        image1.url = "image #1";
        await connection.manager.save(qr, image1);

        const image2 = new Image();
        image2.url = "image #2";
        await connection.manager.save(qr, image2);

        const image3 = new Image();
        image3.url = "image #3";
        await connection.manager.save(qr, image3);

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
            .relation(Image, "post")
            .of(image1)
            .set(qr, post1);

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.eql({ id: 1, url: "image #1" });

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;

        await connection
            .createQueryBuilder()
            .relation(Image, "post")
            .of(image1)
            .set(qr, null);

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;

        await qr.release();
    })));

    it("should set entity relation of a given entity by entity id", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const image1 = new Image();
        image1.url = "image #1";
        await connection.manager.save(qr, image1);

        const image2 = new Image();
        image2.url = "image #2";
        await connection.manager.save(qr, image2);

        const image3 = new Image();
        image3.url = "image #3";
        await connection.manager.save(qr, image3);

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
            .relation(Image, "post")
            .of(2)
            .set(qr, 2);

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.eql({ id: 2, url: "image #2" });

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;

        await connection
            .createQueryBuilder()
            .relation(Image, "post")
            .of(2)
            .set(qr, null);

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;
        
        await qr.release();
    })));

    it("should set entity relation of a given entity by entity id map", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const image1 = new Image();
        image1.url = "image #1";
        await connection.manager.save(qr, image1);

        const image2 = new Image();
        image2.url = "image #2";
        await connection.manager.save(qr, image2);

        const image3 = new Image();
        image3.url = "image #3";
        await connection.manager.save(qr, image3);

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
            .relation(Image, "post")
            .of({ id: 3 })
            .set(qr, { id: 3 });

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.eql({ id: 3, url: "image #3" });

        await connection
            .createQueryBuilder()
            .relation(Image, "post")
            .of({ id: 3 })
            .set(qr, null);

        loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;
        
        await qr.release();
    })));

    it("should raise error when setting entity relation of a multiple entities", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const image1 = new Image();
        image1.url = "image #1";
        await connection.manager.save(qr, image1);

        const image2 = new Image();
        image2.url = "image #2";
        await connection.manager.save(qr, image2);

        const image3 = new Image();
        image3.url = "image #3";
        await connection.manager.save(qr, image3);

        const post1 = new Post();
        post1.title = "post #1";
        await connection.manager.save(qr, post1);

        const post2 = new Post();
        post2.title = "post #2";
        await connection.manager.save(qr, post2);

        const post3 = new Post();
        post3.title = "post #3";
        await connection.manager.save(qr, post3);

        let error: null | Error = null;
        try {
            await connection
                .createQueryBuilder()
                .relation(Image, "post")
                .of({ id: 3 })
                .set(qr, [{ id: 1 }, { id: 3 }]);
        } catch (e) {
            error = e;
        }

        expect(error).to.be.an.instanceof(Error);

        let loadedPost1 = await connection.manager.findOne(qr, Post, 1, { relations: ["image"] });
        expect(loadedPost1!.image).to.be.null;

        let loadedPost2 = await connection.manager.findOne(qr, Post, 2, { relations: ["image"] });
        expect(loadedPost2!.image).to.be.null;

        let loadedPost3 = await connection.manager.findOne(qr, Post, 3, { relations: ["image"] });
        expect(loadedPost3!.image).to.be.null;
        
        await qr.release();
    })));

});
