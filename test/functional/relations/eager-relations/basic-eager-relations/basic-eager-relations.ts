import "reflect-metadata";
import {Connection} from "../../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../../utils/test-utils";
import {User} from "./entity/User";
import {Profile} from "./entity/Profile";
import {Editor} from "./entity/Editor";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";

describe("relations > eager relations > basic", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    async function prepareData(connection: Connection) {
        const qr = connection.createQueryRunner();
        const profile = new Profile();
        profile.about = "I cut trees!";
        await connection.manager.save(qr, profile);

        const user = new User();
        user.firstName = "Timber";
        user.lastName = "Saw";
        user.profile = profile;
        await connection.manager.save(qr, user);

        const primaryCategory1 = new Category();
        primaryCategory1.name = "primary category #1";
        await connection.manager.save(qr, primaryCategory1);

        const primaryCategory2 = new Category();
        primaryCategory2.name = "primary category #2";
        await connection.manager.save(qr, primaryCategory2);

        const secondaryCategory1 = new Category();
        secondaryCategory1.name = "secondary category #1";
        await connection.manager.save(qr, secondaryCategory1);

        const secondaryCategory2 = new Category();
        secondaryCategory2.name = "secondary category #2";
        await connection.manager.save(qr, secondaryCategory2);

        const post = new Post();
        post.title = "about eager relations";
        post.categories1 = [primaryCategory1, primaryCategory2];
        post.categories2 = [secondaryCategory1, secondaryCategory2];
        post.author = user;
        await connection.manager.save(qr, post);

        const editor = new Editor();
        editor.post = post;
        editor.user = user;
        await connection.manager.save(qr, editor);
        
        await qr.release();
    }

    it("should load all eager relations when object is loaded", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);
        const qr = connection.createQueryRunner();

        const loadedPost = await connection.manager.findOne(qr, Post, 1);
        loadedPost!.should.be.eql({
            id: 1,
            title: "about eager relations",
            categories1: [{
                id: 1,
                name: "primary category #1"
            }, {
                id: 2,
                name: "primary category #2"
            }],
            categories2: [{
                id: 3,
                name: "secondary category #1"
            }, {
                id: 4,
                name: "secondary category #2"
            }],
            author: {
                id: 1,
                firstName: "Timber",
                lastName: "Saw",
                profile: {
                    id: 1,
                    about: "I cut trees!"
                }
            },
            editors: [{
                user: {
                    id: 1,
                    firstName: "Timber",
                    lastName: "Saw",
                    profile: {
                        id: 1,
                        about: "I cut trees!"
                    }
                }
            }]
        });

        await qr.release();
    })));

    it("should not load eager relations when query builder is used", () => Promise.all(connections.map(async connection => {
        await prepareData(connection);
        const qr = connection.createQueryRunner();

        const loadedPost = await connection.manager
            .createQueryBuilder(Post, "post")
            .where("post.id = :id", { id: 1 })
            .getOne(qr);

        loadedPost!.should.be.eql({
            id: 1,
            title: "about eager relations"
        });
        
        await qr.release();
    })));

});
