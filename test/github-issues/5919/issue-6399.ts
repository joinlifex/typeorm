import { expect } from "chai";
import Sinon from "sinon";
import { Connection } from "../../../src";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils";
import { Comment } from "./entities";

describe("github issues > #5919 Caching won't work with replication enabled", () => {
    let connections: Connection[];

    beforeEach(async () => {
        connections = await createTestingConnections({
            entities: [Comment],
            schemaCreate: true,
            dropSchema: true,
            cache: true,
            enabledDrivers: ["postgres"],
        });
        await reloadTestingDatabases(connections);
    });
    afterEach(() => closeTestingConnections(connections));

    it("should not another queryRunner for cache with a given masterQueryRunner", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qr = connection.createQueryRunner();
                const comment1 = new Comment();
                comment1.text = "tata";
                await connection.manager.save(qr, comment1);

                const createQueryRunnerSpy = Sinon.spy(
                    connection,
                    "createQueryRunner"
                );
                const masterQueryRunner = connection.createQueryRunner(
                    "master"
                );

                const results1 = await connection
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(true)
                    .getRawMany(masterQueryRunner);

                expect(results1.length).eq(1);

                expect(createQueryRunnerSpy.notCalled);

                // add another one and ensure cache works
                const comment2 = new Comment();
                comment2.text = "tata";
                await connection.manager.save(qr, comment2);

                const results2 = await connection
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(true)
                    .getRawMany(masterQueryRunner);

                expect(results2.length).eq(1);
                await qr.release();
            })
        ));

    it("should create another queryRunner for cache with a given slaveQueryRunner", () =>
        Promise.all(
            connections.map(async (connection) => {
                const qr = connection.createQueryRunner();
                const comment1 = new Comment();
                comment1.text = "tata";
                await connection.manager.save(qr, comment1);

                const createQueryRunnerSpy = Sinon.spy(
                    connection,
                    "createQueryRunner"
                );
                const slaveQueryRunner = connection.createQueryRunner("slave");

                const results1 = await connection
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(true)
                    .getRawMany(slaveQueryRunner);

                expect(results1.length).eq(1);

                expect(createQueryRunnerSpy.calledOnce);

                // add another one and ensure cache works
                const comment2 = new Comment();
                comment2.text = "tata";
                await connection.manager.save(qr, comment2);

                const results2 = await connection
                    .createQueryBuilder()
                    .from(Comment, "c")
                    .cache(true)
                    .getRawMany(slaveQueryRunner);

                expect(results2.length).eq(1);
                await qr.release();
            })
        ));
});
