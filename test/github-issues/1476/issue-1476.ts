import "reflect-metadata";
import { expect } from "chai";

import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Plan } from "./entity/Plan";
import { Item } from "./entity/Item";
import {MysqlDriver} from "../../../src/driver/mysql/MysqlDriver";

describe("github issues > #1476 subqueries", () => {

    let connections: Connection[] = [];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql", "mariadb", "sqlite", "better-sqlite3", "sqljs"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should", () => Promise.all(connections.map(async connection => {
        const planRepo = connection.getRepository(Plan);
        const itemRepo = connection.getRepository(Item);
        const qr = connection.createQueryRunner();
        
        const plan1 = new Plan();
        plan1.planId = 1;
        plan1.planName = "Test";

        await planRepo.save(qr, plan1);

        const item1 = new Item();
        item1.itemId = 1;
        item1.planId = 1;

        const item2 = new Item();
        item2.itemId = 2;
        item2.planId = 1;

        await itemRepo.save(qr, [item1, item2]);

        const plans = await planRepo
            .createQueryBuilder("b")
            .leftJoinAndSelect(
                subQuery => {
                    return subQuery
                        .select(`COUNT("planId")`, `total`)
                        .addSelect(`planId`)
                        .from(Item, "items")
                        .groupBy(`items.planId`);
            }, "i", `i.planId = b.planId`)
            .getRawMany(qr);

        expect(plans).to.not.be.undefined;

        const plan = plans![0];
        expect(plan.b_planId).to.be.equal(1);
        expect(plan.b_planName).to.be.equal("Test");
        expect(plan.planId).to.be.equal(1);

        if (connection.driver instanceof MysqlDriver) {
            expect(plan.total).to.be.equal("2");
        } else {
            expect(plan.total).to.be.equal(2);
        }

        await qr.release();
    })));
});
