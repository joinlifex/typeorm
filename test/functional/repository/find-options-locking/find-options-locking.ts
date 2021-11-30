import "reflect-metadata";
import {CockroachDriver} from "../../../../src/driver/cockroachdb/CockroachDriver";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src";
import {PostWithVersion} from "./entity/PostWithVersion";
import {expect} from "chai";
import {PostWithoutVersionAndUpdateDate} from "./entity/PostWithoutVersionAndUpdateDate";
import {PostWithUpdateDate} from "./entity/PostWithUpdateDate";
import {PostWithVersionAndUpdatedDate} from "./entity/PostWithVersionAndUpdatedDate";
import {Post} from "./entity/Post";
import {OptimisticLockVersionMismatchError} from "../../../../src/error/OptimisticLockVersionMismatchError";
import {OptimisticLockCanNotBeUsedError} from "../../../../src/error/OptimisticLockCanNotBeUsedError";
import {NoVersionOrUpdateDateColumnError} from "../../../../src/error/NoVersionOrUpdateDateColumnError";
import {PessimisticLockTransactionRequiredError} from "../../../../src/error/PessimisticLockTransactionRequiredError";
import {MysqlDriver} from "../../../../src/driver/mysql/MysqlDriver";
import {PostgresDriver} from "../../../../src/driver/postgres/PostgresDriver";
import {SqlServerDriver} from "../../../../src/driver/sqlserver/SqlServerDriver";
import {AbstractSqliteDriver} from "../../../../src/driver/sqlite-abstract/AbstractSqliteDriver";
import {OracleDriver} from "../../../../src/driver/oracle/OracleDriver";
import {LockNotSupportedOnGivenDriverError} from "../../../../src/error/LockNotSupportedOnGivenDriverError";

