import { Order, OrderList } from './types';
import { Database, DatabaseData } from './database';

import { getOrdersList } from './data/order/list/source/remote';
import { parseOrderList } from './data/order/list/parse';

export class TronNetwork {
  private ordersList: OrderList;
  private dbOrders: Database<DatabaseData<Order>>;
  private dbOrdersReported: Database<DatabaseData<Boolean>>;
  private dbOrdersDaily: Database<DatabaseData<Order>>;
  private dbOrdersReportedDaily: Database<DatabaseData<Boolean>>;

  constructor(
    dbOrders: Database<DatabaseData<Order>>,
    dbOrdersReported: Database<DatabaseData<Boolean>>,
    dbOrdersDaily: Database<DatabaseData<Order>>
  ) {
    this.dbOrders = dbOrders;
    this.dbOrdersReported = dbOrdersReported;
    this.dbOrdersDaily = dbOrdersDaily;
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
      // console.log(`Order ${order.id} already reported`);
      if (await this.dbOrdersReported.read(order.id.toString())) continue;
      // console.log(`Order ${order.id} already in the database`);
      if (await this.dbOrders.read(order.id.toString())) continue;

      await this.dbOrders.create(order.id.toString(), { data: order });
      await this.dbOrdersDaily.create(order.id.toString(), { data: order });
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

    let numberOfOrders = 0;
    let totalAmount = 0;
    let totalPayout = 0;

    let message = ``;
    const results: { [key: string]: number } = {};

    for (const order of orders) {
      const amount = order.amount.toLocaleString();
      const duration = this.prettifyDuration(order.duration);

      // check if order exists in the database
      if (await this.dbOrdersReported.read(order.id.toString())) {
        continue;
      } else {
        await this.dbOrdersReported.create(order.id.toString(), { data: true });
        await this.dbOrders.delete(order.id.toString());
      }

      const key = `${amount} / ${order.price} / ${duration}`;

      results[key] = results[key] ? ++results[key] : 1;

      numberOfOrders++;
      totalAmount += order.amount;
      totalPayout += (order.amount * order.price) / 1000000;
    }

    for (const [key, value] of Object.entries(results)) {
      const price = parseInt(key.split('/')[1].trim(), 10);
      if (price < 60 || price > 120) continue;

      message += `${key} - ${value} order${value > 1 ? 's' : ''}\n`;
    }

    // Add message with total orders
    if (numberOfOrders === 0) return '';
    message += `\nTotal: <b>${numberOfOrders} order${
      numberOfOrders > 1 ? 's' : ''
    }</b> for the last hour\n`;
    message += `Volume: ${totalAmount.toLocaleString()} energy\n`;
    message += `Payout: <b>${(
      totalPayout * 0.85
    ).toLocaleString()} trx</b> = ${totalPayout.toLocaleString()} trx – 15% fee\n`;

    return message;
  }

  public async composeDailyMessage(): Promise<string> {
    const ordersFromDb = await this.dbOrdersDaily.readAll();
    const ordersKeys = [];

    Object.keys(ordersFromDb).forEach((key) => {
      ordersKeys.push(key);
    });

    const orders = ordersKeys
      .map((key) => ordersFromDb[key].data)
      .sort((a, b) => b.price - a.price);

    let numberOfOrders = 0;
    let totalAmount = 0;
    let totalPayout = 0;

    let message = `<b>24 hours #daily report</b>\n\n`;
    const results: { [key: string]: number } = {};

    for (const order of orders) {
      const amount = order.amount.toLocaleString();
      const duration = this.prettifyDuration(order.duration);

      const key = `${amount} / ${order.price} / ${duration}`;

      results[key] = results[key] ? ++results[key] : 1;

      numberOfOrders++;
      totalAmount += order.amount;
      totalPayout += (order.amount * order.price) / 1000000;

      await this.dbOrdersDaily.delete(order.id.toString());
    }

    for (const [key, value] of Object.entries(results)) {
      const price = parseInt(key.split('/')[1].trim(), 10);
      if (price < 60 || price > 120) continue;

      message += `${key} - ${value} order${value > 1 ? 's' : ''}\n`;
    }

    // Add message with total orders
    if (numberOfOrders === 0) return '';
    message += `\nTotal: <b>${numberOfOrders} order${
      numberOfOrders > 1 ? 's' : ''
    }</b> for the last 24 hours\n`;
    message += `Volume: ${totalAmount.toLocaleString()} energy\n`;
    message += `Payout: <b>${(
      totalPayout * 0.85
    ).toLocaleString()} trx</b> = ${totalPayout.toLocaleString()} trx – 15% fee\n`;

    return message;
  }

  private prettifyDuration(duration: number): string {
    if (duration < 3600) {
      return `${duration / 60} min`;
    } else if (duration < 86400) {
      return `${duration / 3600} hours`;
    } else {
      return `${duration / 86400} days`;
    }
  }
}
