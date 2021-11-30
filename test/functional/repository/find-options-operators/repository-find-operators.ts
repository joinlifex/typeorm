import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {
    Any,
    Between,
    Connection,
    Equal,
    ILike,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    Like,
    MoreThan,
    MoreThanOrEqual,
    Not
} from "../../../../src";
import {Post} from "./entity/Post";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";
import {Raw} from "../../../../src/find-options/operator/Raw";
import {PersonAR} from "./entity/PersonAR";
import {expect} from "chai";

describe("repository > find options > operators", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("not", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not("About #1")
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("lessThan", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: LessThan(10)
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("lessThanOrEqual", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);
        const post3 = new Post();
        post3.title = "About #3";
        post3.likes = 13;
        await connection.manager.save(qr, post3);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: LessThanOrEqual(12)
        });
        loadedPosts.should.be.eql([
            { id: 1, likes: 12, title: "About #1" },
            { id: 2, likes: 3, title: "About #2" }
        ]);

        await qr.release();
    })));

    it("not(lessThan)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Not(LessThan(10))
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("not(lessThanOrEqual)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);
        const post3 = new Post();
        post3.title = "About #3";
        post3.likes = 13;
        await connection.manager.save(qr, post3);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Not(LessThanOrEqual(12))
        });
        loadedPosts.should.be.eql([{ id: 3, likes: 13, title: "About #3" }]);

        await qr.release();
    })));

    it("moreThan", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: MoreThan(10)
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("moreThanOrEqual", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);
        const post3 = new Post();
        post3.title = "About #3";
        post3.likes = 13;
        await connection.manager.save(qr, post3);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: MoreThanOrEqual(12)
        });
        loadedPosts.should.be.eql([
            { id: 1, likes: 12, title: "About #1" },
            { id: 3, likes: 13, title: "About #3" }
        ]);

        await qr.release();
    })));

    it("not(moreThan)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Not(MoreThan(10))
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("not(moreThanOrEqual)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);
        const post3 = new Post();
        post3.title = "About #3";
        post3.likes = 13;
        await connection.manager.save(qr, post3);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Not(MoreThanOrEqual(12))
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("equal", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Equal("About #2")
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("not(equal)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(Equal("About #2"))
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("ilike", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "about #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "ABOUT #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: ILike("%out #%")
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "about #1" }, { id: 2, likes: 3, title: "ABOUT #2" }]);

        await qr.release();
    })));

    it("not(ilike)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "about #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "ABOUT #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(ILike("%out #1"))
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "ABOUT #2" }]);

        await qr.release();
    })));

    it("like", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Like("%out #%")
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }, { id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("not(like)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(Like("%out #1"))
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("between", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts1 = await connection.getRepository(Post).find(qr, {
            likes: Between(1, 10)
        });
        loadedPosts1.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        const loadedPosts2 = await connection.getRepository(Post).find(qr, {
            likes: Between(10, 13)
        });
        loadedPosts2.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        const loadedPosts3 = await connection.getRepository(Post).find(qr, {
            likes: Between(1, 20)
        });
        loadedPosts3.should.be.eql([{ id: 1, likes: 12, title: "About #1" }, { id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("not(between)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts1 = await connection.getRepository(Post).find(qr, {
            likes: Not(Between(1, 10))
        });
        loadedPosts1.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        const loadedPosts2 = await connection.getRepository(Post).find(qr, {
            likes: Not(Between(10, 13))
        });
        loadedPosts2.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        const loadedPosts3 = await connection.getRepository(Post).find(qr, {
            likes: Not(Between(1, 20))
        });
        loadedPosts3.should.be.eql([]);
        
        await qr.release();
    })));

    it("in", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: In(["About #2", "About #3"])
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        const noPosts = await connection.getRepository(Post).find(qr, {
            title: In([])
        });
        noPosts.length.should.be.eql(0);
        
        await qr.release();
    })));

    it("not(in)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(In(["About #1", "About #3"]))
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        const noPosts = await connection.getRepository(Post).find(qr, {
            title: Not(In([]))
        });
        noPosts.length.should.be.eql(2);
        await qr.release();
    })));

    it("any", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Any(["About #2", "About #3"])
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);

        await qr.release();
    })));

    it("not(any)", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(Any(["About #2", "About #3"]))
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("isNull", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = null as any;
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: IsNull()
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: null }]);

        await qr.release();
    })));

    it("not(isNull)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = null as any;
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            title: Not(IsNull())
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("raw", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Raw("12")
        });
        loadedPosts.should.be.eql([{ id: 1, likes: 12, title: "About #1" }]);

        await qr.release();
    })));

    it("raw (function)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        // insert some fake data
        const post1 = new Post();
        post1.title = "About #1";
        post1.likes = 12;
        await connection.manager.save(qr, post1);
        const post2 = new Post();
        post2.title = "About #2";
        post2.likes = 3;
        await connection.manager.save(qr, post2);

        // check operator
        const loadedPosts = await connection.getRepository(Post).find(qr, {
            likes: Raw(columnAlias => "1 + " + columnAlias + " = 4")
        });
        loadedPosts.should.be.eql([{ id: 2, likes: 3, title: "About #2" }]);
        await qr.release();
    })));

    it("raw (function with object literal parameters)", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const createPost = (index: number): Post => {
            const post = new Post();
            post.title = `About #${index}`;
            post.likes = index;

            return post;
        };

        // insert some fake data
        await connection.manager.save(qr, [
            createPost(1),
            createPost(2),
            createPost(3),
            createPost(4),
            createPost(5),
            createPost(6),
        ]);

        // check operator
        const result1 = await connection.getRepository(Post).find(qr, {
            likes: Raw((columnAlias) => {
                return `(${columnAlias} = :value1) OR (${columnAlias} = :value2)`;
            }, { value1: 2, value2: 3 }),
        });
        result1.should.be.eql([
            { id: 2, likes: 2, title: "About #2" },
            { id: 3, likes: 3, title: "About #3" },
        ]);

        // check operator
        const result2 = await connection.getRepository(Post).find(qr, {
            likes: Raw((columnAlias) => {
                return `(${columnAlias} IN (1, 4, 5, 6)) AND (${columnAlias} < :maxValue)`;
            }, { maxValue: 6 }),
        });
        result2.should.be.eql([
            { id: 1, likes: 1, title: "About #1" },
            { id: 4, likes: 4, title: "About #4" },
            { id: 5, likes: 5, title: "About #5" },
        ]);

        // check operator
        const result3 = await connection.getRepository(Post).find(qr, {
            title: Raw((columnAlias) => {
                return `${columnAlias} IN (:a, :b, :c)`;
            }, { a: "About #1", b: "About #3", c: "About #5" }),
            likes: Raw((columnAlias) => `${columnAlias} IN (:d, :e)`, { d: 5, e: 1 }),
        });
        result3.should.be.eql([
            { id: 1, likes: 1, title: "About #1" },
            { id: 5, likes: 5, title: "About #5" },
        ]);

        // check operator
        const result4 = await connection.getRepository(Post).find(qr, {
            likes: Raw((columnAlias) => `${columnAlias} IN (2, 6)`, { }),
        });
        result4.should.be.eql([
            { id: 2, likes: 2, title: "About #2" },
            { id: 6, likes: 6, title: "About #6" },
        ]);

        // check operator
        const result5 = await connection.getRepository(Post).find(qr, {
            likes: Raw((columnAlias) => `${columnAlias} IN (2, :value, 6)`, { value: 3 }),
        });
        result5.should.be.eql([
            { id: 2, likes: 2, title: "About #2" },
            { id: 3, likes: 3, title: "About #3" },
            { id: 6, likes: 6, title: "About #6" },
        ]);

        // check operator
        const result6 = await connection.getRepository(Post).find(qr, {
            likes: Raw((columnAlias) => `${columnAlias} IN (:...values)`, { values: [2, 3, 6] }),
        });
        result6.should.be.eql([
            { id: 2, likes: 2, title: "About #2" },
            { id: 3, likes: 3, title: "About #3" },
            { id: 6, likes: 6, title: "About #6" },
        ]);
        await qr.release();
    })));

    it("should work with ActiveRecord model", async () => {
        // These must run sequentially as we have the global context of the `PersonAR` ActiveRecord class
        for (const connection of connections) {
            PersonAR.useConnection(connection);

            const qr = connection.createQueryRunner();
            const person = new PersonAR();
            person.name = "Timber";
            await connection.manager.save(qr, person);

            const loadedPeople = await PersonAR.find(qr, {
                name: In(["Timber"])
            });
            expect(loadedPeople[0].name).to.be.equal("Timber");
            await qr.release();
        }
    });

});
