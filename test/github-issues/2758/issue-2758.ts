import "reflect-metadata";
import { Connection } from "../../../src/connection/Connection";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import {Person} from "./entity/Person";
import {User} from "./entity/User";

describe.skip("github issues > #2758 Insert fails when related OneToOne entity's primary key is also a foreign key", () => {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        });
    });
    after(() => closeTestingConnections(connections));

    it("should insert person with nested new party", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const repository = connection.getRepository(Person);
        await connection.manager.save(qr, repository.create(qr, {
            party: { },
        }));

        await qr.release();
    })));

    it("should insert user with nested new person", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const repository = connection.getRepository(User);
        await connection.manager.save(qr, repository.create(qr, {
            person: { party: { } },
        }));

        await qr.release();
    })));

    it("should insert a new user with existing person", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const personRepository = connection.getRepository(Person);
        const person = await connection.manager.save(qr, personRepository.create(qr, {
            party: { }
        }));

        const userRepository = connection.getRepository(User);
        await connection.manager.save(qr, userRepository.create(qr, {
            person: person,
        }));

        await qr.release();
    })));

    it("should insert user with existing personId", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const personRepository = connection.getRepository(Person);
        const person = await connection.manager.save(qr, personRepository.create(qr, {
            party: { },
        }));

        const userRepository = connection.getRepository(User);
        await connection.manager.save(qr, userRepository.create(qr, {
            personId: person.id,
        }));

        await qr.release();
    })));

});
