const request = require('supertest');
const { app } = require('../app');

/* eslint-disable no-undef */
describe('app', () => {
  describe('POST /order/submit', async () => {
    await request(app)
      .post('/order/submit')
      .send({
        amount: 20,
        price: 190,
      })
      .expect(200, {
        id: 'c566d661-7103-4b56-ab35-dd0868576369',
        amount: -200,
        price: 50,
        status: 'PENDING',
      });
  });
});
