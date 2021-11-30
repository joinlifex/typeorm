import { Order } from "../entity/Order";
import { EntityRepository, AbstractRepository, QueryRunner } from "../../../../src";

@EntityRepository(Order)
export class OrderRepository extends AbstractRepository<Order> {
  async createOrder(queryRunner: QueryRunner, order: Order) {
    return this.repository.save(queryRunner, order);
  }
}
