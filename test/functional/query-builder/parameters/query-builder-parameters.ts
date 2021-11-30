import "reflect-metadata";
import { Example } from "./entity/Example";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {expect} from "chai";
import { Connection } from "../../../../src";

describe("query builder > parameters", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [ Example ],
        enabledDrivers: [ "sqlite" ]

    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should replace basic parameters when executing", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Example);
        const qr = connection.createQueryRunner();
        
        await repo.save(qr, { id: "bar" });

        const example = await repo.createQueryBuilder()
            .setParameter("foo", "bar")
            .where("example.id = :foo")
            .getOne(qr);

        expect(example?.id).to.be.equal("bar");
        
        await qr.release();
    })));

    it("should prevent invalid characters from being used as identifiers", () => Promise.all(connections.map(async connection => {
        const b = connection.createQueryBuilder();

        expect(() => b.setParameter(":foo", "bar")).to.throw();
        expect(() => b.setParameter("@foo", "bar")).to.throw();
        expect(() => b.setParameter("😋", "bar")).to.throw();
        expect(() => b.setParameter("foo bar", "bar")).to.throw();
    })));

    it("should allow periods in parameters", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(Example);
        const qr = connection.createQueryRunner();
        
        await repo.save(qr, { id: "bar" });

        const example = await repo.createQueryBuilder()
            .setParameter("f.o.o", "bar")
            .where("example.id = :f.o.o")
            .getOne(qr);

        expect(example?.id).to.be.equal("bar");
        
        await qr.release();
    })));

});
