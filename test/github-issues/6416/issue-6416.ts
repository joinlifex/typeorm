import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";

import { assert } from "chai";

import Post, { PostSchema } from "./entity/Post";
import PostTag, { PostTagSchema } from "./entity/PostTag";
import PostAttachment, { PostAttachmentSchema } from "./entity/PostAttachment";

describe("github issues > #6399 Combining ManyToOne, Cascade, & Composite Primary Key causes Unique Constraint issues", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [PostSchema, PostTagSchema, PostAttachmentSchema],
        enabledDrivers: ["sqlite"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("persisting the cascading entities should succeed", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const post = new Post();
        const postTag = new PostTag();
        post.tags = [postTag];

        await connection.manager.save(qr, post, { reload: true });

        try {
            await connection.manager.save(qr, post);
        } catch (e) {
            assert.fail(e.toString(), null, "Second save had an exception");
        }
        await qr.release();
    })));

    it("persisting the cascading entities without JoinColumn should succeed", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const post = new Post();
        const postAttachment = new PostAttachment();
        post.attachments = [postAttachment];

        await connection.manager.save(qr, post, { reload: true });

        try {
            await connection.manager.save(qr, post);
        } catch (e) {
            assert.fail(e.toString(), null, "Second save had an exception");
        }
        await qr.release();
    })));

    it("persisting the child entity should succeed", () => Promise.all(connections.map(async connection => {
        const post = new Post();

        const qr = connection.createQueryRunner();
        await connection.manager.save<Post>(qr, post);

        const postTag = new PostTag();
        postTag.post = post;

        await connection.manager.save(qr, postTag, { reload: true });

        try {
            await connection.manager.save(qr, postTag);
        } catch (e) {
            assert.fail(e.toString(), null, "Second save had an exception");
        }
        await qr.release();
    })));
});
