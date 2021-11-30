import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("columns > getters and setters", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not update columns marked with readonly property", () => Promise.all(connections.map(async connection => {

        const postRepository = connection.getRepository(Post);
        const qr = connection.createQueryRunner();

        // create and save a post first
        const post = new Post();
        post.title = "hello";
        await postRepository.save(qr, post);

        // check if title is a value applied by a setter
        const loadedPost1 = await postRepository.findOne(qr, post.id);
        expect(loadedPost1!.title).to.be.equal("bye");

        // try to load a column by its value
        const loadedPost2 = await postRepository.findOne(qr, { title: "bye" });
        expect(loadedPost2!.title).to.be.equal("bye");

        await qr.release();
    })));


});
