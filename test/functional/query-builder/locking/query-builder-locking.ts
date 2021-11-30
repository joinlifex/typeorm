import "reflect-metadata";
import {CockroachDriver} from "../../../../src/driver/cockroachdb/CockroachDriver";
import {SapDriver} from "../../../../src/driver/sap/SapDriver";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {Connection} from "../../../../src/connection/Connection";
import {PostWithVersion} from "./entity/PostWithVersion";
import {Post} from "./entity/Post";
import {expect} from "chai";
import {PostWithoutVersionAndUpdateDate} from "./entity/PostWithoutVersionAndUpdateDate";
import {PostWithUpdateDate} from "./entity/PostWithUpdateDate";
import {PostWithVersionAndUpdatedDate} from "./entity/PostWithVersionAndUpdatedDate";
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
import { VersionUtils } from "../../../../src/util/VersionUtils";

describe("query builder > locking", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should not attach pessimistic read lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
        
        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

        expect(sql.indexOf("LOCK IN SHARE MODE") === -1).to.be.true;
        expect(sql.indexOf("FOR SHARE") === -1).to.be.true;
        expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") === -1).to.be.true;
    })));

    it("should throw error if pessimistic lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
            const qr = connection.createQueryRunner();
        
        await Promise.all([
            connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_read")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError),

            connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError)
        ]);
        await qr.release();
    })));

    it("should not throw error if pessimistic lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
        const qr = connection.createQueryRunner();
        
        if (connection.driver instanceof CockroachDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write")
                        .where("post.id = :id", { id: 1 })
                        .getOne(queryRunner).should.not.be.rejected
                ]);
            });
            await qr.release();
            return;
        }

        await connection.manager.transaction(qr, queryRunner => {
            return Promise.all([
                queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_read")
                    .where("post.id = :id", { id: 1 })
                    .getOne(qr).should.not.be.rejected,

                    queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_write")
                    .where("post.id = :id", { id: 1 })
                    .getOne(qr).should.not.be.rejected
            ]);
        });
        await qr.release();
    })));

    it("should throw error if for no key update lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            const qr = connection.createQueryRunner();
            await connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("for_no_key_update")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError);
        
            await qr.release();
            return ;
        }
        return;
    })));

    it("should not throw error if for no key update lock used with transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            const qr = connection.createQueryRunner();
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("for_no_key_update")
                    .where("post.id = :id", { id: 1})
                    .getOne(qr).should.not.be.rejected]);
            });
            await qr.release();
            return;
        }
        return;
    })));

    it("should throw error if pessimistic_partial_write lock used without transaction", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver) {
            const qr = connection.createQueryRunner();
            await connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_partial_write")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError);
        
                await qr.release();
                return ;
            }

        if (connection.driver instanceof MysqlDriver) {
            const qr = connection.createQueryRunner();
            let [{ version }] = await connection.query(qr, 
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if (version.includes("maria")) return; // not supported in mariadb
            if (VersionUtils.isGreaterOrEqual(version, "8.0.0")) {
                await connection.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_partial_write")
                    .where("post.id = :id", { id: 1 })
                    .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError);
                
                await qr.release();
                return ;
            }
        }
        return;
    })));

    it("should not throw error if pessimistic_partial_write lock used with transaction", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        if (connection.driver instanceof PostgresDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_partial_write")
                    .where("post.id = :id", { id: 1})
                    .getOne(qr).should.not.be.rejected]);
            });
            await qr.release();
            return;
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(qr, 
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if (version.includes("maria")) return; // not supported in mariadb
            if (VersionUtils.isGreaterOrEqual(version, "8.0.0")) {
                await connection.manager.transaction(qr, queryRunner => {
                    return Promise.all([queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_partial_write")
                        .where("post.id = :id", { id: 1})
                        .getOne(qr).should.not.be.rejected]);
                });
                await qr.release();
                return;
            }
        }
        return;
    })));

    it("should throw error if pessimistic_write_or_fail lock used without transaction", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            await connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError);
            await qr.release();
            return ;
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(qr, 
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if ((version.includes("maria") && VersionUtils.isGreaterOrEqual(version, "10.3.0")) || !version.includes("maria") && VersionUtils.isGreaterOrEqual(version, "8.0.0")) {
                await connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.be.rejectedWith(PessimisticLockTransactionRequiredError);
            
                await qr.release();
                return;
            }
        }
        return;
    })));

    it("should not throw error if pessimistic_write_or_fail lock used with transaction", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                    .setLock("pessimistic_write_or_fail")
                    .where("post.id = :id", { id: 1})
                    .getOne(qr).should.not.be.rejected]);
            });
                    
            await qr.release();
            return;
        }

        if (connection.driver instanceof MysqlDriver) {
            let [{ version }] = await connection.query(qr, 
                "SELECT VERSION() as version;"
            );
            version = version.toLowerCase();
            if ((version.includes("maria") && VersionUtils.isGreaterOrEqual(version, "10.3.0")) || !version.includes("maria") && VersionUtils.isGreaterOrEqual(version, "8.0.0")) {
                await connection.manager.transaction(qr, queryRunner => {
                    return Promise.all([queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write_or_fail")
                        .where("post.id = :id", { id: 1})
                        .getOne(qr).should.not.be.rejected]);
                });
                await qr.release();
                return;
            }
        }
        return;
    })));

    it("should attach pessimistic read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof SapDriver)
            return;
            
        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_read")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver) {
            expect(sql.indexOf("LOCK IN SHARE MODE") !== -1).to.be.true;

        } else if (connection.driver instanceof PostgresDriver) {
            expect(sql.indexOf("FOR SHARE") !== -1).to.be.true;

        } else if (connection.driver instanceof OracleDriver) {
            expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (HOLDLOCK, ROWLOCK)") !== -1).to.be.true;
        }
    })));

    it("should attach dirty read lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof SqlServerDriver)) return;
        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("dirty_read")
            .where("post.id = :id", { id: 1 })
            .getSql();

        expect(sql.indexOf("WITH (NOLOCK)") !== -1).to.be.true;
    })));

    it("should not attach pessimistic write lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
            
        
        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .where("post.id = :id", { id: 1 })
            .getSql();

            expect(sql.indexOf("FOR UPDATE") === -1).to.be.true;
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") === -1).to.be.true;
    })));

    it("should attach pessimistic write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver)
            return;
            
       
        const sql = connection.createQueryBuilder(PostWithVersion, "post")
            .setLock("pessimistic_write")
            .where("post.id = :id", { id: 1 })
            .getSql();

        if (connection.driver instanceof MysqlDriver || connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver || connection.driver instanceof OracleDriver) {
            expect(sql.indexOf("FOR UPDATE") !== -1).to.be.true;

        } else if (connection.driver instanceof SqlServerDriver) {
            expect(sql.indexOf("WITH (UPDLOCK, ROWLOCK)") !== -1).to.be.true;
        }

    })));

    it("should not attach for no key update lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {

        
            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR NO KEY UPDATE") === -1).to.be.true;
            }
        return;
    })));

    it("should attach for no key update lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver) {

            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("for_no_key_update")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR NO KEY UPDATE") !== -1).to.be.true;
        }
        return;

    })));

    it("should not attach pessimistic_partial_write lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {

            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR UPDATE SKIP LOCKED") === -1).to.be.true;
            }
        return;
    })));

    it("should attach pessimistic_partial_write lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver) {

            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_partial_write")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR UPDATE SKIP LOCKED") !== -1).to.be.true;
        }
        return;

    })));

    it("should not attach pessimistic_write_or_fail lock statement on query if locking is not used", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver || connection.driver instanceof CockroachDriver) {

            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .where("post.id = :id", { id: 1 })
                .getSql();

                expect(sql.indexOf("FOR UPDATE NOWAIT") === -1).to.be.true;
            }
        return;
    })));

    it("should attach pessimistic_write_or_fail lock statement on query if locking enabled", () => Promise.all(connections.map(async connection => {
        if (connection.driver instanceof PostgresDriver || connection.driver instanceof MysqlDriver || connection.driver instanceof CockroachDriver) {

            const sql = connection.createQueryBuilder(PostWithVersion, "post")
                .setLock("pessimistic_write_or_fail")
                .where("post.id = :id", { id: 1 })
                .getSql();

            expect(sql.indexOf("FOR UPDATE NOWAIT") !== -1).to.be.true;
        }
        return;

    })));

    it("should throw error if optimistic lock used with getMany method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getMany(qr).should.be.rejectedWith(OptimisticLockCanNotBeUsedError);

        await qr.release();
    })));

    it("should throw error if optimistic lock used with getCount method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getCount(qr).should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    
        await qr.release();
    })));

    it("should throw error if optimistic lock used with getManyAndCount method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getManyAndCount(qr).should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    
        await qr.release();
    })));

    it("should throw error if optimistic lock used with getRawMany method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .getRawMany(qr).should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    
        await qr.release();
    })));

    it("should throw error if optimistic lock used with getRawOne method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getRawOne(qr).should.be.rejectedWith(OptimisticLockCanNotBeUsedError);
    
        await qr.release();
    })));

    it("should not throw error if optimistic lock used with getOne method", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne(qr).should.not.be.rejected;
           
        await qr.release();
    })));

    it.skip("should throw error if entity does not have version and update date columns", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithoutVersionAndUpdateDate();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await connection.createQueryBuilder(PostWithoutVersionAndUpdateDate, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne(qr).should.be.rejectedWith(NoVersionOrUpdateDateColumnError);
    
        await qr.release();
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual version does not equal expected version", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 2)
           .where("post.id = :id", { id: 1 })
           .getOne(qr).should.be.rejectedWith(OptimisticLockVersionMismatchError);
    
        await qr.release();
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual version and expected versions are equal", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithVersion();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await connection.createQueryBuilder(PostWithVersion, "post")
           .setLock("optimistic", 1)
           .where("post.id = :id", { id: 1 })
           .getOne(qr).should.not.be.rejected;
    
        await qr.release();
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should throw error if actual updated date does not equal expected updated date", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await connection.createQueryBuilder(PostWithUpdateDate, "post")
           .setLock("optimistic", new Date(2017, 1, 1))
           .where("post.id = :id", { id: 1 })
           .getOne(qr).should.be.rejectedWith(OptimisticLockVersionMismatchError);
    
        await qr.release();
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should not throw error if actual updated date and expected updated date are equal", () => Promise.all(connections.map(async connection => {

        if (connection.driver instanceof SqlServerDriver)
            return;
        const qr = connection.createQueryRunner();
        const post = new PostWithUpdateDate();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await connection.createQueryBuilder(PostWithUpdateDate, "post")
            .setLock("optimistic", post.updateDate)
            .where("post.id = :id", {id: 1})
            .getOne(qr).should.not.be.rejected;
    
        await qr.release();
    })));

    // skipped because inserted milliseconds are not always equal to what we say it to insert, unskip when needed
    it.skip("should work if both version and update date columns applied", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        const post = new PostWithVersionAndUpdatedDate();
        post.title = "New post";
        await connection.manager.save(qr, post);

        await Promise.all([
            connection.createQueryBuilder(PostWithVersionAndUpdatedDate, "post")
                .setLock("optimistic", post.updateDate)
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.not.be.rejected,

            connection.createQueryBuilder(PostWithVersionAndUpdatedDate, "post")
                .setLock("optimistic", 1)
                .where("post.id = :id", { id: 1 })
                .getOne(qr).should.not.be.rejected
        ]);
    
        await qr.release();
    })));

    it("should throw error if pessimistic locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        if (connection.driver instanceof AbstractSqliteDriver || connection.driver instanceof SapDriver){
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_read")
                        .where("post.id = :id", { id: 1 })
                        .getOne(queryRunner).should.be.rejectedWith(LockNotSupportedOnGivenDriverError),

                        queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_write")
                        .where("post.id = :id", { id: 1 })
                        .getOne(queryRunner).should.be.rejectedWith(LockNotSupportedOnGivenDriverError)
                ]);
            });
    
            await qr.release();
            return;
        }

        if (connection.driver instanceof CockroachDriver){
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("pessimistic_read")
                        .where("post.id = :id", { id: 1 })
                        .getOne(queryRunner).should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });
    
            await qr.release();
            return;
        }
        return;
    })));

    it("should throw error if for no key update locking not supported by given driver", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver)) {
            const qr = connection.createQueryRunner();
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(PostWithVersion, "post")
                        .setLock("for_no_key_update")
                        .where("post.id = :id", { id: 1 })
                        .getOne(queryRunner).should.be.rejectedWith(LockNotSupportedOnGivenDriverError),
                ]);
            });
    
            await qr.release();
            return;
        }

        return;
    })));

    it("should only specify locked tables in FOR UPDATE OF clause if argument is given", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver))
            return;

        const sql = connection.createQueryBuilder(Post, "post")
            .innerJoin("post.author", "user")
            .setLock("pessimistic_write", undefined, ["user"])
            .getSql();

        expect(sql).to.match(/FOR UPDATE OF user$/);

        const sql2 = connection.createQueryBuilder(Post, "post")
            .innerJoin("post.author", "user")
            .setLock("pessimistic_write", undefined, ["post","user"])
            .getSql();

        expect(sql2).to.match(/FOR UPDATE OF post, user$/);
    })));

    it("should not allow empty array for lockTables", () => Promise.all(connections.map(async connection => {
        if (!(connection.driver instanceof PostgresDriver || connection.driver instanceof CockroachDriver))
            return;
        const qr = connection.createQueryRunner();
        
        await connection.manager.transaction(qr, queryRunner => {
            return Promise.all([
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .innerJoin("post.author", "user")
                    .setLock("pessimistic_write", undefined, [])
                    .getOne(queryRunner).should.be.rejectedWith("lockTables cannot be an empty array"),
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
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .innerJoin("post.author", "user")
                    .setLock("pessimistic_write", undefined, ["img"])
                    .getOne(queryRunner),
            ]);
            // With the exception being thrown the transaction is not closed. if ".should.be.rejectedWith" is added to the inner promise
        }).should.be.rejectedWith('relation "img" in FOR UPDATE clause not found in FROM clause');
    
        await qr.release();
        return;
    })));

    it("should allow on a left join", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();
        
        if (connection.driver instanceof CockroachDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(Post, "post")
                        .leftJoin("post.author", "user")
                        .setLock("pessimistic_write", undefined, ["post"])
                        .getOne(queryRunner),
                        queryRunner.manager.createQueryBuilder(Post, "post")
                        .leftJoin("post.author", "user")
                        .setLock("pessimistic_write")
                        .getOne(queryRunner),
                ]);
            });
    
            await qr.release();
            return;
        }

        if (connection.driver instanceof PostgresDriver) {
            await connection.manager.transaction(qr, queryRunner => {
                return Promise.all([
                    queryRunner.manager.createQueryBuilder(Post, "post")
                        .leftJoin("post.author", "user")
                        .setLock("pessimistic_write", undefined, ["post"])
                        .getOne(qr),
                        queryRunner.manager.createQueryBuilder(Post, "post")
                        .leftJoin("post.author", "user")
                        .setLock("pessimistic_write")
                        .getOne(qr).should.be.rejectedWith("FOR UPDATE cannot be applied to the nullable side of an outer join"),
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
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock("pessimistic_read", undefined, ["post"])
                    .getOne(queryRunner),
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock("pessimistic_write", undefined, ["post"])
                    .getOne(queryRunner),
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock("pessimistic_partial_write", undefined, ["post"])
                    .getOne(queryRunner),
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock("pessimistic_write_or_fail", undefined, ["post"])
                    .getOne(queryRunner),
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .leftJoin("post.author", "user")
                    .setLock("for_no_key_update", undefined, ["post"])
                    .getOne(queryRunner),
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
                queryRunner.manager.createQueryBuilder(Post, "post")
                    .innerJoin("post.categories", "cat")
                    .innerJoin("cat.images", "img")
                    .setLock("pessimistic_write", undefined, ["img"])
                    .getOne(queryRunner)
            ]);
        });
    
        await qr.release();
        return;
    })));
});
