import "../../../utils/test-setup";
import "reflect-metadata";
import {Category} from "./entity/Category";
import {Connection} from "../../../../src/connection/Connection";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../../utils/test-utils";
import {expect} from "chai";

describe("tree tables > nested-set", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [Category]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("attach should work properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(qr, a1);

        const a11 = new Category();
        a11.name = "a11";
        a11.parentCategory = a1;
        await categoryRepository.save(qr, a11);

        const a111 = new Category();
        a111.name = "a111";
        a111.parentCategory = a11;
        await categoryRepository.save(qr, a111);

        const a12 = new Category();
        a12.name = "a12";
        a12.parentCategory = a1;
        await categoryRepository.save(qr, a12);

        const rootCategories = await categoryRepository.findRoots(qr);
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(qr, a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(qr, a1);
        a1Children.length.should.be.equal(4);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a111"});
        a1Children.should.deep.include({id: 4, name: "a12"});
        await qr.release();
    })));

    it("categories should be attached via children and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(qr, a1);

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        a1.childCategories = [a11, a12];
        await categoryRepository.save(qr, a1);

        const rootCategories = await categoryRepository.findRoots(qr);
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(qr, a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(qr, a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a12"});
        await qr.release();
    })));

    it("categories should be attached via children and saved properly", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";
        await categoryRepository.save(qr, a1);

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        a1.childCategories = [a11, a12];
        await categoryRepository.save(qr, a1);

        const rootCategories = await categoryRepository.findRoots(qr);
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(qr, a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(qr, a1);
        a1Children.length.should.be.equal(3);
        a1Children.should.deep.include({id: 1, name: "a1"});
        a1Children.should.deep.include({id: 2, name: "a11"});
        a1Children.should.deep.include({id: 3, name: "a12"});
        await qr.release();
    })));

    it("categories should be attached via children and saved properly and everything must be saved in cascades", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(qr, a1);

        const rootCategories = await categoryRepository.findRoots(qr);
        rootCategories.should.be.eql([{
            id: 1,
            name: "a1"
        }]);

        const a11Parent = await categoryRepository.findAncestors(qr, a11);
        a11Parent.length.should.be.equal(2);
        a11Parent.should.deep.include({id: 1, name: "a1"});
        a11Parent.should.deep.include({id: 2, name: "a11"});

        const a1Children = await categoryRepository.findDescendants(qr, a1);
        const a1ChildrenNames = a1Children.map(child => child.name);
        a1ChildrenNames.length.should.be.equal(5);
        a1ChildrenNames.should.deep.include("a1");
        a1ChildrenNames.should.deep.include("a11");
        a1ChildrenNames.should.deep.include("a12");
        a1ChildrenNames.should.deep.include("a111");
        a1ChildrenNames.should.deep.include("a112");
        await qr.release();
    })));

    it("findTrees() tests > findTrees should load all category roots and attached children", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(qr, a1);

        const categoriesTree = await categoryRepository.findTrees(qr);
        categoriesTree.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);
        await qr.release();
    })));

    it("findTrees() tests > findTrees should filter by depth if optionally provided", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(qr, a1);

        const categoriesTree = await categoryRepository.findTrees(qr);
        categoriesTree.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);

        const categoriesTreeWithEmptyOptions = await categoryRepository.findTrees(qr, {});
        categoriesTreeWithEmptyOptions.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: [
                            {
                                id: a111.id,
                                name: "a111",
                                childCategories: []
                            },
                            {
                                id: a112.id,
                                name: "a112",
                                childCategories: []
                            }
                        ]
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);

        const categoriesTreeWithDepthZero = await categoryRepository.findTrees(qr, {depth: 0});
        categoriesTreeWithDepthZero.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: []
            }
        ]);

        const categoriesTreeWithDepthOne = await categoryRepository.findTrees(qr, {depth: 1});
        categoriesTreeWithDepthOne.should.be.eql([
            {
                id: a1.id,
                name: "a1",
                childCategories: [
                    {
                        id: a11.id,
                        name: "a11",
                        childCategories: []
                    },
                    {
                        id: a12.id,
                        name: "a12",
                        childCategories: []
                    }
                ]
            }
        ]);
        await qr.release();
    })));

    it("findTrees() tests > findTrees should present a meaningful error message when used with multiple roots + nested sets", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        await categoryRepository.save(qr, a1);

        const b1 = new Category();
        b1.name = "b1";

        await expect(categoryRepository.save(qr, b1)).to.be.rejectedWith("Nested sets do not support multiple root entities.");
        await qr.release();
    })));

    it("findDescendantsTree(qr, ) tests > findDescendantsTree should load all category descendents and nested children", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(qr, a1);

        const categoriesTree = await categoryRepository.findDescendantsTree(qr, a1);
        categoriesTree.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });
        await qr.release();
    })));

    it("findDescendantsTree(qr, ) tests > findDescendantsTree should filter by depth if optionally provided", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const qr = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const a11 = new Category();
        a11.name = "a11";

        const a12 = new Category();
        a12.name = "a12";

        const a111 = new Category();
        a111.name = "a111";

        const a112 = new Category();
        a112.name = "a112";

        a1.childCategories = [a11, a12];
        a11.childCategories = [a111, a112];
        await categoryRepository.save(qr, a1);

        const categoriesTree = await categoryRepository.findDescendantsTree(qr, a1);
        categoriesTree.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });

        const categoriesTreeWithEmptyOptions = await categoryRepository.findDescendantsTree(qr, a1, {});
        categoriesTreeWithEmptyOptions.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: [
                        {
                            id: a111.id,
                            name: "a111",
                            childCategories: []
                        },
                        {
                            id: a112.id,
                            name: "a112",
                            childCategories: []
                        }
                    ]
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });

        const categoriesTreeWithDepthZero = await categoryRepository.findDescendantsTree(qr, a1, {depth: 0});
        categoriesTreeWithDepthZero.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: []
        });

        const categoriesTreeWithDepthOne = await categoryRepository.findDescendantsTree(qr, a1, {depth: 1});
        categoriesTreeWithDepthOne.should.be.eql({
            id: a1.id,
            name: "a1",
            childCategories: [
                {
                    id: a11.id,
                    name: "a11",
                    childCategories: []
                },
                {
                    id: a12.id,
                    name: "a12",
                    childCategories: []
                }
            ]
        });
        await qr.release();
    })));
});
