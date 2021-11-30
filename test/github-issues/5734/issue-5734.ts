import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #5734 insert([]) should not crash", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not crash on insert([])", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const repository = connection.getRepository(Post);
        await repository.insert(qr, []);
        await qr.release();
    })));

    it("should still work with a nonempty array", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const repository = connection.getRepository(Post);
        await repository.insert(qr, [new Post(1)]);
        await repository.findOneOrFail(qr, {where: {id: 1}});
        await qr.release();
    })));
});
