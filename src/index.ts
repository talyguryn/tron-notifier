import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
const __dirname = path.resolve();

import cron from 'node-cron';

import { TronNetwork } from './tron-network';
import { Bot } from './bot';
import { LowdbDatabase } from './database/lowdb';
import { DatabaseData } from './database';
import { Order } from './types';

const CRON_SCHEDULE_PULL_UPDATES = process.env.CRON_SCHEDULE_PULL_UPDATES;
const CRON_SCHEDULE_SEND_REPORT = process.env.CRON_SCHEDULE_SEND_REPORT;
const CRON_SCHEDULE_SEND_REPORT_DAILY =
  process.env.CRON_SCHEDULE_SEND_REPORT_DAILY;

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const CHANNEL_ID = process.env.CHANNEL_ID || '';

const dbOrders = new LowdbDatabase<DatabaseData<Order>>({
  pathToDbFolder: path.join(__dirname, 'database'),
});
const dbOrdersReported = new LowdbDatabase<DatabaseData<Boolean>>({
  pathToDbFolder: path.join(__dirname, 'database'),
});

const dbOrdersDaily = new LowdbDatabase<DatabaseData<Order>>({
  pathToDbFolder: path.join(__dirname, 'database'),
});
const bot = new Bot({ BOT_TOKEN });

console.log('Starting...', new Date().toISOString());

(async function main() {
  await dbOrders.connect({ dbName: 'orders' });
  await dbOrdersReported.connect({ dbName: 'orders-reported' });
  await dbOrdersDaily.connect({ dbName: 'orders-daily' });

  bot.launch();

  const tronNetwork = new TronNetwork(
    dbOrders,
    dbOrdersReported,
    dbOrdersDaily
  );

  /** Schedule pulling updates */
  cron.schedule(CRON_SCHEDULE_PULL_UPDATES, async () => {
    await tronNetwork.pullUpdates();
  });

  /** Schedule sending report */
  cron.schedule(CRON_SCHEDULE_SEND_REPORT, async () => {
    const newOrders = await tronNetwork.getNewOrders();
    const message = await tronNetwork.composeMessage(newOrders);

    if (!message) {
      console.error('Public report message is empty. Skipping sending report');
      return;
    }

    /** Send message to main channel */
    try {
      const channelMessage = await bot.sendMessage(CHANNEL_ID, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      console.error('Error while sending message', error.message);
    }
  });

  /** Schedule sending daily report */
  cron.schedule(CRON_SCHEDULE_SEND_REPORT_DAILY, async () => {
    const message = await tronNetwork.composeDailyMessage();

    if (!message) {
      console.error('Daily report message is empty. Skipping sending report');
      return;
    }

    /** Send message to main channel */
    try {
      const channelMessage = await bot.sendMessage(CHANNEL_ID, message, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      });
    } catch (error) {
      console.error('Error while sending message', error.message);
    }
  });
})();
