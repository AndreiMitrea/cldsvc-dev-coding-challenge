import express, { Request, Response } from 'express';
import { body, CustomValidator, validationResult } from 'express-validator';
import { sql } from '@databases/sqlite';
import { OrderRequest, GetOrderbookResponse, OrderbookItem } from '../dtos';
import db from '../db';
import { processOrder, OrderbookType } from '../services';

const isValidPrice: CustomValidator = value => {
  if (!value || isNaN(+value) || +value < 0) {
    throw new Error("Price should be a positive number.");
  }

  return true;
};

const isValidAmount: CustomValidator = value => {
  if (!value || isNaN(+value) || Math.abs(+value) <= 100) {
    throw new Error("Amount should be a number less than -100 or greater than 100.");
  }

  return true;
};

const checkValidationMiddleware = (req: Request, res: Response, next: any) => {
  const validations = validationResult(req);

  if (!validations.isEmpty()) {
    return res.json({ errors: validations.array() }); 
  }

  next();
};

const router = express.Router();

let orderbook: OrderbookType = {
  bids: {
  },
  asks: {

  }
};

// eslint-disable-next-line no-unused-vars
router.post('/order/submit',
  body('price').custom(isValidPrice),
  body('amount').custom(isValidAmount),
  checkValidationMiddleware,
  async (req: Request, res: Response, next: any) => {
    const { amount, price }: OrderRequest = req.body as OrderRequest;

    const response = processOrder(orderbook, amount, price);

    res.send(response);

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
