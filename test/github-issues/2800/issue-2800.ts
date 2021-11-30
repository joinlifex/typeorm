import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Car} from "./entity/Car";
import {Plane} from "./entity/Plane";

describe("github issues > #2800 - Can't override embedded entities in STI implementation", () => {

    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));

    beforeEach(() => reloadTestingDatabases(connections));

    after(() => closeTestingConnections(connections));

    it("should be able to save entity with embedded entities overriding", () => Promise.all(connections.map(async connection => {
        
        const qr = connection.createQueryRunner();
        
        await connection.manager.save(qr, Car, connection.manager.create(qr, Car, {
            engine: {
                horsePower: 42,
                torque: 42
            }
        }));
        await connection.manager.save(qr, Plane, connection.manager.create(qr, Plane, {
            engine: {
                beep: 42,
                boop: 42
            }
        }));
        await qr.release();
    })));

});
