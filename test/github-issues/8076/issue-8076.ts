import { expect } from "chai";
import "reflect-metadata";
import { Connection } from "../../../src";
import { closeTestingConnections, createTestingConnections, reloadTestingDatabases } from "../../utils/test-utils";
import { Category } from "./entity/Category";
import { Site } from "./entity/Site";
import { Member } from "./entity/Member";

describe("github issues > #8076 Add relation options to all tree queries (missing ones)", () => {

  let connections: Connection[];

  before(async () => connections = await createTestingConnections({
    entities: [Category, Site, Member],
    schemaCreate: true,
    dropSchema: true
  }));

  beforeEach(async () => {
    await reloadTestingDatabases(connections);
    for (let connection of connections) {
      const qr = connection.createQueryRunner();
      let categoryRepo = connection.getRepository(Category);
      let siteRepo = connection.getRepository(Site);
      let memberRepo = connection.getRepository(Member);

      let c1: Category = new Category();
      c1.title = "Category 1";
      c1.parentCategory = null;
      c1.childCategories = [];
      c1.sites = [];

      let c2: Category = new Category();
      c2.title = "Category 2";
      c2.parentCategory = null;
      c2.childCategories = [];
      c2.sites = [];

      let c3: Category = new Category();
      c3.title = "Category 1.1";
      c3.parentCategory = c1;
      c3.childCategories = [];
      c3.sites = [];

      let c4: Category = new Category();
      c4.title = "Category 1.1.1";
      c4.parentCategory = c3;
      c4.childCategories = [];
      c4.sites = [];

      c1.childCategories = [c3];
      c3.childCategories = [c4];

      let s1: Site = new Site();
      s1.title = "Site of Category 1";
      s1.parentCategory = c1;

      let s2: Site = new Site();
      s2.title = "Site of Category 1";
      s2.parentCategory = c1;

      let s3: Site = new Site();
      s3.title = "Site of Category 1.1";
      s3.parentCategory = c3;

      let s4: Site = new Site();
      s4.title = "Site of Category 1.1";
      s4.parentCategory = c3;

      let s5: Site = new Site();
      s5.title = "Site of Category 1.1.1";
      s5.parentCategory = c4;

      let m1: Member = new Member();
      m1.title = "Test";
      m1.category = c1;

      // Create the categories
      c1 = await categoryRepo.save(qr, c1);
      c2 = await categoryRepo.save(qr, c2);
      c3 = await categoryRepo.save(qr, c3);
      c4 = await categoryRepo.save(qr, c4);

      // Create the sites
      await siteRepo.save(qr, s1);
      await siteRepo.save(qr, s2);
      await siteRepo.save(qr, s3);
      await siteRepo.save(qr, s4);
      await siteRepo.save(qr, s5);

      // Create the member relation
      await memberRepo.save(qr, m1);

      // Set the just created relations correctly
      c1.sites = [s1, s2];
      c2.sites = [];
      c3.sites = [s3, s4];
      c4.sites = [s5];
      await qr.release();
    }
  });

  after(() => closeTestingConnections(connections));

  it("should return tree without sites relations", async () => await Promise.all(connections.map(async connection => {

    const qr = connection.createQueryRunner();
    let result = await connection.getTreeRepository(Category).findTrees(qr);

    // The complete tree should exist but other relations than the parent- / child-relations should not be loaded
    expect(result).to.have.lengthOf(2);
    expect(result[0].sites).equals(undefined);
    expect(result[0].childCategories).to.have.lengthOf(1);
    expect(result[0].childCategories[0].childCategories).to.have.lengthOf(1);
    expect(result[0].childCategories[0].childCategories[0].sites).equal(undefined);

    await qr.release();
  })));

  it("should return tree with sites relations", async () => await Promise.all(connections.map(async connection => {

    const qr = connection.createQueryRunner();
    let result = await connection.getTreeRepository(Category).findTrees(qr, { relations: ["sites"] });
    await qr.release();

    // The complete tree should exist and site relations should not be loaded for every category
    expect(result).to.have.lengthOf(2);
    expect(result[0].sites).lengthOf(2);
    expect(result[1].sites).to.be.an("array");
    expect(result[1].sites).to.have.lengthOf(0);
    expect(result[0].childCategories[0].sites).to.have.lengthOf(2);
    expect(result[0].childCategories[0].childCategories[0].sites).to.have.lengthOf(1);
    expect(result[0].childCategories[0].childCategories[0].sites).to.be.an("array");
    expect(result[0].childCategories[0].childCategories[0].sites[0].title).to.be.equal("Site of Category 1.1.1");
  })));

  it("should return roots without member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();

    let result = await connection.getTreeRepository(Category).findRoots(qr);
    await qr.release();

    expect(result).to.have.lengthOf(2);
    expect(result[0].sites).equals(undefined);
    expect(result[0].members).equal(undefined);
    expect(result[0].childCategories).equal(undefined);
  })));

  it("should return roots with member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();

    let result = await connection.getTreeRepository(Category).findRoots(qr, { relations: ["members"] });
    await qr.release();

    expect(result).to.have.lengthOf(2);
    expect(result[0].sites).equals(undefined);
    expect(result[0].members).to.have.lengthOf(1);
    expect(result[0].members[0].title).to.be.equal("Test");
    expect(result[0].childCategories).to.be.equal(undefined);
  })));

  it("should return descendants without member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c1 = await connection.getRepository(Category).findOne(qr, { title: "Category 1" });
    let result = await connection.getTreeRepository(Category).findDescendants(qr, c1!);
    result.sort((a, b) => a.pk - b.pk);
    await qr.release();

    expect(result).to.have.lengthOf(3);

    expect(result[0].title).equals("Category 1");
    expect(result[0].members).equals(undefined);
    expect(result[0].sites).equals(undefined);

    expect(result[1].title).equals("Category 1.1");
    expect(result[1].members).equals(undefined);
    expect(result[1].sites).equals(undefined);

    expect(result[2].title).equals("Category 1.1.1");
    expect(result[2].members).equals(undefined);
    expect(result[2].sites).equals(undefined);
  })));

  it("should return descendants with member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c1 = await connection.getRepository(Category).findOne(qr, { title: "Category 1" });
    let result = await connection.getTreeRepository(Category).findDescendants(qr, c1!, { relations: ["members"] });
    result.sort((a, b) => a.pk - b.pk);

    await qr.release();
    expect(result).to.have.lengthOf(3);

    expect(result[0].title).equals("Category 1");
    expect(result[0].members).to.have.lengthOf(1);
    expect(result[0].members[0].title).equals("Test");
    expect(result[0].sites).equals(undefined);

    expect(result[1].title).equals("Category 1.1");
    expect(result[1].members).to.be.an("array");
    expect(result[1].members).to.have.lengthOf(0);
    expect(result[1].sites).equals(undefined);

    expect(result[2].title).equals("Category 1.1.1");
    expect(result[2].members).to.be.an("array");
    expect(result[2].members).to.have.lengthOf(0);
    expect(result[2].sites).equals(undefined);
  })));

  it("should return descendants tree without member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c1 = await connection.getRepository(Category).findOne(qr, { title: "Category 1" });
    let result = await connection.getTreeRepository(Category).findDescendantsTree(qr, c1!);

    await qr.release();
    expect(result.title).to.be.equal("Category 1");

    expect(result.childCategories[0].title).equals("Category 1.1");
    expect(result.childCategories[0].members).to.be.undefined;

    expect(result.childCategories[0].childCategories[0].title).equals("Category 1.1.1");
    expect(result.childCategories[0].childCategories[0].members).to.be.undefined;
  })));

  it("should return descendants tree with member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c1 = await connection.getRepository(Category).findOne(qr, { title: "Category 1" });
    let result = await connection.getTreeRepository(Category).findDescendantsTree(qr, c1!, { relations: ["members"] });

    await qr.release();
    expect(result.title).to.be.equal("Category 1");

    expect(result.childCategories[0].title).equals("Category 1.1");
    expect(result.childCategories[0].members).to.be.an("array");
    expect(result.childCategories[0].members).to.have.lengthOf(0);

    expect(result.childCategories[0].childCategories[0].title).equals("Category 1.1.1");
    expect(result.childCategories[0].childCategories[0].members).to.be.an("array");
    expect(result.childCategories[0].childCategories[0].members).to.have.lengthOf(0);
  })));

  it("should return ancestors without member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c3 = await connection.getRepository(Category).findOne(qr, { title: "Category 1.1.1" });
    let result = await connection.getTreeRepository(Category).findAncestors(qr, c3!);
    result.sort((a, b) => a.pk - b.pk);

    await qr.release();
    expect(result).to.have.lengthOf(3);

    expect(result[0].title).equals("Category 1");
    expect(result[0].members).equals(undefined);
    expect(result[0].sites).equals(undefined);

    expect(result[1].title).equals("Category 1.1");
    expect(result[1].members).equals(undefined);
    expect(result[1].sites).equals(undefined);

    expect(result[2].title).equals("Category 1.1.1");
    expect(result[2].members).equals(undefined);
    expect(result[2].sites).equals(undefined);
  })));

  it("should return ancestors with member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c3 = await connection.getRepository(Category).findOne(qr, { title: "Category 1.1.1" });
    let result = await connection.getTreeRepository(Category).findAncestors(qr, c3!, { relations: ["members"] });
    result.sort((a, b) => a.pk - b.pk);

    await qr.release();
    expect(result[0].title).equals("Category 1");
    expect(result[0].members).to.have.lengthOf(1);
    expect(result[0].members[0].title).equals("Test");
    expect(result[0].sites).equals(undefined);

    expect(result[1].title).equals("Category 1.1");
    expect(result[1].members).to.be.an("array");
    expect(result[1].members).to.have.lengthOf(0);
    expect(result[1].sites).equals(undefined);

    expect(result[2].title).equals("Category 1.1.1");
    expect(result[1].members).to.be.an("array");
    expect(result[2].members).to.have.lengthOf(0);
    expect(result[2].sites).equals(undefined);
  })));

  it("should return ancestors tree without member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    
    let c3 = await connection.getRepository(Category).findOne(qr, { title: "Category 1.1.1" });
    let result = await connection.getTreeRepository(Category).findAncestorsTree(qr, c3!);

    await qr.release();
    expect(result.title).to.be.equal("Category 1.1.1");

    expect(result.parentCategory!.title).equals("Category 1.1");
    expect(result.parentCategory!.members).to.be.undefined;

    expect(result.parentCategory!.parentCategory!.title).equals("Category 1");
    expect(result.parentCategory!.parentCategory!.members).to.be.undefined;
  })));

  it("should return ancestors tree with member relations", async () => await Promise.all(connections.map(async connection => {
    const qr = connection.createQueryRunner();
    let c3 = await connection.getRepository(Category).findOne(qr, { title: "Category 1.1.1" });
    let result = await connection.getTreeRepository(Category).findAncestorsTree(qr, c3!, { relations: ["members"] });

    await qr.release();
    expect(result.title).to.be.equal("Category 1.1.1");

    expect(result.parentCategory!.title).equals("Category 1.1");
    expect(result.parentCategory!.members).to.be.an("array");
    expect(result.parentCategory!.members).to.have.lengthOf(0);

    expect(result.parentCategory!.parentCategory!.title).equals("Category 1");
    expect(result.parentCategory!.parentCategory!.members).to.be.an("array");
    expect(result.parentCategory!.parentCategory!.members).to.have.lengthOf(1);
    expect(result.parentCategory!.parentCategory!.members[0].title).equals("Test");
  })));
});
