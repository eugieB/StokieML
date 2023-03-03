const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);


const app = express();

// configure body-parser to handle incoming request data
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// connect to MongoDB Atlas
mongoose.connect('<your_mongodb_atlas_uri>', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.log('Error connecting to MongoDB Atlas:', err));

// define a schema for the User model
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  }
});

// hash the password before saving it to the database
userSchema.pre('save', function (next) {
  const user = this;

  bcrypt.hash(user.password, 10, function (err, hash) {
    if (err) {
      return next(err);
    }

    user.password = hash;
    next();
  });
});

// define the User model
const User = mongoose.model('User', userSchema);

// register a new user
app.post('/register', (req, res) => {
  const { email, password } = req.body;

  // check if user already exists in the database
  User.findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (user) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // create a new user object and save it to the database
    const newUser = new User({ email: email, password: password });
    newUser.save((err) => {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      return res.status(201).json({ message: 'User created successfully' });
    });
  });
});

app.post('/payment', (req, res) => {
  const amount = req.body.amount; // the amount to be charged
  const token = req.body.stripeToken; // the token provided by Stripe.js
  const description = req.body.description; // a description of the payment
  
  // Create a charge using the Stripe API
  stripe.charges.create({
    amount: amount,
    currency: 'usd',
    source: token,
    description: description
  }, (err, charge) => {
    if (err) {
      console.error(err);
      res.status(500).send({ error: 'Payment failed' });
    } else {
      res.status(200).send({ success: 'Payment successful' });
    }
  });
});


// log in a user
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // find the user in the database
  User.findOne({ email: email }, (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // compare the user's password with the hashed password in the database
    bcrypt.compare(password, user.password, function (err, result) {
      if (err) {
        return res.status(500).json({ error: 'Internal server error' });
      }

      if (!result) {
        return res.status(401).json({ error: 'Authentication failed' });
      }

      return res.status(200).json({ message: 'Authentication successful' });
    });
  });
});

// start the server
app.listen(3000, () => {
  console.log('Server started on port 3000');
});

