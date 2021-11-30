import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {expect} from "chai";
export type Role = "sa" | "user" | "admin" | "server";
import {User} from "./entity/user";

describe("github issues > #953 MySQL 5.7 JSON column parse", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should retrieve record from mysql5.7 using driver mysql2", () => Promise.all(connections.map(async connection => {
        const repo = connection.getRepository(User);
        const queryRunner = connection.createQueryRunner();
        let newUser = new User();
        newUser.username = "admin";
        newUser.password = "admin";
        newUser.roles = ["admin"];
        newUser.lastLoginAt = new Date();
        let user = repo.create(queryRunner, newUser);
        await repo.save(queryRunner, user);

        let user1 = await repo.findOne(queryRunner, {username: "admin"});
        expect(user1).has.property("roles").with.is.an("array").and.contains("admin");
        
        queryRunner.release();
    })));

});
