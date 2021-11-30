import "reflect-metadata";
import {expect} from "chai";
import {Post} from "./entity/Post";
import {Connection} from "../../../src/connection/Connection";
import {createTestingConnections} from "../../utils/test-utils";

describe("sqljs driver > autosave", () => {
    let connections: Connection[];
    let saves = 0;
    const callback = (database: Uint8Array) => {
        saves++;
    };

    before(async () => connections = await createTestingConnections({
        entities: [Post],
        schemaCreate: true,
        enabledDrivers: ["sqljs"],
        driverSpecific: {
            autoSaveCallback: callback,
            autoSave: true
        }
    }));

    it("should call autoSaveCallback on insert, update and delete", () => Promise.all(connections.map(async connection => {
        let posts = [
            {
                title: "second post"
            },
            {
                title: "third post"
            }
        ];
        const qr = connection.createQueryRunner();

        await connection.createQueryBuilder().insert().into(Post).values(posts).execute(qr);
        await connection.createQueryBuilder().update(Post).set({title: "Many posts"}).execute(qr);
        await connection.createQueryBuilder().delete().from(Post).where("title = ?", {title: "third post"}).execute(qr);
        
        const repository = connection.getRepository(Post);
        let post = new Post();
        post.title = "A post";
        await repository.save(qr, post);

        let savedPost = await repository.findOne(qr, {title: "A post"});

        expect(savedPost).not.to.be.undefined;

        if (savedPost) {
            savedPost.title = "A updated post";
            await repository.save(qr, savedPost);
            await repository.remove(qr, savedPost);
        }

        await connection.close();

        expect(saves).to.be.equal(7);
        await qr.release();
    })));
});

describe("sqljs driver > autosave off", () => {
    let connections: Connection[];
    let saves = 0;
    const callback = (database: Uint8Array) => {
        saves++;
    };

    before(async () => connections = await createTestingConnections({
        entities: [Post],
        schemaCreate: true,
        enabledDrivers: ["sqljs"],
        driverSpecific: {
            autoSaveCallback: callback,
            autoSave: false
        }
    }));

    it("should not call autoSaveCallback when autoSave is disabled", () => Promise.all(connections.map(async connection => {
        const repository = connection.getRepository(Post);
        const qr = connection.createQueryRunner();
        let post = new Post();
        post.title = "A post";
        await repository.save(qr, post);

        let savedPost = await repository.findOne(qr, {title: "A post"});

        expect(savedPost).not.to.be.undefined;

        if (savedPost) {
            savedPost.title = "A updated post";
            await repository.save(qr, savedPost);
            await repository.remove(qr, savedPost);
        }
        await qr.release();

        await connection.close();

        expect(saves).to.be.equal(0);
    })));
});