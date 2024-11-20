import { Order, OrderList } from './types';
import { Database, DatabaseData } from './database';

import { getOrdersList } from './data/order/list/source/remote';
import { parseOrderList } from './data/order/list/parse';

export class TronNetwork {
  private ordersList: OrderList;
  private dbOrders: Database<DatabaseData<Order>>;
  private dbOrdersReported: Database<DatabaseData<Boolean>>;

  constructor(
    dbOrders: Database<DatabaseData<Order>>,
    dbOrdersReported: Database<DatabaseData<Boolean>>
  ) {
    this.dbOrders = dbOrders;
    this.dbOrdersReported = dbOrdersReported;
  }

  public async pullUpdates() {
    console.log('Pulling updates...');

    const ordersList = parseOrderList(await getOrdersList());
    this.ordersList = parseOrderList(ordersList);

    await this.saveOrdersToDatabase(this.ordersList.list);

    console.log('Updates pulled');
  }

  private async saveOrdersToDatabase(orders: Order[]): Promise<void> {
    for await (const order of orders) {
      if (await this.dbOrdersReported.read(order.id.toString())) {
        // console.log(`Order ${order.id} already reported`);
        continue;
      }

      if (await this.dbOrders.read(order.id.toString())) {
        // console.log(`Order ${order.id} already in the database`);
        continue;
      }

      await this.dbOrders.create(order.id.toString(), { data: order });
    }
  }

  public async getNewOrders(): Promise<Order[]> {
    const ordersFromDb = await this.dbOrders.readAll();
    const ordersKeys = [];

    Object.keys(ordersFromDb).forEach((key) => {
      ordersKeys.push(key);
    });

    return ordersKeys.map((key) => ordersFromDb[key].data);
  }

  public async composeMessage(orders: Order[]): Promise<string> {
    orders = orders.sort((a, b) => b.price - a.price);

    let message = ``;
    const results: { [key: string]: number } = {};

    for (const order of orders) {
      const amount = order.amount.toLocaleString();

      // check if order exists in the database
      if (await this.dbOrdersReported.read(order.id.toString())) {
        continue;
      } else {
        await this.dbOrdersReported.create(order.id.toString(), { data: true });
        await this.dbOrders.delete(order.id.toString());
      }

      const key = `${amount} / ${order.price}`;

      results[key] = results[key] ? ++results[key] : 1;
    }

    for (const [key, value] of Object.entries(results)) {
      message += `${key} - ${value} order${value > 1 ? 's' : ''}\n`;
    }

    // Add message with total orders
    let sum = 0;
    for (const value of Object.values(results)) sum += +value;
    if (sum === 0) return '';
    message += `\nTotal ${sum} order${sum > 1 ? 's' : ''} for the last hour`;

    return message;
  }
}
