import {expect} from "chai";
import "reflect-metadata";
import {getConnectionManager} from "../../../../src";
import {Connection} from "../../../../src/connection/Connection";
import {Repository} from "../../../../src/repository/Repository";
import {setupSingleTestingConnection} from "../../../utils/test-utils";
import {Category} from "./entity/Category";
import {CategoryMetadata} from "./entity/CategoryMetadata";
import {Post} from "./entity/Post";

describe("persistence > custom-column-names", function() {

    // -------------------------------------------------------------------------
    // Configuration
    // -------------------------------------------------------------------------

    // connect to db
    let connection: Connection;
    before(async () => {
        const options = setupSingleTestingConnection("mysql", {
            entities: [Post, Category, CategoryMetadata]
        });
        if (!options)
            return;

        connection = getConnectionManager().create(options);
    });
    after(() => connection.close());

    // clean up database before each test
    function reloadDatabase() {
        if (!connection)
            return;
        return connection
            .synchronize(true)
            .catch(e => {
                throw e;
            });
    }

    let postRepository: Repository<Post>;
    let categoryRepository: Repository<Category>;
    let metadataRepository: Repository<CategoryMetadata>;
    before(function() {
        if (!connection)
            return;
        postRepository = connection.getRepository(Post);
        categoryRepository = connection.getRepository(Category);
        metadataRepository = connection.getRepository(CategoryMetadata);
    });

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("attach exist entity to exist entity with many-to-one relation", function() {
        if (!connection)
            return;
        let newPost: Post, newCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(async function () {
            const qr = connection.createQueryRunner();
            newCategory = categoryRepository.create(qr);
            newCategory.name = "Animals";
            const res = categoryRepository.save(qr, newCategory);
            
            await qr.release();
            return res;
        });

        // save a new post
        before(async function() {
            const qr = connection.createQueryRunner();
            newPost = postRepository.create(qr);
            newPost.title = "All about animals";
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // attach category to post and save it
        before(async function() {
            newPost.category = newCategory;
            const qr = connection.createQueryRunner();
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // load a post
        before(async function() {
            const qr = connection.createQueryRunner();
            const res = postRepository
                .findOne(qr, 1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } }})
                .then(post => loadedPost = post!);
            
            await qr.release();
            return res;
        });

        it("should contain attached category", function () {
            expect(loadedPost).not.to.be.undefined;
            expect(loadedPost.category).not.to.be.undefined;
            expect(loadedPost.categoryId).not.to.be.undefined;
        });

    });

    describe("attach new entity to exist entity with many-to-one relation", function() {
        if (!connection)
            return;
        let newPost: Post, newCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category
        before(async function () {
            const qr = connection.createQueryRunner();
            newCategory = categoryRepository.create(qr);
            newCategory.name = "Animals";
            const res = categoryRepository.save(qr, newCategory);
            
            await qr.release();
            return res;
        });

        // save a new post and attach category
        before(async function() {
            const qr = connection.createQueryRunner();
            newPost = postRepository.create(qr);
            newPost.title = "All about animals";
            newPost.category = newCategory;
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // load a post
        before(async function() {
            const qr = connection.createQueryRunner();
            const res = postRepository
                .findOne(qr, 1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } } })
                .then(post => loadedPost = post!);
            
            await qr.release();
            return res;
        });

        it("should contain attached category", function () {
            expect(loadedPost).not.to.be.undefined;
            expect(loadedPost.category).not.to.be.undefined;
            expect(loadedPost.categoryId).not.to.be.undefined;
        });

    });

    describe("attach new entity to new entity with many-to-one relation", function() {
        if (!connection)
            return;
        let newPost: Post, newCategory: Category, loadedPost: Post;

        before(reloadDatabase);

        // save a new category, post and attach category to post
        before(async function () {
            const qr = connection.createQueryRunner();
            newCategory = categoryRepository.create(qr);
            newCategory.name = "Animals";
            newPost = postRepository.create(qr);
            newPost.title = "All about animals";
            newPost.category = newCategory;
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // load a post
        before(async function() {
            const qr = connection.createQueryRunner();
            const res = postRepository
                .findOne(qr, 1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category" } }})
                .then(post => loadedPost = post!);
            
            await qr.release();
            return res;
        });

        it("should contain attached category", function () {
            expect(loadedPost).not.to.be.undefined;
            expect(loadedPost.category).not.to.be.undefined;
            expect(loadedPost.categoryId).not.to.be.undefined;
        });

    });

    describe("attach exist entity to exist entity with one-to-one relation", function() {
        if (!connection)
            return;
        let newPost: Post, newCategory: Category, newMetadata: CategoryMetadata, loadedPost: Post;

        before(reloadDatabase);

        // save a new post
        before(async function() {
            const qr = connection.createQueryRunner();
            newPost = postRepository.create(qr);
            newPost.title = "All about animals";
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // save a new category
        before(async function () {
            const qr = connection.createQueryRunner();
            newCategory = categoryRepository.create(qr);
            newCategory.name = "Animals";
            const res = categoryRepository.save(qr, newCategory);
            
            await qr.release();
            return res;
        });

        // save a new metadata
        before(async function() {
            const qr = connection.createQueryRunner();
            newMetadata = metadataRepository.create(qr);
            newMetadata.keyword = "animals";
            const res = metadataRepository.save(qr, newMetadata);
            
            await qr.release();
            return res;
        });

        // attach metadata to category and category to post and save it
        before(async function() {
            const qr = connection.createQueryRunner();
            newCategory.metadata = newMetadata;
            newPost.category = newCategory;
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // load a post
        before(async function() {
            const qr = connection.createQueryRunner();
            const res = postRepository
                .findOne(qr, 1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category", metadata: "category.metadata" } } })
                .then(post => loadedPost = post!);
            
                await qr.release();
                return res;
        });

        it("should contain attached category and metadata in the category", function () {
            expect(loadedPost).not.to.be.undefined;
            expect(loadedPost.category).not.to.be.undefined;
            expect(loadedPost.categoryId).not.to.be.undefined;
            expect(loadedPost.category.metadata).not.to.be.undefined;
            expect(loadedPost.category.metadataId).not.to.be.undefined;
        });

    });

    describe("attach new entity to exist entity with one-to-one relation", function() {
        if (!connection)
            return;
        let newPost: Post, newCategory: Category, newMetadata: CategoryMetadata, loadedPost: Post;

        before(reloadDatabase);

        // save a new post
        before(async function() {
            const qr = connection.createQueryRunner();
            newPost = postRepository.create(qr);
            newPost.title = "All about animals";
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // save a new category and new metadata
        before(async function () {
            const qr = connection.createQueryRunner();
            newMetadata = metadataRepository.create(qr);
            newMetadata.keyword = "animals";
            newCategory = categoryRepository.create(qr);
            newCategory.name = "Animals";
            newCategory.metadata = newMetadata;
            const res = categoryRepository.save(qr, newCategory);
            
            await qr.release();
            return res;
        });

        // attach metadata to category and category to post and save it
        before(async function() {
            const qr = connection.createQueryRunner();
            newPost.category = newCategory;
            const res = postRepository.save(qr, newPost);
            
            await qr.release();
            return res;
        });

        // load a post
        before(async function() {
            const qr = connection.createQueryRunner();
            const res = postRepository
                .findOne(qr, 1, { join: { alias: "post", leftJoinAndSelect: { category: "post.category", metadata: "category.metadata" } } })
                .then(post => loadedPost = post!);
            
                await qr.release();
                return res;
        });

        it("should contain attached category and metadata in the category", function () {
            expect(loadedPost).not.to.be.undefined;
            expect(loadedPost.category).not.to.be.undefined;
            expect(loadedPost.categoryId).not.to.be.undefined;
            expect(loadedPost.category.metadata).not.to.be.undefined;
            expect(loadedPost.category.metadataId).not.to.be.undefined;
        });

    });

});
