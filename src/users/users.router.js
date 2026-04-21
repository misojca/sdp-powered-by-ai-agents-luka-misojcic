const { Router } = require('express');
const { z } = require('zod');
const usersService = require('./users.service');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/register', async (req, res, next) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors });
  try {
    const user = await usersService.registerUser(result.data);
    res.status(201).json(user);
  } catch (err) {
    if (err.status === 409) return res.status(409).json({ error: err.message });
    next(err);
  }
});

router.post('/login', async (req, res, next) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) return res.status(400).json({ error: result.error.errors });
  try {
    const tokens = await usersService.loginUser(result.data);
    res.status(200).json(tokens);
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ error: err.message });
    next(err);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    await usersService.logoutUser({ refreshToken: req.body.refreshToken });
    res.status(204).end();
  } catch (err) {
    if (err.status === 401) return res.status(401).json({ error: err.message });
    next(err);
  }
});

module.exports = router;
