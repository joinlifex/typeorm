import "reflect-metadata";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Post} from "./entity/Post";
import {Category} from "./entity/Category";
import {User} from "./entity/User";

describe("persistence > basic functionality", function() {

    let connections: Connection[];
    before(async () => {
        connections = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        });
    });
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should save an entity", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        await connection.manager.save(qr, new Post(1, "Hello Post"));
    
        await qr.release();
    })));

    it("should remove an entity", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        const post = new Post(1, "Hello Post");
        await connection.manager.save(qr, post);
        await connection.manager.remove(qr, post);
    
        await qr.release();})));


    it("should throw an error when not an object is passed to a save method", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        await connection.manager.save(qr, undefined).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "undefined" is given.`);
        await connection.manager.save(qr, null).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "null" is given.`);
        await connection.manager.save(qr, 123).should.be.rejectedWith(`Cannot save, given value must be an entity, instead "123" is given.`);
    
        await qr.release();})));


    it("should throw an error when not an object is passed to a remove method", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        await connection.manager.remove(qr, undefined).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "undefined" is given.`);
        await connection.manager.remove(qr, null).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "null" is given.`);
        await connection.manager.remove(qr, 123).should.be.rejectedWith(`Cannot remove, given value must be an entity, instead "123" is given.`);
    
        await qr.release();
    })));

    it("should throw an exception if object literal is given instead of constructed entity because it cannot determine what to save", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        await connection.manager.save(qr, {}).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.save(qr, [{}, {}]).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.save(qr, [new Post(1, "Hello Post"), {}]).should.be.rejectedWith(`Cannot save, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove(qr, {}).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove(qr, [{}, {}]).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
        await connection.manager.remove(qr, [new Post(1, "Hello Post"), {}]).should.be.rejectedWith(`Cannot remove, given value must be instance of entity class, instead object literal is given. Or you must specify an entity target to method call.`);
    
        await qr.release();})));


    it("should be able to save and remove entities of different types", () => Promise.all(connections.map(async connection => {
                const qr = connection.createQueryRunner();
        const post = new Post(1, "Hello Post");
        const category = new Category(1, "Hello Category");
        const user = new User(1, "Hello User");

        await connection.manager.save(qr, [post, category, user]);
        await connection.manager.findOne(qr, Post, 1).should.eventually.eql({ id: 1, title: "Hello Post" });
        await connection.manager.findOne(qr, Category, 1).should.eventually.eql({ id: 1, name: "Hello Category" });
        await connection.manager.findOne(qr, User, 1).should.eventually.eql({ id: 1, name: "Hello User" });

        await connection.manager.remove(qr, [post, category, user]);
        await connection.manager.findOne(qr, Post, 1).should.eventually.be.undefined;
        await connection.manager.findOne(qr, Category, 1).should.eventually.be.undefined;
        await connection.manager.findOne(qr, User, 1).should.eventually.be.undefined;
    
        await qr.release();})));
        

});
