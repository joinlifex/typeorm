import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Cat} from "./entity/Cat";
import {Dog} from "./entity/Dog";

describe("github issues > #620 Feature Request: Flexibility in Foreign Key names", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work as expected", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const dog = new Dog();
        dog.DogID = "Simba";
        await connection.manager.save(qr, dog);

        const cat = new Cat();
        cat.dog = dog;

        await connection.manager.save(qr, cat);

        const loadedCat = await connection.manager
            .createQueryBuilder(Cat, "cat")
            .leftJoinAndSelect("cat.dog", "dog")
            .getOne(qr);

        loadedCat!.id.should.be.equal(1);
        loadedCat!.dog.DogID.should.be.equal("Simba");
        await qr.release();
    })));

});
