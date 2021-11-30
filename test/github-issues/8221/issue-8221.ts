import { expect } from "chai";
import "reflect-metadata";
import { Connection, DeepPartial, QueryRunner, Repository } from "../../../src";
import { closeTestingConnections, createTestingConnections } from "../../utils/test-utils";
import { User } from "./entity/User";
import { Setting } from "./entity/Setting";
import { SettingSubscriber } from "./entity/SettingSubscriber";

/**
 *  Using OneToMany relation with composed primary key should not error and work correctly
 */
describe("github issues > #8221", () => {

	let connections: Connection[];

	before(async () => connections = await createTestingConnections({
		entities: [User,Setting],
		subscribers: [SettingSubscriber],
		schemaCreate: true,
		dropSchema: true
	}));

	after(() => closeTestingConnections(connections));

	function insertSimpleTestData(userRepo: Repository<User>, queryRunner: QueryRunner) {
		// const settingRepo = connection.getRepository(Setting);

		const user = new User(1, "FooGuy");
		const settingA = new Setting(1, "A", "foo");
		const settingB = new Setting(1, "B", "bar");
		user.settings = [settingA,settingB];

		return userRepo.save(queryRunner, user);
	}

	// important: must not use Promise.all! parallel execution against different drivers would mess up the counter within the SettingSubscriber!

	it("afterLoad entity modifier must not make relation key matching fail", async () => {
		for(const connection of connections) {
			const qr = connection.createQueryRunner();
			const userRepo = connection.getRepository(User);
			const subscriber = (connection.subscribers[0] as SettingSubscriber);
			subscriber.reset();

			await insertSimpleTestData(userRepo, qr);
			subscriber.reset();
			const users: DeepPartial<User>[] = [{
				id:1,
				settings: [
					{ assetId:1, name:"A", value:"foobar" },
					{ assetId:1, name:"B", value:"testvalue" },
				]
			}];
			await userRepo.save(qr, users);

			// we use a subscriber to count generated Subjects based on how often beforeInsert/beforeRemove/beforeUpdate has been called.
			// the save query should only update settings, so only beforeUpdate should have been called.
			// if beforeInsert/beforeUpdate has been called, this would indicate that key matching has failed.
			// the resulting state would be the same, but settings entities would be deleted and inserted instead.

			expect(subscriber.counter.deletes).to.equal(0);
			expect(subscriber.counter.inserts).to.equal(0);
			expect(subscriber.counter.updates).to.equal(2);

			await qr.release();
		}
	});

});
