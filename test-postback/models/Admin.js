const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const adminSchema = new Schema({
  userID: {
      type: String,
      required: true
  },
  name: {
    type: String,
    required: true
  },
  owner: {
      type: Boolean,
      required: true
  }
});

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;