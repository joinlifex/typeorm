import "reflect-metadata";
import { expect } from "chai";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { TestEntity } from "./entity/test.entity";

describe("github issues > #7809 MongoDB delete make changes only to first matched document", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["mongodb"],
            entities: [TestEntity],
            schemaCreate: false,
            dropSchema: true
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should delete all documents related to search pattern", () => Promise.all(connections.map(async connection => {
        const testEntityRepository = connection.getRepository(TestEntity);
        const qr = connection.createQueryRunner();

        // save few documents
        const firstEntity = new TestEntity();
        firstEntity.id = "1";
        firstEntity.name = "Test";
        await testEntityRepository.save(qr, firstEntity);

        const secondEntity = new TestEntity();
        secondEntity.id = "2";
        secondEntity.name = "Test";
        await testEntityRepository.save(qr, secondEntity);

        const thirdEntity = new TestEntity();
        thirdEntity.id = "3";
        thirdEntity.name = "Original";
        await testEntityRepository.save(qr, thirdEntity);

        const fourthEntity = new TestEntity();
        fourthEntity.id = "4";
        fourthEntity.name = "Test";
        await testEntityRepository.save(qr, fourthEntity);

        await testEntityRepository.delete(qr, { name: "Test" });

        const loadedEntities = await testEntityRepository.find(qr);

        await qr.release();
        expect(loadedEntities.length).to.be.eql(1);
        expect(loadedEntities[0]).to.be.instanceOf(TestEntity);
        expect(loadedEntities[0]!.id).to.be.eql(thirdEntity.id);
        expect(loadedEntities[0]!.name).to.be.equal("Original");
    })));
});
