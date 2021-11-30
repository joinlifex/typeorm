import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
import {Car} from "./entity/Car";
import {Fruit} from "./entity/Fruit";

describe("github issues > #363 Can't save 2 unrelated entity types in a single persist call", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("entityManager should allow you to save unrelated entities with one persist call", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const car = new Car();
        car.name = "Ferrari";

        const fruit = new Fruit();
        fruit.name = "Banana";

        const [savedCar, savedFruit] = await connection.manager.save(qr, [car, fruit]);

        expect(savedFruit).to.have.property("name", "Banana");
        expect(savedFruit).to.be.instanceof(Fruit);

        expect(savedCar).to.have.property("name", "Ferrari");
        expect(savedCar).to.be.instanceof(Car);

        const cars = await connection.manager.find(qr, Car);

        // before the changes in this PR, all the tests before this one actually passed
        expect(cars).to.length(1);
        expect(cars[0]).to.have.property("name", "Ferrari");

        const fruits = await connection.manager.find(qr, Fruit);

        expect(fruits).to.length(1);
        expect(fruits[0]).to.have.property("name", "Banana");

        await qr.release();
    })));

    it("entityManager should allow you to delete unrelated entities with one remove call", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const fruit = new Fruit();
        fruit.name = "Banana";

        const fruit2 = new Fruit();
        fruit2.name = "Apple";

        const [savedFruit] = await connection.manager.save(qr, [fruit, fruit2]);

        const car = new Car();
        car.name = "Ferrari";

        const savedCar = await connection.manager.save(qr, car);

        await connection.manager.remove(qr, [savedCar, savedFruit]);

        const cars = await connection.manager.find(qr, Car);

        expect(cars).to.length(0);

        const fruits = await connection.manager.find(qr, Fruit);

        expect(fruits).to.length(1);
        expect(fruits[0]).to.have.property("name", "Apple");

        await qr.release();
    })));

});
