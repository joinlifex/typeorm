import "reflect-metadata";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../../utils/test-utils";
import { Connection } from "../../../../src/connection/Connection";
import { UpdateResult } from "../../../../src";
import { Post } from "./entity/Post";
import { PostBigInt } from "./entity/PostBigInt";
import { UserWithEmbededEntity } from "./entity/UserWithEmbededEntity";

describe("repository > increment method", () => {

    describe("basic", () => {

        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            entities: [Post]
        }));
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should increment value", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const post1 = new Post();
            post1.id = 1;
            post1.title = "post #1";
            post1.counter = 1;
            const post2 = new Post();
            post2.id = 2;
            post2.title = "post #2";
            post2.counter = 1;
            await connection.manager.save(qr, [post1, post2]);

            // increment counter of post 1
            await connection
                .getRepository(Post)
                .increment(qr, { id: 1 }, "counter", 1);

            // increment counter of post 2
            await connection
                .manager
                .increment(qr, Post, { id: 2 }, "counter", 3);

            // load and check counter
            const loadedPost1 = await connection.manager.findOne(qr, Post, 1);
            loadedPost1!.counter.should.be.equal(2);

            const loadedPost2 = await connection.manager.findOne(qr, Post, 2);
            loadedPost2!.counter.should.be.equal(4);
            await qr.release();
        })));

        it("should accept string as input and increment value", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const post1 = new Post();
            post1.id = 1;
            post1.title = "post #1";
            post1.counter = 1;
            const post2 = new Post();
            post2.id = 2;
            post2.title = "post #2";
            post2.counter = 1;
            await connection.manager.save(qr, [post1, post2]);

            // increment counter of post 1
            await connection
                .getRepository(Post)
                .increment(qr, { id: 1 }, "counter", "22");

            // increment counter of post 2
            await connection
                .manager
                .increment(qr, Post, { id: 2 }, "counter", "33");

            // load and check counter
            const loadedPost1 = await connection.manager.findOne(qr, Post, 1);
            loadedPost1!.counter.should.be.equal(23);

            const loadedPost2 = await connection.manager.findOne(qr, Post, 2);
            loadedPost2!.counter.should.be.equal(34);
            await qr.release();
        })));

        it("should return UpdateResult", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const post1 = new Post();
            post1.id = 1;
            post1.title = "post #1";
            post1.counter = 1;
            await connection.manager.save(qr, post1);

            // increment counter of post 1
            const result = await connection
                .getRepository(Post)
                .increment(qr, { id: 1 }, "counter", 22);

            result.should.be.an.instanceOf(UpdateResult);

            await qr.release();
        })));

        it("should throw an error if column property path was not found", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const post1 = new Post();
            post1.id = 1;
            post1.title = "post #1";
            post1.counter = 1;
            const post2 = new Post();
            post2.id = 2;
            post2.title = "post #2";
            post2.counter = 1;
            await connection.manager.save(qr, [post1, post2]);

            // increment counter of post 1
            await connection
                .getRepository(Post)
                .increment(qr, { id: 1 }, "unknownProperty", 1)
                .should.be.rejected;

            await qr.release();
        })));

        it("should throw an error if input value is not number", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const post1 = new Post();
            post1.id = 1;
            post1.title = "post #1";
            post1.counter = 1;
            const post2 = new Post();
            post2.id = 2;
            post2.title = "post #2";
            post2.counter = 1;
            await connection.manager.save(qr, [post1, post2]);

            // increment counter of post 1
            await connection
                .getRepository(Post)
                .increment(qr, { id: 1 }, "counter", "12abc")
                .should.be.rejected;

            await qr.release();
        })));

    });

    describe("bigint", () => {

        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            entities: [PostBigInt],
            enabledDrivers: ["mysql", "mariadb", "postgres", "sap"],
            // logging: true
        }));
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should increment value", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            // save few dummy posts
            const postBigInt1 = new PostBigInt();
            postBigInt1.id = 1;
            postBigInt1.title = "post #1";
            postBigInt1.counter = "1";
            const postBigInt2 = new PostBigInt();
            postBigInt2.id = 2;
            postBigInt2.title = "post #2";
            postBigInt2.counter = "2";
            await connection.manager.save(qr, [postBigInt1, postBigInt2]);

            // increment counter of post 1
            await connection
                .getRepository(PostBigInt)
                .increment(qr, { id: 1 }, "counter", "9000000000000000000");

            // increment counter of post 2
            await connection
                .manager
                .increment(qr, PostBigInt, { id: 2 }, "counter", "9000000000000000000");

            // load and check counter
            const loadedPost1 = await connection.manager.findOne(qr, PostBigInt, 1);
            loadedPost1!.counter.should.be.equal("9000000000000000001");

            const loadedPost2 = await connection.manager.findOne(qr, PostBigInt, 2);
            loadedPost2!.counter.should.be.equal("9000000000000000002");

            await qr.release();
        })));

    });


    describe("embeded entities", () => {

        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            entities: [UserWithEmbededEntity],
        }));
        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should increment value", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const userWithEmbededEntity = new UserWithEmbededEntity();
            userWithEmbededEntity.id = 1;
            await connection.manager.save(qr, [userWithEmbededEntity]);

            await connection
                .getRepository(UserWithEmbededEntity)
                .increment(qr, { id: 1 }, "friend.sent", 5);

            const loadedUser = await connection.manager.findOne(qr, UserWithEmbededEntity, 1);
            loadedUser!.friend.sent.should.be.equal(5);

            await qr.release();
        })));

    });

});
