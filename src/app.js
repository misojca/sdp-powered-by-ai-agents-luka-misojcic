const express = require('express');
const usersRouter = require('./users/users.router');

const app = express();
app.use(express.json());
app.use('/users', usersRouter);

app.use((err, req, res, _next) => {
  res.status(500).json({ error: 'Internal server error' });
});

module.exports = app;
