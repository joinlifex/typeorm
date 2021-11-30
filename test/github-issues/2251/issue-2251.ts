import "reflect-metadata";

import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import {
  closeTestingConnections,
  createTestingConnections,
  reloadTestingDatabases
} from "../../utils/test-utils";
import { Bar } from "./entity/Bar";
import { Foo } from "./entity/Foo";

describe("github issues > #2251 - Unexpected behavior when passing duplicate entities to repository.save(qr)", () => {
  let connections: Connection[];
  before(
    async () =>
      (connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        schemaCreate: true,
        dropSchema: true
      }))
  );

  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should update all entities", () =>
    Promise.all(
      connections.map(async connection => {
        const repo = connection.getRepository(Bar);
        const qr = connection.createQueryRunner();

        await repo.save(qr, [{ description: "test1" }, { description: "test2" }]);

        let bars = await repo.find(qr);
        await repo.save(qr, [
          { id: 1, description: "test1a" },
          { id: 2, description: "test2a" },
          { id: 1, description: "test1a" },
          { id: 2, description: "test2a" }
        ]);

        bars = await repo.find(qr);

        expect(bars.length).to.equal(2);
        await qr.release();
      })
    ));

  it("should handle cascade updates", () =>
    Promise.all(
      connections.map(async connection => {
        const barRepo = connection.getRepository(Bar);
        const fooRepo = connection.getRepository(Foo);
        const qr = connection.createQueryRunner();

        await fooRepo.save(qr, {
          bars: [{ description: "test2a" }, { description: "test2b" }]
        });

        await fooRepo.save(qr, {
          id: 1,
          bars: [
            { id: 1, description: "test2a-1" },
            { description: "test2c" },
            { id: 1, description: "test2a-2" }
          ]
        });

        const bars = await barRepo.find(qr);

        // We saved two bars originally. The above save should update the description of one,
        // remove the reference of another and insert a 3rd.
        expect(bars.length).to.equal(3);
        
        const bar = await barRepo.findOne(qr, 1);

        expect(bar).not.to.be.undefined;

        // Did not observe the same behavior with unwanted inserts. Current behavior is
        // that the first duplicate goes through and the rest are ignored.
        expect(bar!.description).to.equal("test2a-1");
        await qr.release();
      })
    ));
});
