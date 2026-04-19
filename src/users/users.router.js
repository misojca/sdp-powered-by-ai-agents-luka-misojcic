const { Router } = require('express');
const { z } = require('zod');
const usersService = require('./users.service');

const router = Router();

const registerSchema = z.object({
  name: z.string().min(1),
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

module.exports = router;
