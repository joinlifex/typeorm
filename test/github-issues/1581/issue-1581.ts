import "reflect-metadata";
import {closeTestingConnections, createTestingConnections, reloadTestingDatabases} from "../../utils/test-utils";
import {Connection} from "../../../src";
import {User} from "./entity/User";
import {Product} from "./entity/Product";
import {DeliverySlot} from "./entity/DeliverySlot";
import {Order} from "./entity/Order";
import {OrderItem} from "./entity/OrderItem";

describe.skip("github issues > #1581 Composite key breaks OneToMany relation", () => {

    let connections: Connection[];
    before(async () => connections = await createTestingConnections({
        entities: [__dirname + "/entity/*{.js,.ts}"],
        enabledDrivers: ["mysql"]
    }));
    beforeEach(() => reloadTestingDatabases(connections));
    after(() => closeTestingConnections(connections));

    it("throws an error because there is no object id defined", () => Promise.all(connections.map(async connection => {

        const qr = connection.createQueryRunner();
        const user1 = new User();
        user1.email = "user1@example.com";
        await connection.manager.save(qr, user1);

        const product1 = new Product();
        product1.id = 1;
        product1.name = "Product 1";
        await connection.manager.save(qr, product1);

        const product2 = new Product();
        product2.id = 3;
        product2.name = "Product 2";
        await connection.manager.save(qr, product2);

        const slot1 = new DeliverySlot();
        slot1.name = "Slot 1";
        await connection.manager.save(qr, slot1);

        const slot2 = new DeliverySlot();
        slot2.name = "Slot 2";
        await connection.manager.save(qr, slot2);

        const order1 = new Order();
        order1.deliverySlot = slot1;
        order1.user = user1;
        order1.enabled = true;
        await connection.manager.save(qr, order1);

        const item1 = new OrderItem();
        item1.order = order1;
        item1.product = product1;
        item1.amount = 3;
        await connection.manager.save(qr, item1);

        await connection.manager
            .createQueryBuilder(Order, "order")
            .leftJoinAndSelect("order.deliverySlot", "deliverySlot")
            .leftJoinAndSelect("order.user", "user")
            .leftJoinAndSelect("order.items", "items")
            .getMany(qr);

        await qr.release();
        // const orders = await connection.manager.getRepository(RecurringOrder).find(qr, { relations: ["items"] });
        // console.log(orders);
    })));

});
