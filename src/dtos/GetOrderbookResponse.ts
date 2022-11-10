export interface OrderbookItem {
    price: number;
    amount: number
}

export interface GetOrderbookResponse {
    asks: OrderbookItem[];
    bids: OrderbookItem[];
};
