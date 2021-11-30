import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Connection} from "../../../../../src/connection/Connection";
import {PostWithDeleteDateColumn} from "./entity/PostWithDeleteDateColumn";
// import {expect} from "chai";

describe("persistence > persistence options > listeners", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({ __dirname }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("save listeners should work by default", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const post = new Post();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post);
        post.title.should.be.equal("Bakhrom!");
        
        await qr.release();
    })));

    it("save listeners should be disabled if save option is specified", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const post = new Post();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post, { listeners: false });
        post.title.should.be.equal("Bakhrom");
        
        await qr.release();
    })));

    it("remove listeners should work by default", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const post = new Post();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post);
        await connection.manager.remove(qr, post);
        post.isRemoved.should.be.equal(true);
        
        await qr.release();
    })));

    it("remove listeners should be disabled if remove option is specified", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const post = new Post();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post);
        await connection.manager.remove(qr, post, { listeners: false });
        post.isRemoved.should.be.equal(false);
        
        await qr.release();
    })));

    it("soft-remove listeners should work by default", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const post = new PostWithDeleteDateColumn();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post);
        await connection.manager.softRemove(qr, post);
        post.title.should.be.equal("Bakhrom!");
        post.isSoftRemoved.should.be.equal(true);
        
        await qr.release();
    })));

    it("soft-remove listeners should be disabled if remove option is specified", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithDeleteDateColumn();
        post.title = "Bakhrom";
        post.description = "Hello";
        await connection.manager.save(qr, post);
        await connection.manager.softRemove(qr, post, { listeners: false });
        post.title.should.be.equal("Bakhrom");
        post.isSoftRemoved.should.be.equal(false);
        
        await qr.release();
    })));

});
