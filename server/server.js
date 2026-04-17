const express = require('express');
const app = express();
const { resolve } = require('path');
const cors = require('cors');
const { itemsForSale, soldItems } = require("./data");

app.use(cors()); // Enable CORS for all routes
// Replace if using a different env file or config
const env = require("dotenv").config({ path: "./.env" });

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-08-01",
});

// Serve static files from the public directory
app.use(express.static("public"));
app.use(express.static(process.env.STATIC_DIR));
app.use(express.json());

app.get("/", (req, res) => {
  const path = resolve(process.env.STATIC_DIR + "/index.html");
  res.sendFile(path);
});

app.get("/config", (req, res) => {
  res.send({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
  });
});

//get the items from the store
app.get("/store", (req, res) => {
  res.send(itemsForSale);
});

//get the sold items
app.get("/sold", (req, res) => {
  res.send(soldItems);
});

//remove item from the store
app.post("/remove", (req, res) => {
  const { id } = req.body;
  const index = itemsForSale.findIndex((item) => item.id === id);
  if (index !== -1) {
    const [item] = itemsForSale.splice(index, 1);
    soldItems.push(item);
  }
  res.send(itemsForSale);
});

//move the array of items from the store to sold
app.post("/removeAll", (req, res) => {
  console.log("req.body", req.body);
  const { cart } = req.body;
  //build a set of cart ids for O(1) lookup
  const cartIdSet = new Set(cart.map((item) => item.id));
  console.log("cartIds", [...cartIdSet]);
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

app.post('/create-payment-intent', async (req, res) => {
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

app.listen(5252, () =>
  console.log(`Node server listening at http://localhost:5252`)
);
