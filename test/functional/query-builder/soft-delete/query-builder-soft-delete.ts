import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {LimitOnUpdateNotSupportedError} from "../../../../src/error/LimitOnUpdateNotSupportedError";
import {Not, IsNull} from "../../../../src";
import {MissingDeleteDateColumnError} from "../../../../src/error/MissingDeleteDateColumnError";
import {UserWithoutDeleteDateColumn} from "./entity/UserWithoutDeleteDateColumn";
import {Photo} from "./entity/Photo";

describe("query builder > soft-delete", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should perform soft deletion and recovery correctly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new User();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        await connection
            .createQueryBuilder()
            .softDelete()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute(qr);

        const loadedUser1 = await connection.getRepository(User).findOne(qr, 
            { name: "Alex Messer" },
            { withDeleted: true }
        );
        expect(loadedUser1).to.exist;
        expect(loadedUser1!.deletedAt).to.be.instanceof(Date);

        await connection.getRepository(User)
            .createQueryBuilder()
            .restore()
            .from(User)
            .where("name = :name", { name: "Alex Messer" })
            .execute(qr);

        const loadedUser2 = await connection.getRepository(User).findOne(qr, { name: "Alex Messer" });
        expect(loadedUser2).to.exist;
        expect(loadedUser2!.deletedAt).to.be.equals(null);

        await qr.release();
    })));

    it("should soft-delete and restore properties inside embeds as well", () => Promise.all(connections.map(async connection => {

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

        // soft-delete photo now
        await connection.getRepository(Photo)
            .createQueryBuilder("photo")
            .softDelete()
            .where({
                counters: {
                    likes: 2
                }
            })
            .execute(qr);
        
        const loadedPhoto1 = await connection.getRepository(Photo).findOne(qr, { url: "1.jpg" });
        expect(loadedPhoto1).to.be.undefined;

        const loadedPhoto2 = await connection.getRepository(Photo).findOne(qr, { url: "2.jpg" });
        loadedPhoto2!.should.be.eql({
            id: 2,
            url: "2.jpg",
            deletedAt: null,
            counters: {
                likes: 0,
                favorites: 1,
                comments: 1,
                deletedAt: null
            }
        });

        // restore photo now
        await connection.getRepository(Photo)
        .createQueryBuilder("photo")
        .restore()
        .where({
            counters: {
                likes: 2
            }
        })
        .execute(qr);

        const restoredPhoto2 = await connection.getRepository(Photo).findOne(qr, { url: "1.jpg" });
        restoredPhoto2!.should.be.eql({
            id: 1,
            url: "1.jpg",
            deletedAt: null,
            counters: {
                likes: 2,
                favorites: 1,
                comments: 1,
                deletedAt: null
            }
        });
        
        await qr.release();
    })));

    it("should perform soft delete with limit correctly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user1 = new User();
        user1.name = "Alex Messer";
        const user2 = new User();
        user2.name = "Muhammad Mirzoev";
        const user3 = new User();
        user3.name = "Brad Porter";

        await connection.manager.save(qr, [user1, user2, user3]);

        const limitNum = 2;

        if (connection.driver instanceof MysqlDriver) {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .limit(limitNum)
            .execute(qr);

            const loadedUsers = await connection.getRepository(User).find(qr, {
                where: {
                    deletedAt: Not(IsNull())
                },
                withDeleted: true
            });
            expect(loadedUsers).to.exist;
            loadedUsers!.length.should.be.equal(limitNum);
        } else {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .limit(limitNum)
            .execute(qr).should.be.rejectedWith(LimitOnUpdateNotSupportedError);
        }

        await qr.release();
    })));


    it("should perform restory with limit correctly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user1 = new User();
        user1.name = "Alex Messer";
        const user2 = new User();
        user2.name = "Muhammad Mirzoev";
        const user3 = new User();
        user3.name = "Brad Porter";

        await connection.manager.save(qr, [user1, user2, user3]);

        const limitNum = 2;

        if (connection.driver instanceof MysqlDriver) {
            await connection.createQueryBuilder()
            .softDelete()
            .from(User)
            .execute(qr);

            await connection.createQueryBuilder()
            .restore()
            .from(User)
            .limit(limitNum)
            .execute(qr);

            const loadedUsers = await connection.getRepository(User).find(qr);
            expect(loadedUsers).to.exist;
            loadedUsers!.length.should.be.equal(limitNum);
        } else {
            await connection.createQueryBuilder()
            .restore()
            .from(User)
            .limit(limitNum)
            .execute(qr).should.be.rejectedWith(LimitOnUpdateNotSupportedError);
        }

        await qr.release();
    })));

    it("should throw error when delete date column is missing", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user = new UserWithoutDeleteDateColumn();
        user.name = "Alex Messer";

        await connection.manager.save(qr, user);

        let error1: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .softDelete()
                .from(UserWithoutDeleteDateColumn)
                .where("name = :name", { name: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error1 = err;
        }
        expect(error1).to.be.an.instanceof(MissingDeleteDateColumnError);

        let error2: Error | undefined;
        try {
            await connection.createQueryBuilder()
                .restore()
                .from(UserWithoutDeleteDateColumn)
                .where("name = :name", { name: "Alex Messer" })
                .execute(qr);
        } catch (err) {
            error2 = err;
        }
        expect(error2).to.be.an.instanceof(MissingDeleteDateColumnError);

        await qr.release();
    })));

    it("should find with soft deleted relations", () => Promise.all(connections.map(async connection => {
        const photoRepository = connection.getRepository(Photo);
        const userRepository = connection.getRepository(User);
        const qr = connection.createQueryRunner();
          
        const photo1 = new Photo();
        photo1.url = "image-1.jpg";

        const photo2 = new Photo();
        photo2.url = "image-2.jpg";

        const user1 = new User();
        user1.name = "user-1";
        user1.picture = photo1;

        const user2 = new User();
        user2.name = "user-2";
        user2.picture = photo2;

        await photoRepository.save(qr, photo1);
        await photoRepository.save(qr, photo2);
        await userRepository.save(qr, user1);
        await userRepository.save(qr, user2);

        const users = await userRepository.find(qr, {
            relations: ["picture"]
        });

        expect(users[0].picture.deletedAt).to.equal(null);
        expect(users[1].picture.deletedAt).to.equal(null);

        await photoRepository.softDelete(qr, photo1);

        const usersWithSoftDelete = await userRepository.find(qr, {
            withDeleted: true,
            relations: ["picture"]
        });

        expect(usersWithSoftDelete[0].picture.deletedAt).to.not.equal(null);
        expect(usersWithSoftDelete[1].picture.deletedAt).to.equal(null);
        
        await qr.release();
    })));
});