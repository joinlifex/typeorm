import { QueryRunnerAlreadyReleasedError } from "../../error/QueryRunnerAlreadyReleasedError"
import { TransactionNotStartedError } from "../../error/TransactionNotStartedError"
import { QueryRunner } from "../../query-runner/QueryRunner"
import { IsolationLevel } from "../types/IsolationLevel"
import { AuroraPostgresDriver } from "./AuroraPostgresDriver"
import { PostgresQueryRunner } from "../postgres/PostgresQueryRunner"
import { ReplicationMode } from "../types/ReplicationMode"
import { QueryResult } from "../../query-runner/QueryResult"

class PostgresQueryRunnerWrapper extends PostgresQueryRunner {
    driver: any

    constructor(driver: any, mode: ReplicationMode) {
        super(driver, mode)
    }
}

/**
 * Runs queries on a single postgres database connection.
 */
export class AuroraPostgresQueryRunner
    extends PostgresQueryRunnerWrapper
    implements QueryRunner
{
    // -------------------------------------------------------------------------
    // Public Implemented Properties
    // -------------------------------------------------------------------------

    /**
     * Database driver used by connection.
     */
    driver: AuroraPostgresDriver

    protected client: any

    // -------------------------------------------------------------------------
    // Protected Properties
    // -------------------------------------------------------------------------

    /**
     * Promise used to obtain a database connection for a first time.
     */
    protected databaseConnectionPromise: Promise<any>

    // -------------------------------------------------------------------------
    // Constructor
    // -------------------------------------------------------------------------

    constructor(
        driver: AuroraPostgresDriver,
        client: any,
        mode: ReplicationMode,
    ) {
        super(driver, mode)

        this.client = client
    }

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates/uses database connection from the connection pool to perform further operations.
     * Returns obtained database connection.
     */
    connect(): Promise<any> {
        if (this.databaseConnection)
            return Promise.resolve(this.databaseConnection)

        if (this.databaseConnectionPromise)
            return this.databaseConnectionPromise

        if (this.mode === "slave" && this.driver.isReplicated) {
            this.databaseConnectionPromise = this.driver
                .obtainSlaveConnection()
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        } else {
            // master
            this.databaseConnectionPromise = this.driver
                .obtainMasterConnection()
                .then(([connection, release]: any[]) => {
                    this.driver.connectedQueryRunners.push(this)
                    this.databaseConnection = connection
                    this.releaseCallback = release
                    return this.databaseConnection
                })
        }

        return this.databaseConnectionPromise
    }

    /**
     * Starts transaction on the current connection.
     */
    async startTransaction(isolationLevel?: IsolationLevel): Promise<void> {
        this.isTransactionActive = true
        try {
            await this.broadcaster.broadcast("BeforeTransactionStart")
        } catch (err) {
            this.isTransactionActive = false
            throw err
        }

        if (this.transactionDepth === 0) {
            await this.client.startTransaction()
        } else {
            await this.query(`SAVEPOINT typeorm_${this.transactionDepth}`)
        }
        this.transactionDepth += 1

        await this.broadcaster.broadcast("AfterTransactionStart")
    }

    /**
     * Commits transaction.
     * Error will be thrown if transaction was not started.
     */
    async commitTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionCommit")

        if (this.transactionDepth > 1) {
            await this.query(
                `RELEASE SAVEPOINT typeorm_${this.transactionDepth - 1}`,
            )
        } else {
            await this.client.commitTransaction()
            this.isTransactionActive = false
        }
        this.transactionDepth -= 1

        await Promise.all(this.afterCommitListeners.map((listener) => listener())).finally(() => {
            this.afterRollbackListeners = [];
            this.afterCommitListeners = [];
        });

        await this.broadcaster.broadcast("AfterTransactionCommit")
    }

    /**
     * Commits transaction if transaction was not started do nothing
     */
    async commitTransactionIfNotStarted(): Promise<void> {
        if (!this.isTransactionActive) return
        
        return this.commitTransaction();
    }

    /**
     * Rollbacks transaction.
     * Error will be thrown if transaction was not started.
     */
    async rollbackTransaction(): Promise<void> {
        if (!this.isTransactionActive) throw new TransactionNotStartedError()

        await this.broadcaster.broadcast("BeforeTransactionRollback")

        if (this.transactionDepth > 1) {
            await this.query(
                `ROLLBACK TO SAVEPOINT typeorm_${this.transactionDepth - 1}`,
            )
        } else {
            await this.client.rollbackTransaction()
            this.isTransactionActive = false
        }
        this.transactionDepth -= 1

        await Promise.all(this.afterRollbackListeners.map((listener) => listener()));

        this.afterRollbackListeners = [];
        this.afterCommitListeners = [];

        await this.broadcaster.broadcast("AfterTransactionRollback")
    }

    /**
     * Rollbacks transaction if transaction was not started do nothing
     */
    async rollbackTransactionIfNotStarted(): Promise<void> {
        if (!this.isTransactionActive) return
        
        return this.rollbackTransaction();
    }

    /**
     * Executes a given SQL query.
     */
    async query(
        query: string,
        parameters?: any[],
        useStructuredResult = false,
    ): Promise<any> {
        if (this.isReleased) throw new QueryRunnerAlreadyReleasedError()

        const raw = await this.client.query(query, parameters)

        const result = new QueryResult()

        result.raw = raw

        if (raw?.hasOwnProperty("records") && Array.isArray(raw.records)) {
            result.records = raw.records
        }

        if (raw?.hasOwnProperty("numberOfRecordsUpdated")) {
            result.affected = raw.numberOfRecordsUpdated
        }

        if (!useStructuredResult) {
            return result.raw
        }

        return result
    }
}