describe("repository > find options > locking", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should throw error if pessimistic lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
        const qr = connection.createQueryRunner();

        if (connection.driver instanceof CockroachDriver) {
            await Promise.all([
                connection
                    .getRepository(PostWithVersion)
                    .findOne(qr, 1, { lock: { mode: "pessimistic_write" } })
                    .should.be.rejectedWith(PessimisticLockTransactionRequiredError),
            ]);
            await qr.release();
            return;
        }

        await Promise.all([
            connection
                .getRepository(PostWithVersion)
                .findOne(qr, 1, { lock: { mode: "pessimistic_read" } })
                .should.be.rejectedWith(PessimisticLockTransactionRequiredError),

            connection
                .getRepository(PostWithVersion)
                .findOne(qr, 1, { lock: { mode: "pessimistic_write" } })
                .should.be.rejectedWith(PessimisticLockTransactionRequiredError),
        ]);
        await qr.release();
    })));

    it("should not throw error if pessimistic lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;

        const qr = connection.createQueryRunner();
        if (connection.driver instanceof CockroachDriver) {
            const proms = connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager
                        .getRepository(PostWithVersion)
                        .findOne(queryRunner, 1, { lock: { mode: "pessimistic_write" } })
                        .should.not.be.rejected
                ]);
            });
            await qr.release();
            return proms;
        }

        await connection.manager.transaction(qr, queryRunner => {
            return Promise.all([
                queryRunner.manager
                    .getRepository(PostWithVersion)
                    .findOne(queryRunner, 1, { lock: { mode: "pessimistic_read" } })
                    .should.not.be.rejected,

                queryRunner.manager
                    .getRepository(PostWithVersion)
                    .findOne(queryRunner, 1, { lock: { mode: "pessimistic_write" } })
                    .should.not.be.rejected
            ]);
        });
        await qr.release();
        return;
    })));

    it("should attach pessimistic read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;

        const executedSql: string[] = [];
        const qr = connection.createQueryRunner();

        await connection.manager.transaction(qr, queryRunner => {
            const originalQuery = queryRunner.query.bind(queryRunner);
            queryRunner.query = (...args: any[]) => {
                executedSql.push(args[0]);
                // @ts-ignore
                return originalQuery(...args);
            };

            return queryRunner.manager
                .getRepository(PostWithVersion)
                .findOne(queryRunner, 1, {lock: {mode: "pessimistic_read"}});
        });

        if (connection.driver instanceof MysqlDriver) {
            expect(executedSql[0].indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(executedSql[0].indexOf("FOR SHARE") !== -1).to.be.true;

        } else if (connection.driver instanceof OracleDriver) {
            expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(executedSql[0].indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
        }
        await qr.release();

    })));

    it("should attach for no key update lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const qr = connection.createQueryRunner();
        const executedSql: string[] = [];

        await connection.manager.transaction(qr, queryRunner => {
            const originalQuery = queryRunner.query.bind(queryRunner);
            queryRunner.query = (...args: any[]) => {
                executedSql.push(args[0]);
                // @ts-ignore
                return originalQuery(...args);
            };

            return queryRunner.manager
                .getRepository(PostWithVersion)
                .findOne(queryRunner, 1, { lock: { mode: "for_no_key_update" } });
        });

        expect(executedSql.join(" ").includes("FOR NO KEY UPDATE")).to.be.true;
        await qr.release();
    })));

    it("should attach pessimistic write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
        const qr = connection.createQueryRunner();

        const executedSql: string[] = [];

        await connection.manager.transaction(qr, queryRunner => {
            const originalQuery = queryRunner.query.bind(queryRunner);
            queryRunner.query = (...args: any[]) => {
                executedSql.push(args[0]);
                // @ts-ignore
                return originalQuery(...args);
            };

            return queryRunner.manager
                .getRepository(PostWithVersion)
                .findOne(queryRunner, 1, {lock: {mode: "pessimistic_write"}});
        });

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver || connection.driver instanceof OracleDriver) {
            expect(executedSql[0].indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(executedSql[0].indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
        }
        await qr.release();

    })));

    it("should attach dirty read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof SqlServerDriver)) return;

        const executedSql: string[] = [];
        const qr = connection.createQueryRunner();

        await connection.manager.transaction(qr, queryRunner => {
            const originalQuery = queryRunner.query.bind(queryRunner);
            qr.query = (...args: any[]) => {
                executedSql.push(args[0]);
                return originalQuery(...args);
            };

            return queryRunner.manager
                .getRepository(PostWithVersion)
                .findOne(queryRunner, 1, {lock: {mode: "dirty_read"}});
        });

        expect(executedSql[0].indexOf("WITH (NOLOCK)") !== -1).to.be.true;

        await qr.release();
    })));

    it("should throw error if optimistic lock used with `find` method", () => Promise.all(connections.map(async connection => {
       
        const qr = connection.createQueryRunner();
        await connection
           .getRepository(PostWithVersion)
           .find(qr, {lock: {mode: "optimistic", version: 1}})
           .should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
        await qr.release();
    })));

    it("should not throw error if optimistic lock used with `findOne` method", () => Promise.all(connections.map(async connection => {
        
        const qr = connection.createQueryRunner();
        await connection
            .getRepository(PostWithVersion)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: 1}})
            .should.not.be.rejected;
        await qr.release();
        return;
    })));

    it("should throw error if entity does not have version and update date columns", () => Promise.all(connections.map(async connection => {

        const post = new PostWithoutVersionAndUpdateDate();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await connection
            .getRepository(PostWithoutVersionAndUpdateDate)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: 1}})
            .should.be.rejectedWith(NoVersionOrUpdateDateColumnError);
        await qr.release();
    })));

    it("should throw error if actual version does not equal expected version", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await connection
            .getRepository(PostWithVersion)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: 2}})
            .should.be.rejectedWith(OptimisticLockVersionMismatchError);
        await qr.release();
        return;
    })));

    it("should not throw error if actual version and expected versions are equal", () => Promise.all(connections.map(async connection => {

        const post = new PostWithVersion();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await connection
            .getRepository(PostWithVersion)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: 1}})
            .should.not.be.rejected;
        await qr.release();
        return;
    })));

    it("should throw error if actual updated date does not equal expected updated date", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithUpdateDate();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await connection
            .getRepository(PostWithUpdateDate)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: new Date(2017, 1, 1)}})
            .should.be.rejectedWith(OptimisticLockVersionMismatchError);
        await qr.release();
        return;
    })));

    it("should not throw error if actual updated date and expected updated date are equal", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithUpdateDate();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await connection
            .getRepository(PostWithUpdateDate)
            .findOne(qr, 1, {lock: {mode: "optimistic", version: post.updateDate}})
            .should.not.be.rejected;
        await qr.release();
        return;
    })));

    it("should work if both version and update date columns applied", () => Promise.all(connections.map(async connection => {

        // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
        if (connection.driver instanceof SqlServerDriver)
            return;

        const post = new PostWithVersionAndUpdatedDate();
        post.title = "New post";
        const qr = connection.createQueryRunner();
        await connection.manager.save(qr, post);

        await Promise.all([
            connection
                .getRepository(PostWithVersionAndUpdatedDate)
                .findOne(qr, 1, {lock: {mode: "optimistic", version: post.updateDate}})
                .should.not.be.rejected,
            connection
                .getRepository(PostWithVersionAndUpdatedDate)
                .findOne(qr, 1, {lock: {mode: "optimistic", version: 1}})
                .should.not.be.rejected,
        ]);
        await qr.release();
    })));

    it("should throw error if pessimistic locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver){
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager
                        .getRepository(PostWithVersion)
                        .findOne(queryRunner, 1, { lock: { mode: "pessimistic_read" } })
                        .should.be.rejectedWith(LockNotSupportedOnGivenDriverError),

                    queryRunner.manager
                        .getRepository(PostWithVersion)
                        .findOne(queryRunner, 1, { lock: { mode: "pessimistic_write" } })
                        .should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });
            await qr.release();
            return;
        }

        if (connection.driver instanceof CockroachDriver){
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager
                        .getRepository(PostWithVersion)
                        .findOne(queryRunner, 1, { lock: { mode: "pessimistic_read" } })
                        .should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });
            await qr.release();
            return;
        }

        return;
    })));

    it("should not allow empty array for lockTables", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver))
            return;

        const qr = connection.createQueryRunner();
        await connection.manager.transaction(qr, queryRunner => {
            return Promise.all([
                queryRunner.manager.getRepository(Post)
                    .findOne(queryRunner, {
                        lock: {mode: "pessimistic_write", tables: []}
                    }).should.be.rejectedWith("lockTables cannot be an empty array"),
            ]);
        });
        await qr.release();
        return;
    })));

    it("should throw error when specifying a table that is not part of the query", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver))
            return;
        const qr = connection.createQueryRunner();

        await connection.manager.transaction(qr, queryRunner => {
            return Promise.all([
                queryRunner.manager.getRepository(Post)
                    .findOne(queryRunner, {
                        relations: ["author"],
                        lock: {mode: "pessimistic_write", tables: ["img"]}
                    }).should.be.rejectedWith('"img" is not part of this query')
            ]);
        });
        await qr.release();
        return;
    })));

    it("should allow on a left join", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();

        if (connection.driver instanceof CockroachDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                        relations: ["author"],
                        lock: {mode: "pessimistic_write", tables: ["post"]}
                    }),
                    queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                        relations: ["author"],
                        lock: {mode: "pessimistic_write"}
                    })
                ]);
            });
            await qr.release();
            return;
        }

        if (connection.driver instanceof PostgresDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                        relations: ["author"],
                        lock: {mode: "pessimistic_write", tables: ["post"]}
                    }),
                    queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                        relations: ["author"],
                        lock: {mode: "pessimistic_write"}
                    }).should.be.rejectedWith("FOR UPDATE cannot be applied to the nullable side of an outer join")
                ]);
            });
            await qr.release();
            return;
        }

        return;
    })));

    it("should allow using lockTables on all types of locking", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver))
            return;

        const qr = connection.createQueryRunner();
        await connection.manager.transaction(qr, queryRunner => {

            return Promise.all([
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    relations: ["author"],
                    lock: {mode: "pessimistic_read", tables: ["post"]}
                }),
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    relations: ["author"],
                    lock: {mode: "pessimistic_write", tables: ["post"]}
                }),
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    relations: ["author"],
                    lock: {mode: "pessimistic_partial_write", tables: ["post"]}
                }),
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    relations: ["author"],
                    lock: {mode: "pessimistic_write_or_fail", tables: ["post"]}
                }),
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    relations: ["author"],
                    lock: {mode: "for_no_key_update", tables: ["post"]}
                }),
            ]);
        });
        await qr.release();
        return;
    })));

    it("should allow locking a relation of a relation", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver))
            return;
        const qr = connection.createQueryRunner();
        await connection.manager.transaction(qr, queryRunner => {

            return Promise.all([
                queryRunner.manager.getRepository(Post).findOne(queryRunner, {
                    join: {
                        alias: "post",
                        innerJoinAndSelect: {
                            categorys: "post.categories",
                            images: "categorys.images"
                        }
                    },
                    lock: {mode: "pessimistic_write", tables: ["image"]}
                }),
            ]);
        });
        await qr.release();
        return;
    })));

});
