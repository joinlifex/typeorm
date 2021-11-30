import "reflect-metadata";
import {expect} from "chai";
import {Connection} from "../../../../src/connection/Connection";
import {User} from "./entity/User";
import {AccessToken} from "./entity/AccessToken";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";

describe("persistence > one-to-one", function() {

    // -------------------------------------------------------------------------
    // Setup
    // -------------------------------------------------------------------------

    let connections: Connection[];
    before(() => {
        return createTestingConnections({
            entities: [User, AccessToken],
        }).then(all => connections = all);
    });
    after(() => closeTestingConnections(connections));
    beforeEach(() => reloadTestingDatabases(connections));

    // -------------------------------------------------------------------------
    // Specifications
    // -------------------------------------------------------------------------

    describe("set the relation with proper item", function() {

        it("should have an access token", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const userRepository = connection.getRepository(User);
            const accessTokenRepository = connection.getRepository(AccessToken);

            const newUser = userRepository.create(qr);
            newUser.email = "mwelnick@test.com";
            await userRepository.save(qr, newUser);

            const newAccessToken = accessTokenRepository.create(qr);
            newAccessToken.user = newUser;
            await accessTokenRepository.save(qr, newAccessToken);


            const loadedUser = await userRepository.findOne(qr, {
                where: { email: "mwelnick@test.com" },
                relations: ["access_token"]
            });

            expect(loadedUser).not.to.be.undefined;
            expect(loadedUser!.access_token).not.to.be.undefined;
            
            await qr.release();
        })));

    });

    describe("doesn't allow the same relation to be used twice", function() {

        it("should reject the saving attempt", () => Promise.all(connections.map(async connection => {
            const qr = connection.createQueryRunner();
            const userRepository = connection.getRepository(User);
            const accessTokenRepository = connection.getRepository(AccessToken);

            const newUser = userRepository.create(qr);
            newUser.email = "mwelnick@test.com";
            await userRepository.save(qr, newUser);

            const newAccessToken1 = accessTokenRepository.create(qr);
            newAccessToken1.user = newUser;
            await accessTokenRepository.save(qr, newAccessToken1);

            const newAccessToken2 = accessTokenRepository.create(qr);
            newAccessToken2.user = newUser;

            let error: Error | null = null;
            try {
                await accessTokenRepository.save(qr, newAccessToken2);
            } catch (err) {
                error = err;
            }

            expect(error).to.be.instanceof(Error);
            expect(await userRepository.count(qr, {})).to.equal(1);
            expect(await accessTokenRepository.count(qr, {})).to.equal(1);
            
            await qr.release();
        })));

    });

});
