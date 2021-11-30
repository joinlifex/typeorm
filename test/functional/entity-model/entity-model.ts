import "reflect-metadata";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";

describe("entity-model", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save successfully and use static methods successfully", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (const connection of connections) {
            Post.useConnection(connection); // change connection each time because of AR specifics
            const qr = connection.createQueryRunner();
            
            const post = Post.create(qr);
            post.title = "About ActiveRecord";
            post.text = "Huge discussion how good or bad ActiveRecord is.";
            await post.save(qr);

            const loadedPost = await Post.findOne(qr, post.id);

            loadedPost!.should.be.instanceOf(Post);
            loadedPost!.id.should.be.eql(post.id);
            loadedPost!.title.should.be.eql("About ActiveRecord");
            loadedPost!.text.should.be.eql("Huge discussion how good or bad ActiveRecord is.");
        
            await qr.release();
        }
    });

    describe("upsert", function () {
        it("should upsert successfully", async () => {
            // These must run sequentially as we have the global context of the `Post` ActiveRecord class
            for (const connection of connections.filter((c) => c.driver.supportedUpsertType != null)) {
                Post.useConnection(connection); // change connection each time because of AR specifics
                const qr = connection.createQueryRunner();
            
                const externalId = "external-entity";

                await Post.upsert(qr, { externalId, title: "External post" }, ["externalId"]);
                const upsertInsertedExternalPost = await Post.findOneOrFail(qr, { externalId });

                await Post.upsert(qr, { externalId, title: "External post 2" }, ["externalId"]);
                const upsertUpdatedExternalPost = await Post.findOneOrFail(qr, { externalId });

                upsertInsertedExternalPost.id.should.be.equal(upsertUpdatedExternalPost.id);
                upsertInsertedExternalPost.title.should.not.be.equal(upsertUpdatedExternalPost.title);
            
                await qr.release();
            }
        });
    });

    it("should reload given entity successfully", async () => {
        // These must run sequentially as we have the global context of the `Post` ActiveRecord class
        for (const connection of connections) {
            await connection.synchronize(true);
            Post.useConnection(connection);
            Category.useConnection(connection);
            const qr = connection.createQueryRunner();
            
            const category = Category.create(qr);
            category.id = 1;
            category.name = "Persistence";
            await category.save(qr);

            const post = Post.create(qr);
            post.title = "About ActiveRecord";
            post.categories = [category];
            await post.save(qr);

            await post.reload(qr);

            const assertCategory = Object.assign({}, post.categories[0]);
            post!.should.be.instanceOf(Post);
            post!.id.should.be.eql(post.id);
            post!.title.should.be.eql("About ActiveRecord");
            post!.text.should.be.eql("This is default text.");
            assertCategory.should.be.eql({
                id: 1,
                name: "Persistence"
            });

            category.name = "Persistence and Entity";
            await category.save(qr);

            await post.reload(qr);

            const assertReloadedCategory = Object.assign({}, post.categories[0]);
            assertReloadedCategory.should.be.eql({
                id: 1,
                name: "Persistence and Entity"
            });
        
            await qr.release();
        }
    });
});
