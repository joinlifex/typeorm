import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {expect} from "chai";
import {Test} from "./entity/Test";
import {AmbigiousPrimaryKey} from "./entity/AmbigiousPrimaryKey";

describe("query builder > count", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Test, AmbigiousPrimaryKey],
        schemaCreate: true,
        dropSchema: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("Count query should of empty table should be 0", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);
        const qr = connection.createQueryRunner();
            
        const count = await repo.count(qr);
        expect(count).to.be.equal(0);
        
        await qr.release();
    })));

    it("Count query should count database values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);
        const qr = connection.createQueryRunner();
            
        await repo.save(qr, { varcharField: "ok", uuidField: "123e4567-e89b-12d3-a456-426614174000", intField: 4});
        await repo.save(qr, { varcharField: "ok", uuidField: "123e4567-e89b-12d3-a456-426614174001", intField: 4});

        const count = await repo.count(qr);
        expect(count).to.be.equal(2);
        
        await qr.release();
    })));

    it("Count query should handle ambiguous values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(AmbigiousPrimaryKey);
        const qr = connection.createQueryRunner();
            
        await repo.save(qr, { a: "A", b: "AAA" });
        await repo.save(qr, { a: "AAA", b: "A" });
        await repo.save(qr, { a: "AA", b: "AA" });
        await repo.save(qr, { a: "BB", b: "BB" });
        await repo.save(qr, { a: "B", b: "BBB" });
        await repo.save(qr, { a: "BBB", b: "B" });

        const count = await repo.count(qr);
        expect(count).to.be.equal(6, connection.name);
        
        await qr.release();
    })));

    it("counting joined query should count database values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Test);
        const qr = connection.createQueryRunner();
            
        await repo.save(qr, { varcharField: "ok", uuidField: "123e4567-e89b-12d3-a456-426614174000", intField: 4});
        await repo.save(qr, { varcharField: "ok", uuidField: "123e4567-e89b-12d3-a456-426614174001", intField: 4});

        const count = await repo.createQueryBuilder()
            .from(Test, "main")
            .leftJoin(Test, "self", "self.intField = main.intField")
            .getCount(qr);

        expect(count).to.be.equal(2);
        
        await qr.release();
    })));

    it("counting joined queries should handle ambiguous values", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(AmbigiousPrimaryKey);
        const qr = connection.createQueryRunner();
            
        await repo.save(qr, { a: "A", b: "AAA" });
        await repo.save(qr, { a: "AAA", b: "A" });
        await repo.save(qr, { a: "AA", b: "AA" });
        await repo.save(qr, { a: "BB", b: "BB" });
        await repo.save(qr, { a: "B", b: "BBB" });
        await repo.save(qr, { a: "BBB", b: "B" });

        const count = await repo.createQueryBuilder()
            .from(AmbigiousPrimaryKey, "main")
            .leftJoin(AmbigiousPrimaryKey, "self", "self.a = main.a")
            .getCount(qr);

        expect(count).to.be.equal(6, connection.name);
        
        await qr.release();
    })));

});
