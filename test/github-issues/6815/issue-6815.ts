import {expect} from "chai";
import {Connection} from "../../../src/connection/Connection";
import {EntityManager} from "../../../src/entity-manager/EntityManager";
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import {ChildEntity} from "./entity/ChildEntity";
import {ParentEntity} from "./entity/ParentEntity";

describe("github issues > #6815 RelationId() on nullable relation returns 'null' string", () => {
    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true,
        enabledDrivers: ["cockroachdb", "mariadb", "mssql", "mysql", "postgres"]
    }));

    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should return null as childId if child doesn't exist", () => Promise.all(
        connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const em = new EntityManager(connection);
            const parent = em.create(qr, ParentEntity);
            await em.save(qr, parent);

            const loaded = await em.findOneOrFail(qr, ParentEntity, parent.id);
            expect(loaded.childId).to.be.null;
            await qr.release();
        })
    ));

    it("should return string as childId if child exists", () => Promise.all(
        connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const em = new EntityManager(connection);
            const child = em.create(qr, ChildEntity);
            await em.save(qr, child);

            const parent = em.create(qr, ParentEntity);
            parent.child = child;
            await em.save(qr, parent);

            const loaded = await em.findOneOrFail(qr, ParentEntity, parent.id);

            if (connection.name === "cockroachdb") {
                // CockroachDB returns id as a number.
                expect(loaded.childId).to.equal(child.id.toString());
            } else {
                expect(loaded.childId).to.equal(child.id);
            }
            await qr.release();
        })
    ));
});
