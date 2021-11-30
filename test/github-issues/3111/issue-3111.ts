import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {InsertValuesMissingError} from "../../../src/error/InsertValuesMissingError";
import {Test, DEFAULT_VALUE} from "./entity/Test";

describe("github issues > #3111 Inserting with query builder attempts to insert a default row when values is empty array", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not insert with default values on .values([])", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const repo = connection.getRepository(Test);
        await repo.createQueryBuilder().insert().values([]).execute(qr);
        const rowsWithDefaultValue = await repo.find(qr, { where: {value: DEFAULT_VALUE}});
        expect(rowsWithDefaultValue).to.have.lengthOf(0);
        await qr.release();
    })));

    it("should still error on missing .values()", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);
        const qr = connection.createQueryRunner();
        await repo.createQueryBuilder().insert().execute(qr).should.be.rejectedWith(InsertValuesMissingError);
        await qr.release();
    })));
});
