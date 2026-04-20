const express = require('express');
const usersRouter = require('./users/users.router');
const catalogRouter = require('./catalog/catalog.router');
const ordersRouter = require('./orders/orders.router');

const app = express();
app.use(express.json());
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter);
app.use('/orders', ordersRouter);

app.use((err, req, res, _next) => {
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
