import "reflect-metadata";
import chai from "chai";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {PostgresDriver} from "../../../src/driver/postgres/PostgresDriver";
import {User} from "./entity/User";

describe("github issues > #2067 Unhandled promise rejection warning on postgres connection issues", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        enabledDrivers: ["postgres"],
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return a catchable error on connection errors in queries", () => Promise.all(connections.map(async connection => {
        const connectionFailureMessage = "Test error to simulate a connection error";

        if (connection.driver instanceof PostgresDriver) {
          connection.driver.obtainMasterConnection = () => Promise.reject<any>(new Error(connectionFailureMessage));
          connection.driver.obtainSlaveConnection = () => Promise.reject<any>(new Error(connectionFailureMessage));
        }

        const qr = connection.createQueryRunner();
        const repository = connection.getRepository(User);
        await chai.expect(repository.find(qr)).to.eventually.rejectedWith(Error, connectionFailureMessage);
        await qr.release();
    })));

});