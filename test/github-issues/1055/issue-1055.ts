import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Parent} from "./entity/Parent";
import {Child} from "./entity/Child";
import {expect} from "chai";

describe("github issues > #1055 ind with relations not working, correct syntax causes type error", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"] // only one driver is enabled because this example uses lazy relations
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should be able to find by object reference", () => Promise.all(connections.map(async connection => {
        const manager = connection.manager;

        const qr = connection.createQueryRunner();
        const parent = new Parent();
        parent.name = "Parent";
        await manager.save(qr, parent);

        const loadedParent = await manager.findOne(qr, Parent, 1);
        expect(loadedParent).not.to.be.undefined;

        if (!loadedParent) return;

        const child = connection.manager.create(qr, Child, { // use alternative way of creating (to fix #1180 at the same time as well)
            name: "Child",
            parent: loadedParent
        });
        await manager.save(qr, child);

        const foundChild = await manager.findOne(qr, Child, { parent: loadedParent });
        expect(foundChild).not.to.be.undefined;
        await qr.release();
    })));

    it("should not have type errors with the primary key type", () => Promise.all(connections.map(async connection => {
        const manager = connection.manager;

        const qr = connection.createQueryRunner();
        const parent = new Parent();
        parent.name = "Parent";
        await manager.save(qr, parent);

        const loadedParent = await manager.findOne(qr, Parent, 1);
        expect(loadedParent).not.to.be.undefined;

        if (!loadedParent) return;

        const child = new Child();
        child.name = "Child";
        child.parent = Promise.resolve(loadedParent);
        await manager.save(qr, child);

        const foundChild = await manager.findOne(qr, Child, { parent: loadedParent.id });
        expect(foundChild).not.to.be.undefined;
        await qr.release();
    })));
});
