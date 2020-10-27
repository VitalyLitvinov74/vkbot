const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const leadSchema = new Schema({
    trader_id: {
        type: String,
        required: true
    },
    reg: {
        type: String,
        required: true
    },
    ftd: {
        type: String,
        required: true
    },
    sumdep: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    }
});

const Lead = mongoose.model('Lead', leadSchema);

module.exports = Lead;