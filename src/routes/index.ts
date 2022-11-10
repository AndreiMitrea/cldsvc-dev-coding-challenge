import express, { Request, Response } from 'express';
import { sql } from '@databases/sqlite';
import { v4 as uuidv4 } from 'uuid';
import { OrderRequest, GetOrderbookResponse, OrderbookItem } from '../dtos';
import db from '../db';

const router = express.Router();

/*
  let orderbook = { }

  Hint: the data structure used for the orderbook can dramatically
        impact efficiency.
*/

let orderbook: Record<'bids' | 'asks', Record<number, number>> = {
  bids: {
    200: 100,
    210: 100
  },
  asks: {

  }
};

const TYPE_FILLED = 'FILLED'; // order matched entirely
const TYPE_PARTIALLY_FILLED = 'PARTIALLY_FILLED'; // order matched partially and is pending in orderbook
const TYPE_REJECTED = 'REJECTED'; // order failed to match
const TYPE_PENDING = 'PENDING'; // order did not match and is pending in orderbook

// eslint-disable-next-line no-unused-vars
router.post('/order/submit', async (req: Request, res: Response, next: any) => {
  const { amount, price }: OrderRequest = req.body as OrderRequest;
  const absAmount = Math.abs(amount);
  const isBuying = amount > 0;
  const orderType = isBuying ? 'bids' : 'asks';
  const matchingOrderType = isBuying ? 'asks' : 'bids';
  const prices: number[] = Object.keys(orderbook[matchingOrderType]).map(k => +k);
  let responseStatus: string = '';
  
  // If there are no bids on the opposite side of the trade, add the order to the order book.
  if (prices.length === 0) {
    orderbook[orderType][price] = orderbook[orderType][price] ? orderbook[orderType][price] + absAmount : absAmount;
    responseStatus = TYPE_PENDING;
  } else if (isBuying) {
    let currentAmount = absAmount;
    let index = 0;

    while (price >= prices[index] && currentAmount > 0 && index < prices.length) {
      const indexAmount = orderbook['asks'][prices[index]];
      if (currentAmount >= indexAmount) {
        currentAmount -= indexAmount;
        delete orderbook['asks'][prices[index]];
      } else {
        orderbook['asks'][prices[index]] = indexAmount - currentAmount;
        currentAmount = 0;
      }

      index++;
    }

    if (currentAmount > 0) {
      orderbook['bids'][price] = orderbook['bids'][price] ? orderbook['bids'][price] + currentAmount : currentAmount;
      responseStatus = TYPE_PARTIALLY_FILLED;
    } else {
      responseStatus = TYPE_FILLED;
    }
  } else {
    // is selling
    let currentAmount = absAmount;
    let index = prices.length - 1;

    while (price <= prices[index] && currentAmount > 0 && index >= 0) {
      const indexAmount = orderbook['bids'][prices[index]];
      if (currentAmount >= indexAmount) {
        currentAmount -= indexAmount;
        delete orderbook['bids'][prices[index]];
      } else {
        orderbook['bids'][prices[index]] = indexAmount - currentAmount;
        currentAmount = 0;
      }

      index--;
    }

    if (currentAmount > 0) {
      orderbook['asks'][price] = orderbook['asks'][price] ? orderbook['asks'][price] + currentAmount : currentAmount;
      responseStatus = TYPE_PARTIALLY_FILLED;
    } else {
      responseStatus = TYPE_FILLED;
    }
  }

  res.send({ orderbook,
    data: {
      id: uuidv4(),
      amount,
      price,
      responseStatus
    }
   });

  /*
    TODO
    - If the new order is a buy, then match with the other sell orders
    - If the new order is a sell, then match with the other buy orders

    Response format:
    {
      'id': '3f8ecd64-f37e-11eb-9a03-0242ac130003'
      'amount': ...,
      'price': ...,
      'status' 'FILLED' or 'PARTIALLY_FILLED' or 'REJECTED' or 'PENDING'
    }
  */
});

// eslint-disable-next-line no-unused-vars
router.get('/orderbook', (req: Request, res: Response, next: any) => {
  let response: GetOrderbookResponse = {
    asks: Object.keys(orderbook['asks']).map(k => ({
      price: +k,
      amount: orderbook['asks'][+k]
    })),
    bids: Object.keys(orderbook['bids']).map(k => ({
      price: +k,
      amount: orderbook['bids'][+k]
    })),
  };
  res.send(response);
});

module.exports = router;
