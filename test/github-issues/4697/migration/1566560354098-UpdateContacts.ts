import {MigrationInterface, QueryRunner} from "../../../../src";
import {Item} from "../entity/item.entity";

export class UpdateContacts1566560354098 implements MigrationInterface {

  public async up({connection}: QueryRunner): Promise<any> {
    const qr = connection.createQueryRunner();
    const repo = connection.getMongoRepository(Item);
    const items: Array<Item> = await repo.find(qr);

    items.forEach((item) => {
      if (!item.contacts) {
        item.contacts = [item.contact || ""];
      }
    });

    await repo.save(qr, items);
    await qr.release();
  }

  public async down({connection}: QueryRunner): Promise<any> {
    const repo = connection.getMongoRepository(Item);
    const qr = connection.createQueryRunner();
    const items: Array<Item> = await repo.find(qr);

    items.forEach((item) => {
      item.contact = item.contacts[0];
    });

    await repo.save(qr, items);
    await qr.release();
  }

}
