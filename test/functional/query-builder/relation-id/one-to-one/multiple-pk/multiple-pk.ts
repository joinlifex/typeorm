import "reflect-metadata";
import {expect} from "chai";
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases
} from "../../../../../utils/test-utils";
import {Connection} from "../../../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {Image} from "./entity/Image";

describe("query builder > relation-id > one-to-one > multiple-pk", () => {
    
    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    describe("owner side", () => {

        it("should load ids when both entities have multiple primary keys", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "airplanes";
            await connection.manager.save(qr, category2);

            const post1 = new Post();
            post1.id = 1;
            post1.authorId = 1;
            post1.title = "About BMW";
            post1.category = category1;
            await connection.manager.save(qr, post1);

            const post2 = new Post();
            post2.id = 2;
            post2.authorId = 1;
            post2.title = "About Boeing";
            post2.category = category2;
            await connection.manager.save(qr, post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.category")
                .getMany(qr);

            expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedPosts[1].categoryId).to.be.eql({ id: 2, code: 1 });

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.category")
                .where("post.id = :id", { id: 1 })
                .andWhere("post.authorId = :authorId", { authorId: 1 })
                .getOne(qr);

            expect(loadedPost!.categoryId).to.be.eql({ id: 1, code: 1 });

        
            await qr.release();
        })));

        it("should load ids when only one entity have multiple primary keys", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const image1 = new Image();
            image1.name = "Image #1";
            await connection.manager.save(qr, image1);

            const image2 = new Image();
            image2.name = "Image #2";
            await connection.manager.save(qr, image2);

            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            category1.image = image1;
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "airplanes";
            category2.image = image2;
            await connection.manager.save(qr, category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .loadRelationIdAndMap("category.imageId", "category.image")
                .getMany(qr);

            expect(loadedCategories[0].imageId).to.be.equal(1);
            expect(loadedCategories[1].imageId).to.be.equal(2);

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .loadRelationIdAndMap("category.imageId", "category.image")
                .where("category.id = :id", { id: 1 })
                .andWhere("category.code = :code", { code: 1 })
                .getOne(qr);

            expect(loadedCategory!.imageId).to.be.equal(1);

        
            await qr.release();
        })));

        it("should load ids when both entities have multiple primary keys and related entity does not have inverse side", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "airplanes";
            await connection.manager.save(qr, category2);

            const post1 = new Post();
            post1.id = 1;
            post1.authorId = 1;
            post1.title = "About BMW";
            post1.subcategory = category1;
            await connection.manager.save(qr, post1);

            const post2 = new Post();
            post2.id = 2;
            post2.authorId = 1;
            post2.title = "About Boeing";
            post2.subcategory = category2;
            await connection.manager.save(qr, post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.subcategory")
                .getMany(qr);

            expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedPosts[1].categoryId).to.be.eql({ id: 2, code: 1 });

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.subcategory")
                .where("post.id = :id", { id: 1 })
                .andWhere("post.authorId = :authorId", { authorId: 1 })
                .getOne(qr);

            expect(loadedPost!.categoryId).to.be.eql({ id: 1, code: 1 });

        
            await qr.release();
        })));

        it("should load ids when loadRelationIdAndMap used on nested relation", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const image1 = new Image();
            image1.name = "Image #1";
            await connection.manager.save(qr, image1);

            const image2 = new Image();
            image2.name = "Image #2";
            await connection.manager.save(qr, image2);

            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            category1.image = image1;
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "airplanes";
            category2.image = image2;
            await connection.manager.save(qr, category2);

            const post1 = new Post();
            post1.id = 1;
            post1.authorId = 1;
            post1.title = "About BMW";
            post1.category = category1;
            await connection.manager.save(qr, post1);

            const post2 = new Post();
            post2.id = 2;
            post2.authorId = 1;
            post2.title = "About Boeing";
            post2.category = category2;
            await connection.manager.save(qr, post2);

            const loadedPosts = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.category")
                .leftJoinAndSelect("post.category", "category")
                .loadRelationIdAndMap("category.imageId", "category.image")
                .getMany(qr);

            expect(loadedPosts[0].categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedPosts[0].category.imageId).to.be.equal(1);
            expect(loadedPosts[1].categoryId).to.be.eql({ id: 2, code: 1 });
            expect(loadedPosts[1].category.imageId).to.be.equal(2);

            const loadedPost = await connection.manager
                .createQueryBuilder(Post, "post")
                .loadRelationIdAndMap("post.categoryId", "post.category")
                .leftJoinAndSelect("post.category", "category")
                .loadRelationIdAndMap("category.imageId", "category.image")
                .where("post.id = :id", { id: 1 })
                .andWhere("post.authorId = :authorId", { authorId: 1 })
                .getOne(qr);

            expect(loadedPost!.categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedPost!.category.imageId).to.be.equal(1);

        
            await qr.release();
        })));
    });

    describe("inverse side", () => {

        it("should load ids when both entities have multiple primary keys", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const post1 = new Post();
            post1.id = 1;
            post1.authorId = 1;
            post1.title = "About BMW";
            await connection.manager.save(qr, post1);

            const post2 = new Post();
            post2.id = 2;
            post2.authorId = 1;
            post2.title = "About Boeing";
            await connection.manager.save(qr, post2);

            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            category1.post = post1;
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "airplanes";
            category2.post = post2;
            await connection.manager.save(qr, category2);

            const loadedCategories = await connection.manager
                .createQueryBuilder(Category, "category")
                .loadRelationIdAndMap("category.postId", "category.post")
                .getMany(qr);

            expect(loadedCategories[0].postId).to.be.eql({ id: 1, authorId: 1 });
            expect(loadedCategories[1].postId).to.be.eql({ id: 2, authorId: 1 });

            const loadedCategory = await connection.manager
                .createQueryBuilder(Category, "category")
                .loadRelationIdAndMap("category.postId", "category.post")
                .where("category.id = :id", { id: 1 })
                .andWhere("category.code = :code", { code: 1 })
                .getOne(qr);

            expect(loadedCategory!.postId).to.be.eql({ id: 1, authorId: 1 });

        
            await qr.release();
        })));

        it("should load ids when only one entity have multiple primary keys", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "category #1";
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "category #2";
            await connection.manager.save(qr, category2);

            const image1 = new Image();
            image1.name = "Image #1";
            image1.category = category1;
            await connection.manager.save(qr, image1);

            const image2 = new Image();
            image2.name = "Image #2";
            image2.category = category2;
            await connection.manager.save(qr, image2);

            const loadedImages = await connection.manager
                .createQueryBuilder(Image, "image")
                .loadRelationIdAndMap("image.categoryId", "image.category")
                .getMany(qr);

            expect(loadedImages[0].categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedImages[1].categoryId).to.be.eql({ id: 2, code: 1 });

            const loadedImage = await connection.manager
                .createQueryBuilder(Image, "image")
                .loadRelationIdAndMap("image.categoryId", "image.category")
                .where("image.id = :id", { id: 1 })
                .getOne(qr);

            expect(loadedImage!.categoryId).to.be.eql({ id: 1, code: 1 });

        
            await qr.release();
        })));

        it("should load ids when loadRelationIdAndMap used on nested relation", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
        
            const post1 = new Post();
            post1.id = 1;
            post1.authorId = 1;
            post1.title = "About BMW";
            await connection.manager.save(qr, post1);

            const post2 = new Post();
            post2.id = 2;
            post2.authorId = 1;
            post2.title = "About Boeing";
            await connection.manager.save(qr, post2);

            const category1 = new Category();
            category1.id = 1;
            category1.code = 1;
            category1.name = "cars";
            category1.post = post1;
            await connection.manager.save(qr, category1);

            const category2 = new Category();
            category2.id = 2;
            category2.code = 1;
            category2.name = "BMW";
            category2.post = post2;
            await connection.manager.save(qr, category2);

            const image1 = new Image();
            image1.name = "Image #1";
            image1.category = category1;
            await connection.manager.save(qr, image1);

            const image2 = new Image();
            image2.name = "Image #2";
            image2.category = category2;
            await connection.manager.save(qr, image2);

            const loadedImages = await connection.manager
                .createQueryBuilder(Image, "image")
                .loadRelationIdAndMap("image.categoryId", "image.category")
                .leftJoinAndSelect("image.category", "category")
                .loadRelationIdAndMap("category.postId", "category.post")
                .getMany(qr);

            expect(loadedImages[0].categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedImages[0].category.postId).to.be.eql({ id: 1, authorId: 1 });
            expect(loadedImages[1].categoryId).to.be.eql({ id: 2, code: 1 });
            expect(loadedImages[1].category.postId).to.be.eql({ id: 2, authorId: 1 });

            const loadedImage = await connection.manager
                .createQueryBuilder(Image, "image")
                .loadRelationIdAndMap("image.categoryId", "image.category")
                .leftJoinAndSelect("image.category", "category")
                .loadRelationIdAndMap("category.postId", "category.post")
                .where("image.id = :id", { id: 1 })
                .getOne(qr);

            expect(loadedImage!.categoryId).to.be.eql({ id: 1, code: 1 });
            expect(loadedImage!.category.postId).to.be.eql({ id: 1, authorId: 1 });

        
            await qr.release();
        })));

    });

});