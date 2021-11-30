import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Race} from "./entity/Race";

describe("github issues > #300 support of embeddeds that are not set", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("embedded with custom column name should persist and load without errors", () => Promise.all(connections.map(async connection => {

        const race = new Race();
        race.name = "National Race";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, race);

        const loadedRace = await connection.manager.findOne(qr, Race, { name: "National Race" });
        expect(loadedRace).to.exist;
        expect(loadedRace!.id).to.exist;
        loadedRace!.name.should.be.equal("National Race");
        expect(loadedRace!.duration).to.exist;
        expect(loadedRace!.duration.minutes).to.be.null;
        expect(loadedRace!.duration.hours).to.be.null;
        expect(loadedRace!.duration.days).to.be.null;

        await qr.release();
    })));

});
