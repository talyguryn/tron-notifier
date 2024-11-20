import { OrderList } from '../../../../types';

import fs from 'fs';

export const getSourceList = async function (): Promise<OrderList> {
  const result = fs.readFileSync('./data/orders-list.json', 'utf8');

  return JSON.parse(result);
}
