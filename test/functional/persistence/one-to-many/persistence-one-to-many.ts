import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("persistence > one-to-many", function() {

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(() => {
        return createTestingConnections({
            entities: [Post, Category],
        }).then(all => connections = all);
    });
    after(() => closeTestingConnections(connections));
    beforeEach(() => reloadTestingDatabases(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    it("should add exist element to exist object with empty one-to-many relation and save it", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            
        const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        const newCategory = categoryRepository.create(qr);
        newCategory.name = "Animals";
        await categoryRepository.save(qr, newCategory);

        const newPost = postRepository.create(qr);
        newPost.title = "All about animals";
        await postRepository.save(qr, newPost);

        newPost.categories = [newCategory];
        await postRepository.save(qr, newPost);

        const loadedPost = await postRepository.findOne(qr, newPost.id, { relations: ["categories"] });
        expect(loadedPost!).not.to.be.undefined;
        expect(loadedPost!.categories).not.to.be.undefined;
        expect(loadedPost!.categories![0]).not.to.be.undefined;

        await qr.release();
    })));

    it("should add exist element to new object with empty one-to-many relation and save it", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        const newCategory = categoryRepository.create(qr);
        newCategory.name = "Animals";
        await categoryRepository.save(qr, newCategory);

        const newPost = postRepository.create(qr);
        newPost.title = "All about animals";
        newPost.categories = [newCategory];
        await postRepository.save(qr, newPost);

        const loadedPost = await postRepository.findOne(qr, newPost.id, { relations: ["categories"] });
        expect(loadedPost).not.to.be.undefined;
        expect(loadedPost!.categories).not.to.be.undefined;
        expect(loadedPost!.categories![0]).not.to.be.undefined;
        
        await qr.release();
    })));

    it("should remove exist element from one-to-many relation and save it", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        const firstNewCategory = categoryRepository.create(qr);
        firstNewCategory.name = "Animals";
        await categoryRepository.save(qr, firstNewCategory);

        const secondNewCategory = categoryRepository.create(qr);
        secondNewCategory.name = "Insects";
        await categoryRepository.save(qr, secondNewCategory);

        const newPost = postRepository.create(qr);
        newPost.title = "All about animals";
        await postRepository.save(qr, newPost);

        newPost.categories = [firstNewCategory, secondNewCategory];
        await postRepository.save(qr, newPost);

        newPost.categories = [firstNewCategory];
        await postRepository.save(qr, newPost);

        const loadedPost = await postRepository.findOne(qr, newPost.id, {
            join: {
                alias: "post",
                innerJoinAndSelect: {
                    categories: "post.categories"
                }
            }
        });
        expect(loadedPost).not.to.be.undefined;
        expect(loadedPost!.categories).not.to.be.undefined;
        expect(loadedPost!.categories![0]).not.to.be.undefined;
        expect(loadedPost!.categories![1]).to.be.undefined;
        
        await qr.release();
    })));

    it("should remove all elements from one-to-many relation and save it", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        let firstNewCategory = categoryRepository.create(qr);
        firstNewCategory.name = "Animals";
        await categoryRepository.save(qr, firstNewCategory);

        let secondNewCategory = categoryRepository.create(qr);
        secondNewCategory.name = "Insects";
        await categoryRepository.save(qr, secondNewCategory);

        let newPost = postRepository.create(qr);
        newPost.title = "All about animals";
        await postRepository.save(qr, newPost);

        newPost.categories = [firstNewCategory, secondNewCategory];
        await postRepository.save(qr, newPost);

        newPost.categories = [];
        await postRepository.save(qr, newPost);

        const loadedPost = await postRepository.findOne(qr, newPost.id, {
            join: {
                alias: "post",
                leftJoinAndSelect: {
                    categories: "post.categories"
                }
            }
        });
        expect(loadedPost).not.to.be.undefined;
        expect(loadedPost!.categories).to.be.eql([]);
        
        await qr.release();
    })));

    it("set relation to null (elements exist there) from one-to-many relation and save it", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
            const postRepository = connection.getRepository(Post);
        const categoryRepository = connection.getRepository(Category);

        let firstNewCategory = categoryRepository.create(qr);
        firstNewCategory.name = "Animals";
        await categoryRepository.save(qr, firstNewCategory);

        let secondNewCategory = categoryRepository.create(qr);
        secondNewCategory.name = "Insects";
        await categoryRepository.save(qr, secondNewCategory);

        let newPost = postRepository.create(qr);
        newPost.title = "All about animals";
        await postRepository.save(qr, newPost);

        newPost.categories = [firstNewCategory, secondNewCategory];
        await postRepository.save(qr, newPost);

        newPost.categories = null;
        await postRepository.save(qr, newPost);

        const loadedPost = (await postRepository.findOne(qr, newPost.id, {
            join: {
                alias: "post",
                leftJoinAndSelect: {
                    categories: "post.categories"
                }
            }
        }))!;
        expect(loadedPost).not.to.be.undefined;
        expect(loadedPost.categories).to.be.eql([]);
        
        await qr.release();
    })));

});
