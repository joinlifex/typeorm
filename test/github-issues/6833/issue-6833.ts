import "reflect-metadata";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { JSONBKeyTest } from "./entity/test";

describe("github issues > #6833 Entities with JSON key columns are incorrectly grouped", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [JSONBKeyTest],
        dropSchema: true,
        schemaCreate: true,
        enabledDrivers: ["postgres"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("jsonB keys are correctly resolved", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.transaction(qr, async queryRunner => {
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 1, second: 2 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 1, second: 3 } }));

            const entities = await queryRunner.manager.createQueryBuilder(JSONBKeyTest, "json_test").select().getMany(qr);
            expect(entities.length).to.equal(2);
        });
        await qr.release();
    })));

    it("jsonB keys can be found", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.transaction(qr, async queryRunner => {
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 3, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 4, second: 3 } }));

            const entities = await queryRunner.manager.find(queryRunner, JSONBKeyTest, { where: { id: { first: 3, second: 3 } } } );
            expect(entities.length).to.equal(1);
            expect(entities[0].id).to.deep.equal({ first: 3, second: 3 });
        });
        await qr.release();
    })));

    it("jsonB keys can be found with IN", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.transaction(qr, async queryRunner => {
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 3, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 4, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 5, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 6, second: 4 } }));

            const entities = await queryRunner.manager
                .createQueryBuilder(JSONBKeyTest, "json_test")
                .select()
                .where("id IN (:...ids)", { ids: [{first: 5, second: 3}, {first: 6, second: 4}]})
                .getMany(qr);
            expect(entities.length).to.equal(2);
            expect(entities[0].id).to.deep.equal({ first: 5, second: 3 });
            expect(entities[1].id).to.deep.equal({ first: 6, second: 4 });
        });
        await qr.release();
    })));

    it("jsonB keys can be found regardless of order", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.transaction(qr, async queryRunner => {
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 3, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 4, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 5, second: 3 } }));
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: { first: 6, second: 4 } }));


            const payload = { second: 2, first: 1 };
            await queryRunner.manager.save(queryRunner, queryRunner.manager.create(queryRunner, JSONBKeyTest, { id: payload }));
            const entities = await queryRunner.manager.find(queryRunner, JSONBKeyTest, { where: { id: payload } });
            expect(entities.length).to.equal(1);
            expect(entities[0].id).to.deep.equal({ first: 1, second: 2 });

            const entitiesOtherOrder = await queryRunner.manager.find(queryRunner, JSONBKeyTest, { where: { id: {first: 1, second: 2} } });
            expect(entitiesOtherOrder.length).to.equal(1);
            expect(entitiesOtherOrder[0].id).to.deep.equal({ first: 1, second: 2 });

        });
        await qr.release();
    })));
});
