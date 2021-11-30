import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases, sleep} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {Category} from "./entity/Category";
import {Post} from "./entity/Post";
import {Photo} from "./entity/Photo";
import sinon from "sinon";

describe("repository > find options", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should load relations", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        const user = new User();
        user.name = "Alex Messer";
        await connection.manager.save(qr, user);

        const category = new Category();
        category.name = "Boys";
        await connection.manager.save(qr, category);

        const post = new Post();
        post.title = "About Alex Messer";
        post.author = user;
        post.categories = [category];
        await connection.manager.save(qr, post);

        const loadedPost = await connection.getRepository(Post).findOne(qr, {
            relations: ["author", "categories"]
        });
        expect(loadedPost).to.be.eql({
            id: 1,
            title: "About Alex Messer",
            author: {
                id: 1,
                name: "Alex Messer"
            },
            categories: [{
                id: 1,
                name: "Boys"
            }]
        });
        
        await qr.release();
    })));

    it("should execute select query inside transaction", () => Promise.all(connections.map(async connection => {

        const queryRunner = await connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";
        await connection.manager.save(queryRunner, user);



        const startTransactionFn = sinon.spy(queryRunner, "startTransaction");
        const commitTransactionFn = sinon.spy(queryRunner, "commitTransaction");

        expect(startTransactionFn.called).to.be.false;
        expect(commitTransactionFn.called).to.be.false;

        await connection
            .createEntityManager()
            .getRepository(User)
            .findOne(queryRunner, 1, {
                transaction: true
            });

        expect(startTransactionFn.calledOnce).to.be.true;
        expect(commitTransactionFn.calledOnce).to.be.true;

        await queryRunner.release();

    })));

    it("should select specific columns", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        const category = new Category();
        category.name = "Bears";
        await connection.manager.save(qr, category);

        const categories = [category];
        const photos = [];
        for (let i = 1; i < 10; i++) {
            const photo = new Photo();
            photo.name = `Me and Bears ${i}`;
            photo.description = `I am near bears ${i}`;
            photo.filename = `photo-with-bears-${i}.jpg`;
            photo.views = 10;
            photo.isPublished = false;
            photo.categories = categories;
            photos.push(photo);
            await connection.manager.save(qr, photo);
        }

        const loadedPhoto = await connection.getRepository(Photo).findOne(qr, {
            select: ["name"],
            where: {
                id: 5
            }
        });

        const loadedPhotos1 = await connection.getRepository(Photo).find(qr, {
            select: ["filename", "views"],
        });

        const loadedPhotos2 = await connection.getRepository(Photo).find(qr, {
            select: ["id", "name", "description"],
            relations: ["categories"],
        });

        // const loadedPhotos3 = await connection.getRepository(Photo).createQueryBuilder("photo")
        //     .select(["photo.name", "photo.description"])
        //     .addSelect(["category.name"])
        //     .leftJoin("photo.categories", "category")
        //     .getMany(qr);

        expect(loadedPhoto).to.be.eql({
            name: "Me and Bears 5"
        });

        expect(loadedPhotos1).to.have.deep.members(photos.map(photo => ({
            filename: photo.filename,
            views: photo.views,
        })));

        expect(loadedPhotos2).to.have.deep.members(photos.map(photo => ({
            id: photo.id,
            name: photo.name,
            description: photo.description,
            categories,
        })));

        // expect(loadedPhotos3).to.have.deep.members(photos.map(photo => ({
        //     name: photo.name,
        //     description: photo.description,
        //     categories: categories.map(category => ({
        //         name: category.name,
        //     })),
        // })));
        await qr.release();
    })));

    it("should select by given conditions", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        const category1 = new Category();
        category1.name = "Bears";
        await connection.manager.save(qr, category1);

        const category2 = new Category();
        category2.name = "Dogs";
        await connection.manager.save(qr, category2);

        const category3 = new Category();
        category3.name = "Cats";
        await connection.manager.save(qr, category3);

        const loadedCategories1 = await connection.getRepository(Category).find(qr, {
            where: {
                name: "Bears"
            }
        });

        expect(loadedCategories1).to.be.eql([{
            id: 1,
            name: "Bears"
        }]);

        const loadedCategories2 = await connection.getRepository(Category).find(qr, {
            where: [{
                name: "Bears"
            }, {
                name: "Cats"
            }]
        });

        expect(loadedCategories2).to.be.eql([{
            id: 1,
            name: "Bears"
        }, {
            id: 3,
            name: "Cats"
        }]);

        await qr.release();
    })));

});


describe("repository > find options > cache", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        cache: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("repository should cache results properly", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // first prepare data - insert users
        const user1 = new User();
        user1.name = "Harry";
        await connection.manager.save(qr, user1);

        const user2 = new User();
        user2.name = "Ron";
        await connection.manager.save(qr, user2);

        const user3 = new User();
        user3.name = "Hermione";
        await connection.manager.save(qr, user3);

        // select for the first time with caching enabled
        const users1 = await connection.getRepository(User)
            .find(qr, {cache: true});

        expect(users1.length).to.be.equal(3);

        // insert new entity
        const user4 = new User();
        user4.name = "Ginny";
        await connection.manager.save(qr, user4);

        // without cache it must return really how many there entities are
        const users2 = await connection.getRepository(User).find(qr);

        expect(users2.length).to.be.equal(4);

        // but with cache enabled it must not return newly inserted entity since cache is not expired yet
        const users3 = await connection.getRepository(User)
            .find(qr, {cache: true});
        expect(users3.length).to.be.equal(3);

        // give some time for cache to expire
        await sleep(1000);

        // now, when our cache has expired we check if we have new user inserted even with cache enabled
        const users4 = await connection.getRepository(User)
            .find(qr, {cache: true});
        expect(users4.length).to.be.equal(4);

        await qr.release();
    })));
});
