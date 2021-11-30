import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {expect} from "chai";

describe("persistence > null and default behaviour", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],

    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should insert value if it is set", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        // create category
        const post = new Post();
        post.id = 1;
        post.title = "Category saved!";
        await connection.manager.save(qr, post);

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        expect(loadedPost).to.exist;
        loadedPost!.should.be.eql({
            id: 1,
            title: "Category saved!"
        });

        await qr.release();
    })));

    it("should insert default when post.title is undefined", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        // create category
        const post = new Post();
        post.id = 1;
        await connection.manager.save(qr, post);

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        expect(loadedPost).to.exist;
        loadedPost!.should.be.eql({
            id: 1,
            title: "hello default value"
        });

        await qr.release();
    })));

    it("should insert NULL when post.title is null", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        // create category
        const post = new Post();
        post.id = 1;
        post.title = null;
        await connection.manager.save(qr, post);

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        expect(loadedPost).to.exist;
        loadedPost!.should.be.eql({
            id: 1,
            title: null
        });

        await qr.release();
    })));

    it("should update nothing when post.title is undefined", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        // create category
        const post = new Post();
        post.id = 1;
        post.title = "Category saved!";
        await connection.manager.save(qr, post);

        post.title = undefined;
        await connection.manager.save(qr, post);

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        expect(loadedPost).to.exist;
        loadedPost!.should.be.eql({
            id: 1,
            title: "Category saved!"
        });

        await qr.release();
    })));

    it("should update to null when post.title is null", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        const post = new Post();
        post.id = 1;
        post.title = "Category saved!";
        await connection.manager.save(qr, post);

        post.title = null;
        await connection.manager.save(qr, post);

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        expect(loadedPost).to.exist;
        loadedPost!.should.be.eql({
            id: 1,
            title: null
        });

        await qr.release();
    })));

});
