const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stat = new Schema({
    state : String
});

const states = mongoose.model('state', stat);

//exports
module.exports = states