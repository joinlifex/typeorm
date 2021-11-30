import {
    Connection,
} from "../../../../src";
import {closeTestingConnections, createTestingConnections} from "../../../utils/test-utils";
import {expect} from "chai";
import { MockSubscriber } from "./subscribers/MockSubscriber";
import { Example } from "./entity/Example";

describe("entity subscriber > query data", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [ Example ],
        subscribers: [ MockSubscriber ],
        dropSchema: true,
        schemaCreate: true,
        enabledDrivers: [ "sqlite" ]
    }));
    beforeEach(() => {
        for (const connection of connections) {
            (connection.subscribers[0] as MockSubscriber).calledData.length = 0;
        }
    });
    after(() => closeTestingConnections(connections));

    it("passes query data to subscriber", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const subscriber = connection.subscribers[0] as MockSubscriber;

        const example = new Example();

        await connection.manager.save(qr, example);

        example.value++;

        await connection.manager.save(qr, example, { data: { Hello: "World" } });

        expect(subscriber.calledData).to.be.eql([
            { Hello: "World" },
        ]);
        
        await qr.release();
    })));

    it("cleans up the data after the save completes", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const subscriber = connection.subscribers[0] as MockSubscriber;

        const example = new Example();

        await connection.manager.save(qr, example);

        example.value++;

        await connection.manager.save(qr, example, { data: { Hello: "World" } });

        example.value++;

        await connection.manager.save(qr, example);

        expect(subscriber.calledData).to.be.eql([
            { Hello: "World" },
            {},
        ]);
        
        await qr.release();
    })));
});
