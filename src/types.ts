export type OrderList = {
  list: Order[],
  total: number,
};

export type Order = {
  id: number;         // 1568994
  type: string;       // "Public"
  market: string;     // "Open"
  origin: string;     // "TPbWrj8QrRShUyJ1bWiWASih56deqjw7Rh"
  target: string;     // "TASuehsYcMxoZ6PgskYa5XHsCqJDVkdEHJ"
  price: number;      // 90
  amount: number;     // 64000
  freeze: number;     // 5292000000
  frozen: number;     // 5292000000
  resource: number;   // 0
  locked: boolean;    // true
  duration: number;   // 300
  payment: number;    // 5780000
  partfill: boolean;  // false
  extend: boolean;    // false
  maxlock: number;    // -1
  status: string;     // "Completed"
  archive: boolean;   // false
  created_at: string; // "2024-11-16T09:46:15.224Z"
  updated_at: string; // "2024-11-16T09:46:21.176Z"
};
