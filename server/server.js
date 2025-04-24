const express = require('express');
const app = express();
const { resolve } = require('path');
const cors = require('cors');
const { itemsForSale } = require("./data");

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

//remove item from the store
app.post("/remove", (req, res) => {
  const { id } = req.body;
  const index = itemsForSale.findIndex((item) => item.id === id);
  if (index !== -1) {
    itemsForSale.splice(index, 1);
  }
  res.send(itemsForSale);
});

//remove the array of items from the store
app.post("/removeAll", (req, res) => {
  console.log("req.body", req.body);
  const { cart } = req.body;
  //get cart ids and remove them from the itemsForSale array
  const cartIds = cart.map((item) => item.id);
  console.log("cartIds", cartIds);
  cartIds.forEach((id) => {
    const index = itemsForSale.findIndex((item) => item.id === id);
    if (index !== -1) {
      itemsForSale.splice(index, 1);
    }
  });
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
