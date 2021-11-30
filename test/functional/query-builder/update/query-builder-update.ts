import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";
import {LimitOnUpdateNotSupportedError} from "../../../../src/error/LimitOnUpdateNotSupportedError";
import {Photo} from "./entity/Photo";
import {EntityColumnNotFound} from "../../../../src/error/EntityColumnNotFound";
import {UpdateValuesMissingError} from "../../../../src/error/UpdateValuesMissingError";

describe("query builder > update", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform updation correctly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        await connection.createQueryBuilder()
            .update(User)
            .set({ name: "Dima Zotov" })
            .where("name = :name", { name: "Alex Messer" })
            .execute(qr);

        const loadedUser1 = await connection.getRepository(User).findOne(qr, { name: "Dima Zotov" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima Zotov");

        await connection.getRepository(User)
            .createQueryBuilder("myUser")
            .update()
            .set({ name: "Muhammad Mirzoev" })
            .where("name = :name", { name: "Dima Zotov" })
            .execute(qr);

        const loadedUser2 = await connection.getRepository(User).findOne(qr, { name: "Muhammad Mirzoev" });
        expect(loadedUser2).to.exist;
        loadedUser2!.name.should.be.equal("Muhammad Mirzoev");

        await qr.release();
    })));

    it("should be able to use sql functions", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        await connection.createQueryBuilder()
            .update(User)
            .set({ name: () => connection.driver instanceof SqlServerDriver ? "SUBSTRING('Dima Zotov', 1, 4)" : "SUBSTR('Dima Zotov', 1, 4)" })
            .where("name = :name", {
                name: "Alex Messer"
            })
            .execute(qr);


        const loadedUser1 = await connection.getRepository(User).findOne(qr, { name: "Dima" });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima");

        await qr.release();
    })));

    it("should update and escape properly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Dima";
        user.likesCount = 1;

        await connection.manager.save(qr, user);

        const qb = connection.createQueryBuilder();
        await qb
            .update(User)
            .set({ likesCount: () => qb.escape(`likesCount`) + " + 1" })
            // .set({ likesCount: 2 })
            .where("likesCount = 1")
            .execute(qr);

        const loadedUser1 = await connection.getRepository(User).findOne(qr, { likesCount: 2 });
        expect(loadedUser1).to.exist;
        loadedUser1!.name.should.be.equal("Dima");

        await qr.release();
    })));

    it("should update properties inside embeds as well", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        // save few photos
        await connection.manager.save(qr, Photo, {
            url: "1.jpg",
            counters: {
                likes: 2,
                favorites: 1,
                comments: 1,
            }
        });
        await connection.manager.save(qr, Photo, {
            url: "2.jpg",
            counters: {
                likes: 0,
                favorites: 1,
                comments: 1,
            }
        });

        // update photo now
        await connection.getRepository(Photo)
            .createQueryBuilder("photo")
            .update()
            .set({
                counters: {
                    likes: 3
                }
            })
            .where({
                counters: {
                    likes: 2
                }
            })
            .execute(qr);

        const loadedPhoto1 = await connection.getRepository(Photo).findOne(qr, { url: "1.jpg" });
        expect(loadedPhoto1).to.exist;
        loadedPhoto1!.should.be.eql({
            id: 1,
            url: "1.jpg",
            counters: {
                likes: 3,
                favorites: 1,
                comments: 1,
            }
        });

        const loadedPhoto2 = await connection.getRepository(Photo).findOne(qr, { url: "2.jpg" });
        expect(loadedPhoto2).to.exist;
        loadedPhoto2!.should.be.eql({
            id: 2,
            url: "2.jpg",
            counters: {
                likes: 0,
                favorites: 1,
                comments: 1,
            }
        });

        await qr.release();
    })));

    it("should perform update with limit correctly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user1 = new User();
        user1.name = "Alex Messer";
        const user2 = new User();
        user2.name = "Muhammad Mirzoev";
        const user3 = new User();
        user3.name = "Brad Porter";

        await connection.manager.save(qr, [user1, user2, user3]);

        const limitNum = 2;
        const nameToFind = "Dima Zotov";

        if (connection.driver instanceof MysqlDriver) {
            await connection.createQueryBuilder()
            .update(User)
            .set({ name: nameToFind })
            .limit(limitNum)
            .execute(qr);

            const loadedUsers = await connection.getRepository(User).find(qr, { name: nameToFind });
            expect(loadedUsers).to.exist;
            loadedUsers!.length.should.be.equal(limitNum);
        } else {
            await connection.createQueryBuilder()
            .update(User)
            .set({ name: nameToFind })
            .limit(limitNum)
            .execute(qr).should.be.rejectedWith(LimitOnUpdateNotSupportedError);
        }
        
        await qr.release();
    })));

    it("should throw error when update value is missing", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        let error: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .update(User)
                .where("name = :name", { name: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an.instanceof(UpdateValuesMissingError);

        await qr.release();
    })));

    it("should throw error when update value is missing 2", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        let error: Error | undefined;
        try {
            await connection.createQueryBuilder(User, "user")
                .update()
                .where("name = :name", { name: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an.instanceof(UpdateValuesMissingError);

        await qr.release();
    })));

    it("should throw error when update property in set method is unknown", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        let error: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .update(User)
                .set({ unknownProp: true } as any)
                .where("name = :name", { name: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an.instanceof(EntityColumnNotFound);

        await qr.release();
    })));

    it("should throw error when unknown property in where criteria", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        let error: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .update(User)
                .set({ name: "John Doe" } as any)
                .where( { unknownProp: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error = err;
        }
        expect(error).to.be.an.instanceof(EntityColumnNotFound);

        await qr.release();
    })));

});
