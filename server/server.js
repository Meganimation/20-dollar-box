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
const cartHoldDurationMs = 10 * 60 * 1000;
const heldItems = new Map();
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
  releaseExpiredHolds();
  res.send(itemsForSale);
});

//get the sold items
app.get('/sold', (req, res) => {
  res.send(soldItems);
});

function validateSessionId(sessionId) {
  return (
    typeof sessionId === 'string' &&
    sessionId.length > 0 &&
    sessionId.length <= 128
  );
}

function releaseExpiredHolds() {
  const now = Date.now();
  for (const [itemId, heldItem] of heldItems.entries()) {
    if (heldItem.expiresAt <= now) {
      itemsForSale.push(heldItem.item);
      heldItems.delete(itemId);
    }
  }
}

function getSessionHeldEntries(sessionId) {
  const entries = [];
  for (const [itemId, heldItem] of heldItems.entries()) {
    if (heldItem.sessionId === sessionId) {
      entries.push([itemId, heldItem]);
    }
  }
  return entries;
}

app.get('/cart-hold', apiLimiter, (req, res) => {
  releaseExpiredHolds();
  const { sessionId } = req.query;

  if (!validateSessionId(sessionId)) {
    return res.status(400).send({ error: 'sessionId is required' });
  }

  const heldEntries = getSessionHeldEntries(sessionId);
  if (heldEntries.length === 0) {
    return res.send({ expiresAt: null, remainingMs: 0, heldCount: 0 });
  }

  const expiresAt = Math.min(...heldEntries.map(([, heldItem]) => heldItem.expiresAt));
  const remainingMs = Math.max(expiresAt - Date.now(), 0);
  return res.send({ expiresAt, remainingMs, heldCount: heldEntries.length });
});

app.post('/reserve', apiLimiter, (req, res) => {
  releaseExpiredHolds();
  const { id, sessionId } = req.body;
  if (!validateSessionId(sessionId)) {
    return res.status(400).send({ error: 'sessionId is required' });
  }
  if (!Number.isInteger(id)) {
    return res.status(400).send({ error: 'id must be an integer' });
  }

  const existingHold = heldItems.get(id);
  if (existingHold) {
    if (existingHold.sessionId === sessionId) {
      return res.send({
        success: true,
        alreadyReserved: true,
        expiresAt: existingHold.expiresAt,
      });
    }
    return res.status(409).send({ error: 'item is already reserved' });
  }

  const index = itemsForSale.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).send({ error: 'item is not available' });
  }

  const [item] = itemsForSale.splice(index, 1);
  const expiresAt = Date.now() + cartHoldDurationMs;
  heldItems.set(id, { item, sessionId, expiresAt });

  return res.send({ success: true, expiresAt });
});

// reserve item from the store for a specific session
app.post('/remove', apiLimiter, (req, res) => {
  releaseExpiredHolds();
  const { id, sessionId } = req.body;
  if (!validateSessionId(sessionId)) {
    return res.status(400).send({ error: 'sessionId is required' });
  }
  if (!Number.isInteger(id)) {
    return res.status(400).send({ error: 'id must be an integer' });
  }

  const existingHold = heldItems.get(id);
  if (existingHold) {
    if (existingHold.sessionId === sessionId) {
      return res.send(itemsForSale);
    }
    return res.status(409).send({ error: 'item is already reserved' });
  }

  const index = itemsForSale.findIndex((item) => item.id === id);
  if (index === -1) {
    return res.status(404).send({ error: 'item is not available' });
  }

  const [item] = itemsForSale.splice(index, 1);
  heldItems.set(id, { item, sessionId, expiresAt: Date.now() + cartHoldDurationMs });
  return res.send(itemsForSale);
});

app.post('/purchase', apiLimiter, (req, res) => {
  releaseExpiredHolds();
  const { sessionId } = req.body;
  if (!validateSessionId(sessionId)) {
    return res.status(400).send({ error: 'sessionId is required' });
  }

  const heldEntries = getSessionHeldEntries(sessionId);
  if (heldEntries.length === 0) {
    return res.status(400).send({ error: 'no reserved items for session' });
  }

  for (const [itemId, heldItem] of heldEntries) {
    heldItems.delete(itemId);
    soldItems.push(heldItem.item);
  }

  return res.send({ success: true, soldCount: heldEntries.length });
});

//move the array of items from the store to sold
app.post('/removeAll', apiLimiter, (req, res) => {
  releaseExpiredHolds();
  const { cart, sessionId } = req.body;

  if (validateSessionId(sessionId)) {
    const heldEntries = getSessionHeldEntries(sessionId);
    if (heldEntries.length === 0) {
      return res.status(400).send({ error: 'no reserved items for session' });
    }
    for (const [itemId, heldItem] of heldEntries) {
      heldItems.delete(itemId);
      soldItems.push(heldItem.item);
    }
    return res.send(itemsForSale);
  }

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
