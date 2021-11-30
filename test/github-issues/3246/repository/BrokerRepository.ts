import { EntityRepository, AbstractRepository, QueryRunner } from "../../../../src";
import { Broker } from "../entity/Broker";

@EntityRepository(Broker)
export class BrokerRepository extends AbstractRepository<Broker> {
  async createBroker(queryRunner: QueryRunner,broker: Broker) {
    return this.repository.save(queryRunner, broker);
  }
}
