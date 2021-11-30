import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";

describe("github issues > #6699 MaxListenersExceededWarning occurs on Postgres", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [],
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("queries in a transaction do not cause an EventEmitter memory leak", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.transaction(qr, async queryRunner => {
            const queryPromises = [...Array(10)].map(
                () => queryRunner.manager.query(queryRunner, "SELECT pg_sleep(0.0001)")
            );

            const pgConnection = await queryRunner.connect();

            expect(pgConnection.listenerCount("error")).to.equal(1);

            // Wait for all of the queries to finish and drain the backlog
            await Promise.all(queryPromises);
        });
        await qr.release();
    })));

});
