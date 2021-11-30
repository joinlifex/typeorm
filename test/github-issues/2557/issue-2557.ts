import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Dummy} from "./entity/dummy";
import {transformer, WrappedNumber} from "./transformer";

describe("github issues > #2557 object looses its prototype before transformer.to()", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should give correct object in transformer.to", () => Promise.all(connections.map(async connection => {
        const dummy = new Dummy();
        dummy.id = 1;
        dummy.num = new WrappedNumber(3);
        const qr = connection.createQueryRunner();

        await connection.getRepository(Dummy).save(qr, dummy);

        expect(transformer.lastValue).to.be.instanceOf(WrappedNumber);
        await qr.release();
    })));

    // you can add additional tests if needed

});
