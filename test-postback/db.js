require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGO_URI, { useUnifiedTopology: true, useNewUrlParser: true });

const db = mongoose.connection;
db.on('error', err => console.log(err));
db.once('open', () => {
  Admin.findOne({ owner: true }, (err, owner) => {
    if (!owner) {
      new Admin({
        userID: process.env.ADMIN_ID,
        name: 'Владелец',
        owner: true
      }).save();
    }
  });
  console.log("MongoDB connected!");
});