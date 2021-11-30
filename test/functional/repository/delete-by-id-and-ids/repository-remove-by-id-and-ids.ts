import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("repository > deleteById methods", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("remove using deleteById method should delete successfully", () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);
        const qr = connection.createQueryRunner();

        // save a new posts
        const newPost1 = postRepository.create(qr);
        newPost1.title = "Super post #1";
        const newPost2 = postRepository.create(qr);
        newPost2.title = "Super post #2";
        const newPost3 = postRepository.create(qr);
        newPost3.title = "Super post #3";
        const newPost4 = postRepository.create(qr);
        newPost4.title = "Super post #4";

        await postRepository.save(qr, newPost1);
        await postRepository.save(qr, newPost2);
        await postRepository.save(qr, newPost3);
        await postRepository.save(qr, newPost4);

        // remove one
        await postRepository.delete(qr, 1);

        // load to check
        const loadedPosts = await postRepository.find(qr);

        // assert
        loadedPosts.length.should.be.equal(3);
        expect(loadedPosts.find(p => p.id === 1)).to.be.undefined;
        expect(loadedPosts.find(p => p.id === 2)).not.to.be.undefined;
        expect(loadedPosts.find(p => p.id === 3)).not.to.be.undefined;
        expect(loadedPosts.find(p => p.id === 4)).not.to.be.undefined;
        await qr.release();
    })));

    it("remove using removeByIds method should delete successfully",  () => Promise.all(connections.map(async connection => {
        const postRepository = connection.getRepository(Post);
        const qr = connection.createQueryRunner();

        // save a new posts
        const newPost1 = postRepository.create(qr);
        newPost1.title = "Super post #1";
        const newPost2 = postRepository.create(qr);
        newPost2.title = "Super post #2";
        const newPost3 = postRepository.create(qr);
        newPost3.title = "Super post #3";
        const newPost4 = postRepository.create(qr);
        newPost4.title = "Super post #4";

        await postRepository.save(qr, newPost1);
        await postRepository.save(qr, newPost2);
        await postRepository.save(qr, newPost3);
        await postRepository.save(qr, newPost4);

        // remove multiple
        await postRepository.delete(qr, [2, 3]);

        // load to check
        const loadedPosts = await postRepository.find(qr);

        // assert
        loadedPosts.length.should.be.equal(2);
        expect(loadedPosts.find(p => p.id === 1)).not.to.be.undefined;
        expect(loadedPosts.find(p => p.id === 2)).to.be.undefined;
        expect(loadedPosts.find(p => p.id === 3)).to.be.undefined;
        expect(loadedPosts.find(p => p.id === 4)).not.to.be.undefined;
        await qr.release();
    })));

});
