import "reflect-metadata";
import {createTestingConnections, closeTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src/connection/Connection";
import {Category} from "./entity/Category";

describe("github issues > #904 Using closure tables without @TreeLevelColumn will always fail on insert", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("should work correctly when saving using parent category", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const queryRunner = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c11.parentCategory = c1;
        c12.parentCategory = c1;

        await categoryRepository.save(queryRunner, a1);
        await categoryRepository.save(queryRunner, b1);
        await categoryRepository.save(queryRunner, c1);
        await categoryRepository.save(queryRunner, c11);
        await categoryRepository.save(queryRunner, c12);

        const roots = await categoryRepository.findRoots(queryRunner);
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
            },
            {
                id: 2,
                name: "b1",
            },
            {
                id: 3,
                name: "c1",
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(queryRunner, c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            childCategories: [{
                id: 4,
                name: "c11",
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                childCategories: []
            }]
        });

        queryRunner.release();
    })));

    it("should work correctly when saving using children categories", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const queryRunner = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c1.childCategories = [c11];

        await categoryRepository.save(queryRunner, a1);
        await categoryRepository.save(queryRunner, b1);
        await categoryRepository.save(queryRunner, c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(queryRunner, c1);
        // await categoryRepository.save(qr, c11);
        // await categoryRepository.save(qr, c12);

        const roots = await categoryRepository.findRoots(queryRunner);
        roots.should.be.eql([
            {
                id: 1,
                name: "a1",
            },
            {
                id: 2,
                name: "b1",
            },
            {
                id: 3,
                name: "c1",
            },
        ]);

        const c1Tree = await categoryRepository.findDescendantsTree(queryRunner, c1);
        c1Tree.should.be.equal(c1);
        c1Tree!.should.be.eql({
            id: 3,
            name: "c1",
            childCategories: [{
                id: 4,
                name: "c11",
                childCategories: []
            }, {
                id: 5,
                name: "c12",
                childCategories: []
            }]
        });

        queryRunner.release();
    })));

    it("should be able to retrieve the whole tree", () => Promise.all(connections.map(async connection => {
        const categoryRepository = connection.getTreeRepository(Category);
        const queryRunner = connection.createQueryRunner();

        const a1 = new Category();
        a1.name = "a1";

        const b1 = new Category();
        b1.name = "b1";

        const c1 = new Category();
        c1.name = "c1";

        const c11 = new Category();
        c11.name = "c11";

        const c12 = new Category();
        c12.name = "c12";

        c1.childCategories = [c11];

        await categoryRepository.save(queryRunner, a1);
        await categoryRepository.save(queryRunner, b1);
        await categoryRepository.save(queryRunner, c1);

        c1.childCategories.push(c12);
        await categoryRepository.save(queryRunner, c1);

        const tree = await categoryRepository.findTrees(queryRunner);
        tree!.should.be.eql(
            [
                {
                    id: 1,
                    name: "a1",
                    childCategories: []
                },
                {
                    id: 2,
                    name: "b1",
                    childCategories: []
                },
                {
                    id: 3,
                    name: "c1",
                    childCategories: [{
                        id: 4,
                        name: "c11",
                        childCategories: []
                    }, {
                        id: 5,
                        name: "c12",
                        childCategories: []
                    }]
                }
            ]);

            queryRunner.release();
    })));



});
