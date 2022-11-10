import { v4 as uuidv4 } from 'uuid';

const TYPE_FILLED = 'FILLED'; // order matched entirely
const TYPE_PARTIALLY_FILLED = 'PARTIALLY_FILLED'; // order matched partially and is pending in orderbook
const TYPE_REJECTED = 'REJECTED'; // order failed to match
const TYPE_PENDING = 'PENDING'; // order did not match and is pending in orderbook

export type OrderbookType = Record<'bids' | 'asks', Record<number, number>>;

export const processOrder = (orderbook: OrderbookType, amountLiteral?: string, priceLiteral?: string) => {
    if (!amountLiteral || isNaN(+amountLiteral) || !priceLiteral || isNaN(+priceLiteral)){
      return {
        id: uuidv4(),
        amount: amountLiteral,
        price: priceLiteral,
        status: TYPE_REJECTED
      };
    }

    const amount = +amountLiteral;
    const price = +priceLiteral;
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

    return {
      id: uuidv4(),
      amount,
      price,
      status: responseStatus
    };
};
