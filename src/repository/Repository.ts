import {EntityMetadata} from "../metadata/EntityMetadata";
import {FindManyOptions} from "../find-options/FindManyOptions";
import {ObjectLiteral} from "../common/ObjectLiteral";
import {FindOneOptions} from "../find-options/FindOneOptions";
import {DeepPartial} from "../common/DeepPartial";
import {SaveOptions} from "./SaveOptions";
import {RemoveOptions} from "./RemoveOptions";
import {EntityManager} from "../entity-manager/EntityManager";
import {QueryRunner} from "../query-runner/QueryRunner";
import {SelectQueryBuilder} from "../query-builder/SelectQueryBuilder";
import {DeleteResult} from "../query-builder/result/DeleteResult";
import {UpdateResult} from "../query-builder/result/UpdateResult";
import {InsertResult} from "../query-builder/result/InsertResult";
import {QueryDeepPartialEntity} from "../query-builder/QueryPartialEntity";
import {ObjectID} from "../driver/mongodb/typings";
import {FindConditions} from "../find-options/FindConditions";
import {UpsertOptions} from "./UpsertOptions";

/**
 * Repository is supposed to work with your entity objects. Find entities, insert, update, delete, etc.
 */
export class Repository<Entity extends ObjectLiteral> {

    // -------------------------------------------------------------------------
    // Public Properties
    // -------------------------------------------------------------------------

    /**
     * Entity Manager used by this repository.
     */
    readonly manager: EntityManager;

    /**
     * Entity metadata of the entity current repository manages.
     */
    readonly metadata: EntityMetadata;

    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------

    /**
     * Creates a new query builder that can be used to build a sql query.
     */
    createQueryBuilder(alias?: string): SelectQueryBuilder<Entity> {
        return this.manager.createQueryBuilder<Entity>(this.metadata.target as any, alias || this.metadata.targetName);
    }

    /**
     * Returns object that is managed by this repository.
     * If this repository manages entity from schema,
     * then it returns a name of that schema instead.
     */
    get target(): Function|string {
        return this.metadata.target;
    }

    /**
     * Checks if entity has an id.
     * If entity composite compose ids, it will check them all.
     */
    hasId(entity: Entity): boolean {
        return this.manager.hasId(this.metadata.target, entity);
    }

    /**
     * Gets entity mixed id.
     */
    getId(entity: Entity): any {
        return this.manager.getId(this.metadata.target, entity);
    }

    /**
     * Creates a new entity instance.
     */
    create(queryRunner: QueryRunner): Entity;

    /**
     * Creates new entities and copies all entity properties from given objects into their new entities.
     * Note that it copies only properties that are present in entity schema.
     */
    create(queryRunner: QueryRunner, entityLikeArray: DeepPartial<Entity>[]): Entity[];

    /**
     * Creates a new entity instance and copies all entity properties from this object into a new entity.
     * Note that it copies only properties that are present in entity schema.
     */
    create(queryRunner: QueryRunner, entityLike: DeepPartial<Entity>): Entity;

    /**
     * Creates a new entity instance or instances.
     * Can copy properties from the given object into new entities.
     */
    create(queryRunner: QueryRunner, plainEntityLikeOrPlainEntityLikes?: DeepPartial<Entity>|DeepPartial<Entity>[]): Entity|Entity[] {
        return this.manager.create<any>(queryRunner, this.metadata.target as any, plainEntityLikeOrPlainEntityLikes as any);
    }

    /**
     * Merges multiple entities (or entity-like objects) into a given entity.
     */
    merge(queryRunner: QueryRunner, mergeIntoEntity: Entity, ...entityLikes: DeepPartial<Entity>[]): Entity {
        return this.manager.merge(queryRunner, this.metadata.target as any, mergeIntoEntity, ...entityLikes);
    }

    /**
     * Creates a new entity from the given plain javascript object. If entity already exist in the database, then
     * it loads it (and everything related to it), replaces all values with the new ones from the given object
     * and returns this new entity. This new entity is actually a loaded from the db entity with all properties
     * replaced from the new object.
     *
     * Note that given entity-like object must have an entity id / primary key to find entity by.
     * Returns undefined if entity with given id was not found.
     */
    preload(queryRunner: QueryRunner, entityLike: DeepPartial<Entity>): Promise<Entity|undefined> {
        return this.manager.preload(queryRunner, this.metadata.target as any, entityLike);
    }

