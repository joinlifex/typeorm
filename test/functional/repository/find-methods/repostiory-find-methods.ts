import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {User} from "./model/User";
import {EntityNotFoundError} from "../../../../src/error/EntityNotFoundError";
import {UserEntity} from "./schema/UserEntity";

describe("repository > find methods", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Post, UserEntity],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("count", function () {
        it("should return a full count when no criteria given", () => Promise.all(connections.map(async connection => {
            const postRepository            = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const post        = new Post();
                post.id           = i;
                post.title        = "post #" + i;
                post.categoryName = "other";
                await postRepository.save(qr, post);
            }

            // check count method
            const count = await postRepository.count(qr, { order: { id: "ASC" }});
            count.should.be.equal(100);
            await qr.release();
        })));

        it("should return a count of posts that match given criteria", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();
            for (let i = 1; i <= 100; i++) {
                const post        = new Post();
                post.id           = i;
                post.title        = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check count method
            const count = await postRepository.count(qr, {
                where: { categoryName: "odd" },
                order: { id: "ASC" }
            });
            count.should.be.equal(50);
            await qr.release();
        })));

        it("should return a count of posts that match given multiple criteria", () => Promise.all(connections.map(async connection => {
            const postRepository            = connection.getRepository(Post);
            const qr = connection.createQueryRunner();
            for (let i = 1; i <= 100; i++) {
                const post        = new Post();
                post.id           = i;
                post.title        = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                post.isNew        = i > 90;
                await postRepository.save(qr, post);
            }

            // check count method
            const count = await postRepository.count(qr, {
                where: { categoryName: "odd", isNew: true },
                order: { id: "ASC" }
            });
            count.should.be.equal(5);
            await qr.release();
        })));

        it("should return a count of posts that match given find options", () => Promise.all(connections.map(async connection => {
            const postRepository            = connection.getRepository(Post);
            const qr = connection.createQueryRunner();
            for (let i = 1; i <= 100; i++) {
                const post        = new Post();
                post.id           = i;
                post.isNew        = i > 90;
                post.title        = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check count method
            const count = await postRepository.count(qr);
            count.should.be.equal(100);
            await qr.release();
        })));

        it("should return a count of posts that match both criteria and find options", () => Promise.all(connections.map(async connection => {
            const postRepository            = connection.getRepository(Post);
            const qr = connection.createQueryRunner();
            for (let i = 1; i <= 100; i++) {
                const post        = new Post();
                post.id           = i;
                post.isNew        = i > 90;
                post.title        = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check count method
            const count = await postRepository.count(qr, {
                where: { categoryName: "even", isNew: true },
                skip: 1,
                take:  2,
                order: { id: "ASC" }
            });
            count.should.be.equal(5);
            await qr.release();
        })));
        
    });

    describe("find and findAndCount", function() {

        it("should return everything when no criteria given", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = "other";
                await postRepository.save(qr, post);
            }

            // check find method
            const loadedPosts = await postRepository.find(qr, { order: { id: "ASC" }});
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(100);
            loadedPosts[0].id.should.be.equal(0);
            loadedPosts[0].title.should.be.equal("post #0");
            loadedPosts[99].id.should.be.equal(99);
            loadedPosts[99].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount(qr, { order: { id: "ASC" }});
            count.should.be.equal(100);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(100);
            loadedPosts2[0].id.should.be.equal(0);
            loadedPosts2[0].title.should.be.equal("post #0");
            loadedPosts2[99].id.should.be.equal(99);
            loadedPosts2[99].title.should.be.equal("post #99");
            await qr.release();
        })));

        it("should return posts that match given criteria", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check find method
            const loadedPosts = await postRepository.find(qr, {
                where: { categoryName: "odd" },
                order: { id: "ASC" }
            });
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(50);
            loadedPosts[0].id.should.be.equal(1);
            loadedPosts[0].title.should.be.equal("post #1");
            loadedPosts[49].id.should.be.equal(99);
            loadedPosts[49].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount(qr, {
                where: { categoryName: "odd" },
                order: { id: "ASC" }
            });
            count.should.be.equal(50);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(50);
            loadedPosts2[0].id.should.be.equal(1);
            loadedPosts2[0].title.should.be.equal("post #1");
            loadedPosts2[49].id.should.be.equal(99);
            loadedPosts2[49].title.should.be.equal("post #99");
            await qr.release();
        })));

        it("should return posts that match given multiple criteria", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.title = "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                post.isNew = i > 90;
                await postRepository.save(qr, post);
            }

            // check find method
            const loadedPosts = await postRepository.find(qr, {
                where: { categoryName: "odd", isNew: true },
                order: { id: "ASC" }
            });
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(5);
            loadedPosts[0].id.should.be.equal(91);
            loadedPosts[0].title.should.be.equal("post #91");
            loadedPosts[4].id.should.be.equal(99);
            loadedPosts[4].title.should.be.equal("post #99");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount(qr, {
                where: { categoryName: "odd", isNew: true },
                order: { id: "ASC" }
            });
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(5);
            loadedPosts2[0].id.should.be.equal(91);
            loadedPosts2[0].title.should.be.equal("post #91");
            loadedPosts2[4].id.should.be.equal(99);
            loadedPosts2[4].title.should.be.equal("post #99");
            await qr.release();
        })));

        it("should return posts that match given find options", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.isNew = i > 90;
                post.title = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check find method
            const loadedPosts = await postRepository.createQueryBuilder("post")
                .where("post.title LIKE :likeTitle AND post.categoryName = :categoryName")
                .setParameters({
                    likeTitle: "new post #%",
                    categoryName: "even"
                })
                .orderBy("post.id", "ASC")
                .getMany(qr);
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(5);
            loadedPosts[0].id.should.be.equal(92);
            loadedPosts[0].title.should.be.equal("new post #92");
            loadedPosts[4].id.should.be.equal(100);
            loadedPosts[4].title.should.be.equal("new post #100");

            // check findAndCount method
            const [loadedPosts2, count] = await postRepository.createQueryBuilder("post")
                .where("post.title LIKE :likeTitle AND post.categoryName = :categoryName")
                .setParameters({
                    likeTitle: "new post #%",
                    categoryName: "even"
                })
                .orderBy("post.id", "ASC")
                .getManyAndCount(qr);
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(5);
            loadedPosts2[0].id.should.be.equal(92);
            loadedPosts2[0].title.should.be.equal("new post #92");
            loadedPosts2[4].id.should.be.equal(100);
            loadedPosts2[4].title.should.be.equal("new post #100");
            await qr.release();
        })));

        it("should return posts that match both criteria and find options", () => Promise.all(connections.map(async connection => {
            const postRepository = connection.getRepository(Post);
            const qr = connection.createQueryRunner();

            for (let i = 1; i <= 100; i++) {
                const post = new Post();
                post.id = i;
                post.isNew = i > 90;
                post.title = post.isNew ? "new post #" + i : "post #" + i;
                post.categoryName = i % 2 === 0 ? "even" : "odd";
                await postRepository.save(qr, post);
            }

            // check find method
            const loadedPosts = await postRepository.find(qr, {
                where: {
                    categoryName: "even",
                    isNew: true
                },
                skip: 1,
                take: 2,
                order: {
                    id: "ASC"
                }
            });
            loadedPosts.should.be.instanceOf(Array);
            loadedPosts.length.should.be.equal(2);
            loadedPosts[0].id.should.be.equal(94);
            loadedPosts[0].title.should.be.equal("new post #94");
            loadedPosts[1].id.should.be.equal(96);
            loadedPosts[1].title.should.be.equal("new post #96");

            // check findAndCount method
            let [loadedPosts2, count] = await postRepository.findAndCount(qr, {
                where: {
                    categoryName: "even",
                    isNew: true
                },
                skip: 1,
                take: 2,
                order: {
                    id: "ASC"
                }
            });
            count.should.be.equal(5);
            loadedPosts2.should.be.instanceOf(Array);
            loadedPosts2.length.should.be.equal(2);
            loadedPosts2[0].id.should.be.equal(94);
            loadedPosts2[0].title.should.be.equal("new post #94");
            loadedPosts2[1].id.should.be.equal(96);
            loadedPosts2[1].title.should.be.equal("new post #96");
            await qr.release();
        })));

    });

    describe("findOne", function() {

        it("should return first when no criteria given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            const loadedUser = (await userRepository.findOne(qr, { order: { id: "ASC" }}))!;
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");
            await qr.release();
        })));

        it("should return when criteria given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            const loadedUser = (await userRepository.findOne(qr, { where: { firstName: "name #1" }, order: { id: "ASC" } }))!;
            loadedUser.id.should.be.equal(1);
            loadedUser.firstName.should.be.equal("name #1");
            loadedUser.secondName.should.be.equal("Doe");
            await qr.release();
        })));

        it("should return when find options given", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            const loadedUser = await userRepository.findOne(qr, {
                where: {
                    firstName: "name #99",
                    secondName: "Doe"
                },
                order: {
                    id: "ASC"
                }
            });
            loadedUser!.id.should.be.equal(99);
            loadedUser!.firstName.should.be.equal("name #99");
            loadedUser!.secondName.should.be.equal("Doe");
            await qr.release();
        })));

    });

    describe("findOne", function() {

        it("should return entity by a given id", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            let loadedUser = (await userRepository.findOne(qr, 0))!;
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = (await userRepository.findOne(qr, 1))!;
            loadedUser.id.should.be.equal(1);
            loadedUser.firstName.should.be.equal("name #1");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = (await userRepository.findOne(qr, 99))!;
            loadedUser.id.should.be.equal(99);
            loadedUser.firstName.should.be.equal("name #99");
            loadedUser.secondName.should.be.equal("Doe");
            await qr.release();
        })));

        it("should return entity by a given id and find options", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            let loadedUser = await userRepository.findOne(qr, 0, {
                where: {
                    secondName: "Doe"
                }
            });
            loadedUser!.id.should.be.equal(0);
            loadedUser!.firstName.should.be.equal("name #0");
            loadedUser!.secondName.should.be.equal("Doe");

            loadedUser = await userRepository.findOne(qr, 1, {
                where: {
                    secondName: "Dorian"
                }
            });
            expect(loadedUser).to.be.undefined;
            await qr.release();
        })));

    });

    describe("findByIds", function() {

        it("should return entities by given ids", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            const users = [1, 2, 3, 4, 5].map(id => {
                return {
                    id,
                    firstName: `name #${id}`,
                    secondName: "Doe"
                };
            });

            const savedUsers = await userRepository.save(qr, users);
            savedUsers.length.should.be.equal(users.length); // check if they all are saved

            const loadIds = [1, 2, 4];
            const loadedUsers = (await userRepository.findByIds(qr, loadIds))!;

            loadedUsers.map(user => user.id).should.be.eql(loadIds);
            await qr.release();
        })));

    });

    describe("findOneOrFail", function() {

        it("should return entity by a given id", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            let loadedUser = (await userRepository.findOneOrFail(qr, 0))!;
            loadedUser.id.should.be.equal(0);
            loadedUser.firstName.should.be.equal("name #0");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = (await userRepository.findOneOrFail(qr, 1))!;
            loadedUser.id.should.be.equal(1);
            loadedUser.firstName.should.be.equal("name #1");
            loadedUser.secondName.should.be.equal("Doe");

            loadedUser = (await userRepository.findOneOrFail(qr, 99))!;
            loadedUser.id.should.be.equal(99);
            loadedUser.firstName.should.be.equal("name #99");
            loadedUser.secondName.should.be.equal("Doe");
            await qr.release();
        })));

        it("should return entity by a given id and find options", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            let loadedUser = await userRepository.findOneOrFail(qr, 0, {
                where: {
                    secondName: "Doe"
                }
            });
            loadedUser!.id.should.be.equal(0);
            loadedUser!.firstName.should.be.equal("name #0");
            loadedUser!.secondName.should.be.equal("Doe");

            await userRepository.findOneOrFail(qr, 1, {
                where: {
                    secondName: "Dorian"
                }
            }).should.eventually.be.rejectedWith(EntityNotFoundError);
            await qr.release();
        })));

        it("should throw an error if nothing was found", () => Promise.all(connections.map(async connection => {
            const userRepository = connection.getRepository<User>("User");
            const qr = connection.createQueryRunner();

            for (let i = 0; i < 100; i++) {
                const user: User = {
                    id: i,
                    firstName: "name #" + i,
                    secondName: "Doe"
                };
                await userRepository.save(qr, user);
            }

            await userRepository.findOneOrFail(qr, 100).should.eventually.be.rejectedWith(EntityNotFoundError);
            await qr.release();
        })));
    });

});
