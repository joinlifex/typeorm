import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {UserEntity} from "./entity/UserEntity";
import {UserToOrganizationEntity} from "./entity/UserToOrganizationEntity";
import {OrganizationEntity} from "./entity/OrganizationEntity";

describe("github issues > #1703 Many to Many with association table returns odd values.", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work as expected", () => Promise.all(connections.map(async connection => {
        const qr = connection.createQueryRunner();

        const user1 = new UserEntity();
        const user2 = new UserEntity();
        const user3 = new UserEntity();
        await connection.manager.save(qr, user1);
        await connection.manager.save(qr, user2);
        await connection.manager.save(qr, user3);

        const organization1 = new OrganizationEntity();
        const organization2 = new OrganizationEntity();
        const organization3 = new OrganizationEntity();
        await connection.manager.save(qr, organization1);
        await connection.manager.save(qr, organization2);
        await connection.manager.save(qr, organization3);

        const userOrganization1 = new UserToOrganizationEntity();
        userOrganization1.role = "owner";
        userOrganization1.user = user1;
        userOrganization1.organization = organization1;
        await connection.manager.save(qr, userOrganization1);

        const userOrganization2 = new UserToOrganizationEntity();
        userOrganization2.role = "owner";
        userOrganization2.user = user2;
        userOrganization2.organization = organization2;
        await connection.manager.save(qr, userOrganization2);

        const userOrganization3 = new UserToOrganizationEntity();
        userOrganization3.role = "owner";
        userOrganization3.user = user2;
        userOrganization3.organization = organization3;
        await connection.manager.save(qr, userOrganization3);

        await connection.manager
            .createQueryBuilder(OrganizationEntity, "organization")
            .leftJoinAndSelect("organization.users", "users")
            .getMany(qr);

        // console.log(organizations);
        await qr.release();
    })));

});