import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {expect} from "chai";

describe("transaction > transaction with oracle connection partial isolation support", () => {

  let connections: Connection[];
  before(async () => connections = await createTestingConnections({
      entities: [__dirname + "/entity/*{.js,.ts}"],
      enabledDrivers: ["oracle"] // todo: for some reasons mariadb tests are not passing here
  }));
  beforeEach(() => reloadTestingDatabases(connections));
  after(() => closeTestingConnections(connections));

  it("should execute all operations in a single transaction with READ COMMITTED isolation level", () => Promise.all(connections.map(async connection => {

    const qr = connection.createQueryRunner();
      let postId: number|undefined = undefined, categoryId: number|undefined = undefined;

      await connection.manager.transaction(qr, "READ COMMITTED", async queryRunner => {

          const post = new Post();
          post.title = "Post #1";
          await queryRunner.manager.save(queryRunner, post);

          const category = new Category();
          category.name = "Category #1";
          await queryRunner.manager.save(queryRunner, category);

          postId = post.id;
          categoryId = category.id;

      });

      const post = await connection.manager.findOne(qr, Post, { where: { title: "Post #1" }});
      expect(post).not.to.be.undefined;
      post!.should.be.eql({
          id: postId,
          title: "Post #1"
      });

      const category = await connection.manager.findOne(qr, Category, { where: { name: "Category #1" }});
      expect(category).not.to.be.undefined;
      category!.should.be.eql({
          id: categoryId,
          name: "Category #1"
      });

      await qr.release();
  })));

  it("should execute all operations in a single transaction with SERIALIZABLE isolation level", () => Promise.all(connections.map(async connection => {

    const qr = connection.createQueryRunner();
      let postId: number|undefined = undefined, categoryId: number|undefined = undefined;

      await connection.manager.transaction(qr, "SERIALIZABLE", async queryRunner => {

          const post = new Post();
          post.title = "Post #1";
          await queryRunner.manager.save(queryRunner, post);

          const category = new Category();
          category.name = "Category #1";
          await queryRunner.manager.save(queryRunner, category);

          postId = post.id;
          categoryId = category.id;

      });

      const post = await connection.manager.findOne(qr, Post, { where: { title: "Post #1" }});
      expect(post).not.to.be.undefined;
      post!.should.be.eql({
          id: postId,
          title: "Post #1"
      });

      const category = await connection.manager.findOne(qr, Category, { where: { name: "Category #1" }});
      expect(category).not.to.be.undefined;
      category!.should.be.eql({
          id: categoryId,
          name: "Category #1"
      });

      await qr.release();
  })));
});
