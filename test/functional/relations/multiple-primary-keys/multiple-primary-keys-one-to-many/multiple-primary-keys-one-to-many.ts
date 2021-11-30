import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../../../src";
import { closeTestingConnections, createTestingConnections } from "../../../../utils/test-utils";
import { User } from "./entity/User";
import { Setting } from "./entity/Setting";

/**
 *  Using OneToMany relation with composed primary key should not error and work correctly
 */
describe("relations > multiple-primary-keys > one-to-many", () => {

	let connections: Connection[];

	before(async () => connections = await createTestingConnections({
		entities: [User,Setting],
		schemaCreate: true,
		dropSchema: true
	}));

	after(() => closeTestingConnections(connections));

	async function insertSimpleTestData(connection: Connection) {
		const userRepo = connection.getRepository(User);
		const qr = connection.createQueryRunner();
		// const settingRepo = connection.getRepository(Setting);

		const user = new User(1, "FooGuy");
		const settingA = new Setting(1, "A", "foo");
		const settingB = new Setting(1, "B", "bar");
		user.settings = [settingA,settingB];

		const res = await userRepo.save(qr, user);
		await qr.release();
		return res;
	}



	it("should correctly insert relation items", () => Promise.all(connections.map(async connection => {

		const qr = connection.createQueryRunner();
		const userEntity = await insertSimpleTestData(connection);
		const persistedSettings = await connection.getRepository(Setting).find(qr);
	
		expect(persistedSettings!).not.to.be.undefined;
		expect(persistedSettings.length).to.equal(2);
		expect(persistedSettings[0].assetId).to.equal(userEntity.id);
		expect(persistedSettings[1].assetId).to.equal(userEntity.id);
	
		await qr.release();
	})));
	
	it("should correctly load relation items", () => Promise.all(connections.map(async connection => {
	
		const qr = connection.createQueryRunner();
		await insertSimpleTestData(connection);
		const user = await connection.getRepository(User).findOne(qr, {relations:["settings"]});
	
		expect(user!).not.to.be.undefined;
		expect(user!.settings).to.be.an("array");
		expect(user!.settings!.length).to.equal(2);
	
		await qr.release();
	})));
	
	it("should correctly update relation items", () => Promise.all(connections.map(async connection => {
	
		const qr = connection.createQueryRunner();
		await insertSimpleTestData(connection);
		const userRepo = connection.getRepository(User);
	
		await userRepo.save(qr, [{
			id:1,
			settings:[
				{id:1,name:"A",value:"foobar"},
				{id:1,name:"B",value:"testvalue"},
			]
		}]);
	
		const user = await connection.getRepository(User).findOne(qr, {relations:["settings"]});
	
		// check the saved items have correctly updated value
		expect(user!).not.to.be.undefined;
		expect(user!.settings).to.be.an("array");
		expect(user!.settings!.length).to.equal(2);
		user!.settings.forEach(setting=>{
			if(setting.name==="A") expect(setting.value).to.equal("foobar");
			else expect(setting.value).to.equal("testvalue");
		});
	
		// make sure only 2 entries are in db, initial ones should have been updated
		const settings = await connection.getRepository(Setting).find(qr);
		expect(settings).to.be.an("array");
		expect(settings!.length).to.equal(2);
	
		await qr.release();
	})));
	
	it("should correctly delete relation items", () => Promise.all(connections.map(async connection => {
	
		const qr = connection.createQueryRunner();
		await insertSimpleTestData(connection);
		const userRepo = connection.getRepository(User);
	
		await userRepo.save(qr, [{
			id:1,
			settings:[]
		}]);
	
		const user = await connection.getRepository(User).findOne(qr, {relations:["settings"]});
	
		// check that no relational items are found
		expect(user!).not.to.be.undefined;
		expect(user!.settings).to.be.an("array");
		expect(user!.settings!.length).to.equal(0);
	
		// check there are no orphane relational items
		const settings = await connection.getRepository(Setting).find(qr);
		expect(settings).to.be.an("array");
		expect(settings!.length).to.equal(0);
	
		await qr.release();
	})));
		
});
