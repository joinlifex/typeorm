import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {Person} from "./entity/person";
import {Note} from "./entity/note";

describe("github issues > #2965 Reuse preloaded lazy relations", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [ __dirname + "/entity/*{.js,.ts}" ],
        // use for manual validation
        // logging: true,
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should resuse preloaded lazy relations", () => Promise.all(connections.map(async connection => {

        const repoPerson = connection.getRepository(Person);
        const repoNote = connection.getRepository(Note);
        const qr = connection.createQueryRunner();

        const personA = await repoPerson.create(qr, { name: "personA" });
        const personB = await repoPerson.create(qr, { name: "personB" });

        await repoPerson.save(qr, [
            personA,
            personB,
        ]);

        await repoNote.insert(qr, { label: "note1", owner: personA });
        await repoNote.insert(qr, { label: "note2", owner: personB });

        const originalLoad: (...args: any[]) => Promise<any[]> = connection.relationLoader.load;
        let loadCalledCounter = 0;
        connection.relationLoader.load = (...args: any[]): Promise<any[]> => {
            loadCalledCounter++;
            return originalLoad.call(connection.relationLoader, ...args);
        };

        {
            const res = await repoPerson.find(qr, { relations: ["notes"] });
            const personANotes = await res[0].notes;
            loadCalledCounter.should.be.equal(0);
            personANotes[0].label.should.be.equal("note1");
        }

        {
            const res = await repoPerson.find(qr);
            const personBNotes = await res[1].notes;
            loadCalledCounter.should.be.equal(1);
            personBNotes[0].label.should.be.equal("note2");
        }
        await qr.release();
    })));

});
