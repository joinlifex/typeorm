import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {assert} from "chai";
import {User} from "./entity/User";
import {TournamentUserParticipant} from "./entity/TournamentUserParticipant";
import {TournamentSquadParticipant} from "./entity/TournamentSquadParticipant";

describe("github issues > #1972 STI problem - empty columns", () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));

    it("should insert with userId", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        // create user
        const user = new User({
            name: "test",
        });
        await connection.manager.save(qr, user);

        // create user participant
        const tournamentUserParticipant = new TournamentUserParticipant({
            user,
        });
        await connection.manager.save(qr, tournamentUserParticipant);

        // find user participant in the DB
        const result = await connection.manager.findOne(qr, TournamentUserParticipant);
        if (result) {
            assert(result.user instanceof User);
        }
        await qr.release();
    })));

    it("should insert with ownerId", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        // create user
        const user = new User({
            name: "test",
        });
        await connection.manager.save(qr, user);

        // create tournament squad participant
        const tournamentSquadParticipant = new TournamentSquadParticipant({
            users: [ user ],
            owner: user,
        });
        await connection.manager.save(qr, tournamentSquadParticipant);

        // find squad participant in the DB
        const result = await connection.manager.findOne(qr, TournamentSquadParticipant);

        if (result) {
            assert(result.owner instanceof User);
        }
        await qr.release();
    })));
});
