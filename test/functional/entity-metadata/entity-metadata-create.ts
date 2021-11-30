import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { expect } from "chai";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { TestCreate } from "./entity/TestCreate";

describe("entity-metadata > create", () => {
    describe("without entitySkipConstructor", () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
                enabledDrivers: [ "sqlite" ],
                entities: [
                    TestCreate
                ]
            })
        );

        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should call the constructor when creating an object", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const entity = connection.manager.create(qr, TestCreate);

            expect(entity.hasCalledConstructor).to.be.true;
        
            await qr.release();
        })));

        it("should set the default property values", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const entity = connection.manager.create(qr, TestCreate);

            expect(entity.foo).to.be.equal("bar");
        
            await qr.release();
        })));

        it("should call the constructor when retrieving an object", () => Promise.all(connections.map(async connection => {
             
            const qr = connection.createQueryRunner();

            const repo = connection.manager.getRepository(TestCreate);

            const { id } = await repo.save(qr, { foo: "baz" });

            const entity = await repo.findOneOrFail(qr, id);

            expect(entity.hasCalledConstructor).to.be.true;
        
            await qr.release();
        })));
    });

    describe("with entitySkipConstructor", () => {
        let connections: Connection[];
        before(async () => connections = await createTestingConnections({
            enabledDrivers: [ "sqlite" ],
            entities: [
                TestCreate
            ],
            driverSpecific: {
                entitySkipConstructor: true,
            }
        }));

        beforeEach(() => reloadTestingDatabases(connections));
        after(() => closeTestingConnections(connections));

        it("should call the constructor when creating an object", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const entity = connection.manager.create(qr, TestCreate);

            expect(entity.hasCalledConstructor).to.be.true;
        
            await qr.release();
        })));

        it("should set the default property values when creating an object", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const entity = connection.manager.create(qr, TestCreate);

            expect(entity.foo).to.be.equal("bar");
        
            await qr.release();
        })));

        it("should not call the constructor when retrieving an object", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const repo = connection.manager.getRepository(TestCreate);

            const { id } = await repo.save(qr, { foo: "baz" });

            const entity = await repo.findOneOrFail(qr, id);

            expect(entity.hasCalledConstructor).not.to.be.true;
        
            await qr.release();
        })));
    });
});
