import "reflect-metadata";
import {expect} from "chai";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Post} from "./entity/Post";

describe("github issues > #4947 beforeUpdate subscriber entity argument is undefined", () => {
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        subscribers: [__dirname + "/subscriber/*{.js,.ts}"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("if entity has been updated via repository update(), subscriber should get passed entity to change", () => Promise.all(connections.map(async function (connection) {

        const qr = connection.createQueryRunner();
        let repo = connection.getRepository(Post);

        await repo.save(qr, new Post());

        const createdPost = await repo.findOne(qr);

        // test that the newly inserted post was touched by beforeInsert PostSubscriber event
        expect(createdPost).not.to.be.undefined;
        expect(createdPost!.title).to.equal("set in subscriber when created");

        // change the entity
        await repo.update(qr, createdPost!.id, {colToUpdate: 1});

        const updatedPost = await repo.findOne(qr);

        // test that the updated post was touched by beforeUpdate PostSubscriber event
        expect(updatedPost).not.to.be.undefined;
        expect(updatedPost!.title).to.equal("set in subscriber when updated");
        await qr.release();
    })));
});
