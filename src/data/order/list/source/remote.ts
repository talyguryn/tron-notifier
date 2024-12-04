import { OrderList } from '../../../../types';

import axios from 'axios';

export const getOrdersList = async function (): Promise<OrderList> {
  const result = await axios.get('https://api.tronenergy.market/order/list/?limit=100&skip=0')
    .then(response => {
      return response.data
    })

  return result;
}
