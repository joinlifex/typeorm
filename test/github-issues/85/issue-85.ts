import {Connection} from "../../../src";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Document} from "./entity/Document";
import {expect} from "chai";

describe("github issues > #85 - Column option insert: false, update: false", () => {

    let connections: Connection[];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

  it("should ignore value of non-inserted column", () => Promise.all(connections.map(async connection => {
    const doc1 = new Document();
    const qr = connection.createQueryRunner();
    doc1.id = 1;
    doc1.version = 42;
    await connection.manager.save(qr, doc1);
    const docs = connection.getRepository(Document);
    const doc2 = await docs.findOne(qr);
    expect(doc2!.version).to.be.equal(1);

    await qr.release();
  })));

  it("should be able to create an entity with column entirely missing", () => Promise.all(connections.map(async connection => {
    // We delete the non-inserted column entirely, so that any use of it will throw an error.
    let queryRunner = connection.createQueryRunner();
    await queryRunner.dropColumn("document", "permission");
    await queryRunner.release();
    const qr = connection.createQueryRunner();

    const doc1 = new Document();
    doc1.id = 1;
    await connection.manager.save(qr, doc1);
    const docs = connection.getRepository(Document);
    // We got here without throwing an error, which is good news.
    expect(await docs.count(qr)).to.eql(1);
    await qr.release();

    // And just to confirm that the above test is meaningful, we drop a regular column
    // and see that creating an entity does throw an error.
    queryRunner = connection.createQueryRunner();
    await queryRunner.dropColumn("document", "name");
    await queryRunner.release();
    const doc2 = new Document();
    doc2.id = 2;
    const qr2 = connection.createQueryRunner();
    const res = connection.manager.save(qr2, doc2).should.be.rejected;
    qr2.release();
    return res;
  })));
});

