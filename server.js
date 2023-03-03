const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.connect('mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

const User = mongoose.model('User', userSchema);

// Route to create a new user
app.post('/api/users', async (req, res) => {
  const { name, email, password } = req.body;

  const user = new User({
    name,
    email,
    password,
  });

  try {
    await user.save();
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.send(users);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to get a specific user by ID
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to update a user by ID
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const user = await User.findById(id);

    user.name = name || user.name;
    user.email = email || user.email;
    user.password = password || user.password;

    await user.save();
    res.send(user);
  } catch (err) {
    res.status(500).send(err);
  }
});

// Route to delete a user by ID
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await User.findByIdAndDelete(id);
    res.send({ message: 'User deleted successfully' });
  } catch (err) {
