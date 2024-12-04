import TelegramBot from 'node-telegram-bot-api';

export type BotParams = {
  BOT_TOKEN: string;
}

export class Bot {
  bot: TelegramBot;

  constructor({ BOT_TOKEN }: BotParams) {
    this.bot = new TelegramBot(BOT_TOKEN, {polling: true});
  }

  launch() {}

  async sendMessage(chatId: TelegramBot.ChatId, message: string, options?: TelegramBot.SendMessageOptions): Promise<TelegramBot.Message> {
    return this.bot.sendMessage(chatId, message, options);
  }
}
