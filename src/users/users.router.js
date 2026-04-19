const { Router } = require('express');
const usersService = require('./users.service');

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const user = await usersService.registerUser(req.body);
    res.status(201).json(user);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
