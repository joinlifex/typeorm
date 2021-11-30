import { expect } from "chai";
import { Connection, TypeORMError } from "../../../src";
import { PostgresDriver } from "../../../src/driver/postgres/PostgresDriver";
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";

describe("query runner > postgres rls", () => {

  let connections: Connection[];
  before(async () => {
    connections = await createTestingConnections({
      entities: [__dirname + "/entity/*{.js,.ts}"],
    });
  });
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should set tenant_id to database session on createQueryRunner", () => Promise.all(connections.map(async connection => {
    if (!(connection.driver instanceof PostgresDriver))
      return;

    const tenantId = 761235;

    const qr = connection.createQueryRunner("master", tenantId) as PostgresQueryRunner;

    expect(qr.ctx).to.eql(tenantId);
    const dbDenantId = await qr.query(`SELECT current_setting('${qr.getContextVarName()}')::INTEGER;`);
    
    expect(dbDenantId[0].current_setting).to.eql(tenantId);
    await qr.release();
  })));

  it("should not share tenant_id between QueryRunner", () => Promise.all(connections.map(async connection => {
    if (!(connection.driver instanceof PostgresDriver))
      return;

    const tenantId = 761235;

    const qr = connection.createQueryRunner("master", tenantId) as PostgresQueryRunner;
    const qr2 = connection.createQueryRunner() as PostgresQueryRunner;

    expect(qr.ctx).to.be.equal(tenantId);
    expect(qr2.ctx).to.be.undefined;

    const ctx1 =  await qr.query(`SELECT current_setting('${qr.getContextVarName()}')::INTEGER;`);
    await qr2.query(`SELECT current_setting('${qr2.getContextVarName()}')::INTEGER;`).should.eventually.be.rejectedWith(TypeORMError);

    ctx1[0].current_setting.should.be.eql(tenantId);

    await qr.release();
    await qr2.release();

    expect(qr.ctx).to.be.undefined;
    expect(qr2.ctx).to.be.undefined;
  })));
});