import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../../src/connection/Connection";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../utils/test-utils";
import { Post } from "./entity/Post";

describe("cube-postgres", () => {
    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"]
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should create correct schema with Postgres' cube type", () =>
        Promise.all(
            connections.map(async connection => {
                const queryRunner = connection.createQueryRunner();
                const schema = await queryRunner.getTable("post");
                await queryRunner.release();
                expect(schema).not.to.be.undefined;
                const cubeColumn = schema!.columns.find( 
                    tableColumn =>
                        tableColumn.name === "mainColor" &&
                        tableColumn.type === "cube" &&
                        !tableColumn.isArray
                );
                expect(cubeColumn).to.not.be.undefined;
                const cubeArrayColumn = schema!.columns.find( 
                    tableColumn =>
                        tableColumn.name === "colors" &&
                        tableColumn.type === "cube" &&
                        tableColumn.isArray
                );
                expect(cubeArrayColumn).to.not.be.undefined;
            })
        ));

    it("should persist cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const qr = connection.createQueryRunner();
                const color = [255, 0, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.mainColor = color;
                const persistedPost = await postRepo.save(qr, post);
                const foundPost = await postRepo.findOne(qr, persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.mainColor).to.deep.equal(color);
                await qr.release();
            })
        ));

    it("should update cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const qr = connection.createQueryRunner();
                const color = [255, 0, 0];
                const color2 = [0, 255, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.mainColor = color;
                const persistedPost = await postRepo.save(qr, post);

                await postRepo.update(qr,
                    { id: persistedPost.id },
                    { mainColor: color2 }
                );

                const foundPost = await postRepo.findOne(qr, persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.mainColor).to.deep.equal(color2);
                await qr.release();
            })
        ));

    it("should re-save cube correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const qr = connection.createQueryRunner();
                const color = [255, 0, 0];
                const color2 = [0, 255, 0];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.mainColor = color;
                const persistedPost = await postRepo.save(qr, post);

                persistedPost.mainColor = color2;
                await postRepo.save(qr, persistedPost);

                const foundPost = await postRepo.findOne(qr, persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.mainColor).to.deep.equal(color2);
                await qr.release();
            })
        ));

    it("should persist cube of arity 0 correctly", () =>
        Promise.all(
            connections.map(async connection => {
                // Get Postgres version because zero-length cubes are not legal
                // on all Postgres versions. Zero-length cubes are only tested
                // to be working on Postgres version >=10.6.
                const qr = connection.createQueryRunner();
                const [{ server_version }] = await connection.query(qr, 
                    "SHOW server_version"
                );
                const semverArray = server_version.split(".").map(Number);
                if (!(semverArray[0] >= 10 && semverArray[1] >= 6)) {
                    return;
                }

                const color: number[] = [];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.mainColor = color;
                const persistedPost = await postRepo.save(qr, post);
                const foundPost = await postRepo.findOne(qr, persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.mainColor).to.deep.equal(color);
                await qr.release();
            })
        ));

    it("should be able to order cube by euclidean distance", () =>
        Promise.all(
            connections.map(async connection => {
                const qr = connection.createQueryRunner();
                const color1 = [255, 0, 0];
                const color2 = [255, 255, 0];
                const color3 = [255, 255, 255];

                const post1 = new Post();
                post1.mainColor = color1;
                const post2 = new Post();
                post2.mainColor = color2;
                const post3 = new Post();
                post3.mainColor = color3;
                await connection.manager.save(qr, [post1, post2, post3]);

                const posts = await connection.manager
                    .createQueryBuilder(Post, "post")
                    .orderBy("\"mainColor\" <-> '(0, 255, 0)'", "DESC")
                    .getMany(qr);

                const postIds = posts.map(post => post.id);
                expect(postIds).to.deep.equal([post1.id, post3.id, post2.id]);
                await qr.release();
            })
        ));

    it("should persist cube array correctly", () =>
        Promise.all(
            connections.map(async connection => {
                const qr = connection.createQueryRunner();
                const colors = [[255, 0, 0], [255, 255, 0]];
                const postRepo = connection.getRepository(Post);
                const post = new Post();
                post.colors = colors;
                const persistedPost = await postRepo.save(qr, post);
                const foundPost = await postRepo.findOne(qr, persistedPost.id);
                expect(foundPost).to.exist;
                expect(foundPost!.colors).to.deep.equal(colors);
                await qr.release();
            })
        ));
});
