import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Player} from "./entity/Player";
import {Group} from "./entity/Group";

describe("github issues > #401 special keywords should be escaped in join queries", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should escape 'group' keyword properly", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const group = new Group();
        group.name = "about players";
        await connection.manager.save(qr, group);

        const player = new Player();
        player.email = "player@gmail.com";
        player.group = group;
        await connection.manager.save(qr, player);

        const loadedPlayer = await connection
            .getRepository(Player)
            .createQueryBuilder("player")
            .leftJoinAndSelect("player.group", "group")
            .where("player.email = :email", { email: "player@gmail.com" })
            .getOne(qr);

        expect(loadedPlayer).to.be.eql({
            email: "player@gmail.com",
            group: {
                id: 1,
                name: "about players"
            }
        });
        await qr.release();
    })));

});
