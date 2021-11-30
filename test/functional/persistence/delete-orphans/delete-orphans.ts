import "reflect-metadata";
import { Connection, Repository } from "../../../../src/index";
import { reloadTestingDatabases, createTestingConnections, closeTestingConnections } from "../../../utils/test-utils";
import { expect } from "chai";
import { Category } from "./entity/Category";
import { Post } from "./entity/Post";

describe("persistence > delete orphans", () => {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connections: Connection[] = [];

    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],

    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("when a Post is removed from a Category", () => {
        let categoryRepository: Repository<Category>;
        let postRepository: Repository<Post>;
        let categoryId: number;

        beforeEach(async () => {
            await Promise.all(connections.map(async connection => {
                categoryRepository = connection.getRepository(Category);
                postRepository = connection.getRepository(Post);
                const qr = connection.createQueryRunner();
                const categoryToInsert = await categoryRepository.save(qr, new Category());
                categoryToInsert.posts = [
                    new Post(),
                    new Post()
                ];
    
                await categoryRepository.save(qr, categoryToInsert);
                categoryId = categoryToInsert.id;
    
                const categoryToUpdate = (await categoryRepository.findOne(qr, categoryId))!;
                categoryToUpdate.posts = categoryToInsert.posts.filter(p => p.id === 1); // Keep the first post
    
                await categoryRepository.save(qr, categoryToUpdate);
                await qr.release();
            }));
            
        });

        it("should retain a Post on the Category", async () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const category = await categoryRepository.findOne(qr, categoryId);
            expect(category).not.to.be.undefined;
            expect(category!.posts).to.have.lengthOf(1);
            expect(category!.posts[0].id).to.equal(1);
            await qr.release();
        })));

        it("should delete the orphaned Post from the database", async () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const postCount = await postRepository.count(qr);
            expect(postCount).to.equal(1);
            await qr.release();
        })));

        it("should retain foreign keys on remaining Posts", async () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const postsWithoutForeignKeys = (await postRepository.find(qr))
                .filter(p => !p.categoryId);
            expect(postsWithoutForeignKeys).to.have.lengthOf(0);
            await qr.release();
        })));
    });

});
