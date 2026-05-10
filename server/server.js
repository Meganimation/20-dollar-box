const express = require('express');
const app = express();
const { resolve } = require('path');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const { itemsForSale, soldItems } = require('./data');

require('dotenv').config({ path: './.env' });

const requiredEnvVars = ['STRIPE_SECRET_KEY', 'STRIPE_PUBLISHABLE_KEY'];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
if (missingEnvVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const port = Number(process.env.PORT || 5252);
const staticDir = process.env.STATIC_DIR || resolve(__dirname, '..', 'dist');
const corsOrigin = process.env.CORS_ORIGIN;
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const rateLimitMaxRequests = Number(process.env.RATE_LIMIT_MAX_REQUESTS || 120);
const apiLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  limit: rateLimitMaxRequests,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Too many requests' },
});

app.disable('x-powered-by');
app.use(
  cors(
    corsOrigin
      ? {
          origin: corsOrigin,
        }
      : undefined
  )
);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2022-08-01',
});

// Serve static files from the public directory
app.use(express.static('public'));
app.use(express.static(staticDir));
app.use(express.json({ limit: '100kb' }));

app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', apiLimiter, (req, res) => {
  const path = resolve(staticDir, 'index.html');
  res.sendFile(path);
});

app.get('/config', (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

//get the items from the store
app.get('/store', (req, res) => {
  res.send(itemsForSale);
});

//get the sold items
app.get('/sold', (req, res) => {
  res.send(soldItems);
});

//remove item from the store
app.post('/remove', apiLimiter, (req, res) => {
  const { id } = req.body;
  const index = itemsForSale.findIndex((item) => item.id === id);
  if (index !== -1) {
    const [item] = itemsForSale.splice(index, 1);
    soldItems.push(item);
  }
  res.send(itemsForSale);
});

//move the array of items from the store to sold
app.post('/removeAll', apiLimiter, (req, res) => {
  const { cart } = req.body;
  if (!Array.isArray(cart)) {
    return res.status(400).send({ error: 'cart must be an array' });
  }

  //build a set of cart ids for O(1) lookup
  const availableIds = new Set(itemsForSale.map((item) => item.id));
  const cartIds = cart.map((item) => item?.id);
  if (cartIds.some((id) => !Number.isInteger(id))) {
    return res.status(400).send({ error: 'cart contains invalid item id' });
  }

  const cartIdSet = new Set(cartIds);
  for (const id of cartIdSet) {
    if (!availableIds.has(id)) {
      return res.status(400).send({ error: 'cart contains unknown item id' });
    }
  }
  //iterate itemsForSale once and move matching items to soldItems
  let i = itemsForSale.length - 1;
  while (i >= 0) {
    if (cartIdSet.has(itemsForSale[i].id)) {
      const [item] = itemsForSale.splice(i, 1);
      soldItems.push(item);
    }
    i--;
  }
  res.send(itemsForSale);
});

app.post('/create-payment-intent', apiLimiter, async (req, res) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      currency: 'USD',
      amount: 2000,
      automatic_payment_methods: { enabled: true },
    });

    // Send publishable key and PaymentIntent details to client
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    return res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

app.listen(port, () => console.log(`Node server listening at http://localhost:${port}`));