    /**
     * Saves all given entities in the database.
     * If entities do not exist in the database then inserts, otherwise updates.
     */
     save<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entities: T[], options: SaveOptions & { reload: false }): Promise<T[]>;

     /**
      * Saves all given entities in the database.
      * If entities do not exist in the database then inserts, otherwise updates.
      */
     save<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entities: T[], options?: SaveOptions): Promise<(T & Entity)[]>;
 
     /**
      * Saves a given entity in the database.
      * If entity does not exist in the database then inserts, otherwise updates.
      */
     save<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entity: T, options: SaveOptions & { reload: false }): Promise<T>;
 
     /**
      * Saves a given entity in the database.
      * If entity does not exist in the database then inserts, otherwise updates.
      */
     save<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entity: T, options?: SaveOptions): Promise<T & Entity>;
 
     /**
      * Saves one or many given entities.
      */
     save<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T|T[], options?: SaveOptions): Promise<T|T[]> {
         return this.manager.save<Entity, T>(queryRunner, this.metadata.target as any, entityOrEntities as any, options);
     }
    /**
     * Removes many given entities.
     */
    remove(queryRunner: QueryRunner, entityOrEntities: Entity[], options?: RemoveOptions): Promise<Entity[]>;
    /**
     * Removes one given entity.
     */
    remove(queryRunner: QueryRunner, entityOrEntities: Entity, options?: RemoveOptions): Promise<Entity>;
    /**
     * Removes one or many given entities.
     */
    remove(queryRunner: QueryRunner, entityOrEntities: Entity|Entity[], options?: RemoveOptions): Promise<Entity|Entity[]> {
        return this.manager.remove(queryRunner, this.metadata.target as any, entityOrEntities as any, options);
    }
    /**
     * Records the delete date of one given entity.
     */
    softRemove<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T, options?: SaveOptions & { reload?: false }): Promise<T>;
    /**
     * Records the delete date of many given entities.
     */
     softRemove<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T[], options?: SaveOptions & { reload?: false }): Promise<T[]>;

    /**
     * Records the delete date of one or many given entities.
     */
    softRemove<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T|T[], options?: SaveOptions & { reload?: false }): Promise<T|T[]> {
        return this.manager.softRemove<Entity, T>(queryRunner, this.metadata.target, entityOrEntities, options);
    }

    /**
     * Recovers one given entity.
     */
     recover<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T, options?: SaveOptions & { reload?: false }): Promise<T>;
     /**
      * Recovers many given entities.
      */
     recover<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T[], options?: SaveOptions & { reload?: false }): Promise<T[]>;
    /**
     * Recovers one or many given entities.
     */
    recover<T extends DeepPartial<Entity>>(queryRunner: QueryRunner, entityOrEntities: T|T[], options?: SaveOptions & { reload?: false }): Promise<T|T[]> {
        return this.manager.recover<Entity, T>(queryRunner, this.metadata.target as any, entityOrEntities as any, options);
    }

    /**
     * Inserts a given entity into the database.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT query.
     * Does not check if entity exist in the database, so query will fail if duplicate entity is being inserted.
     */
    insert(queryRunner: QueryRunner, entity: QueryDeepPartialEntity<Entity>|(QueryDeepPartialEntity<Entity>[])): Promise<InsertResult> {
        return this.manager.insert(queryRunner, this.metadata.target as any, entity);
    }

    /**
     * Updates entity partially. Entity can be found by a given conditions.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient UPDATE query.
     * Does not check if entity exist in the database.
     */
    update(queryRunner: QueryRunner, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|FindConditions<Entity>, partialEntity: QueryDeepPartialEntity<Entity>): Promise<UpdateResult> {
        return this.manager.update(queryRunner, this.metadata.target as any, criteria as any, partialEntity);
    }

    /**
     * Inserts a given entity into the database, unless a unique constraint conflicts then updates the entity
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient INSERT ... ON CONFLICT DO UPDATE/ON DUPLICATE KEY UPDATE query.
     */
    upsert(queryRunner: QueryRunner, 
        entityOrEntities: QueryDeepPartialEntity<Entity> | (QueryDeepPartialEntity<Entity>[]),
        conflictPathsOrOptions: string[] | UpsertOptions<Entity>): Promise<InsertResult> {
        return this.manager.upsert(queryRunner, this.metadata.target as any, entityOrEntities, conflictPathsOrOptions);
    }

    /**
     * Deletes entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient DELETE query.
     * Does not check if entity exist in the database.
     */
    delete(queryRunner: QueryRunner, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|FindConditions<Entity>): Promise<DeleteResult> {
        return this.manager.delete(queryRunner, this.metadata.target as any, criteria as any);
    }

    /**
     * Records the delete date of entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient SOFT-DELETE query.
     * Does not check if entity exist in the database.
     */
    softDelete(queryRunner: QueryRunner, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|FindConditions<Entity>): Promise<UpdateResult> {
        return this.manager.softDelete(queryRunner, this.metadata.target as any, criteria as any);
    }

    /**
     * Restores entities by a given criteria.
     * Unlike save method executes a primitive operation without cascades, relations and other operations included.
     * Executes fast and efficient SOFT-DELETE query.
     * Does not check if entity exist in the database.
     */
    restore(queryRunner: QueryRunner, criteria: string|string[]|number|number[]|Date|Date[]|ObjectID|ObjectID[]|FindConditions<Entity>): Promise<UpdateResult> {
        return this.manager.restore(queryRunner, this.metadata.target as any, criteria as any);
    }

    /**
     * Counts entities that match given find options or conditions.
     */
    count(queryRunner: QueryRunner, optionsOrConditions?: FindManyOptions<Entity>|FindConditions<Entity>): Promise<number> {
        return this.manager.count(queryRunner, this.metadata.target as any, optionsOrConditions as any);
    }

    /**
     * Finds entities that match given find options or conditions.
     */
    find(queryRunner: QueryRunner, optionsOrConditions?: FindManyOptions<Entity>|FindConditions<Entity>): Promise<Entity[]> {
        return this.manager.find(queryRunner, this.metadata.target as any, optionsOrConditions as any);
    }
    /**
     * Finds entities that match given find options or conditions.
     * Also counts all entities that match given conditions,
     * but ignores pagination settings (from and take options).
     */
    findAndCount(queryRunner: QueryRunner, optionsOrConditions?: FindManyOptions<Entity>|FindConditions<Entity>): Promise<[ Entity[], number ]> {
        return this.manager.findAndCount(queryRunner, this.metadata.target as any, optionsOrConditions as any);
    }
    /**
     * Finds entities by ids.
     * Optionally find options can be applied.
     */
    findByIds(queryRunner: QueryRunner, ids: any[], optionsOrConditions?: FindManyOptions<Entity>|FindConditions<Entity>): Promise<Entity[]> {
        return this.manager.findByIds(queryRunner, this.metadata.target as any, ids, optionsOrConditions as any);
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOne(queryRunner: QueryRunner, optionsOrConditions?: string|number|Date|ObjectID|FindOneOptions<Entity>|FindConditions<Entity>, maybeOptions?: FindOneOptions<Entity>): Promise<Entity|undefined> {
        return this.manager.findOne(queryRunner, this.metadata.target as any, optionsOrConditions as any, maybeOptions);
    }

    /**
     * Finds first entity that matches given conditions.
     */
    findOneOrFail(queryRunner: QueryRunner, optionsOrConditions?: string|number|Date|ObjectID|FindOneOptions<Entity>|FindConditions<Entity>, maybeOptions?: FindOneOptions<Entity>): Promise<Entity> {
        return this.manager.findOneOrFail(queryRunner, this.metadata.target as any, optionsOrConditions as any, maybeOptions);
    }

    /**
     * Executes a raw SQL query and returns a raw database results.
     * Raw query execution is supported only by relational databases (MongoDB is not supported).
     */
    query(queryRunner: QueryRunner, query: string, parameters?: any[]): Promise<any> {
        return this.manager.query(queryRunner, query, parameters);
    }

    /**
     * Clears all the data from the given table/collection (truncates/drops it).
     *
     * Note: this method uses TRUNCATE and may not work as you expect in transactions on some platforms.
     * @see https://stackoverflow.com/a/5972738/925151
     */
    clear(queryRunner: QueryRunner): Promise<void> {
        return this.manager.clear(queryRunner, this.metadata.target);
    }

    /**
     * Increments some column by provided value of the entities matched given conditions.
     */
    increment(queryRunner: QueryRunner, conditions: FindConditions<Entity>, propertyPath: string, value: number | string): Promise<UpdateResult> {
        return this.manager.increment(queryRunner, this.metadata.target, conditions, propertyPath, value);
    }

    /**
     * Decrements some column by provided value of the entities matched given conditions.
     */
    decrement(queryRunner: QueryRunner, conditions: FindConditions<Entity>, propertyPath: string, value: number | string): Promise<UpdateResult> {
        return this.manager.decrement(queryRunner, this.metadata.target, conditions, propertyPath, value);
    }

}
