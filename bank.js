const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bankname = new Schema({
    name : String
});

const bank_name = mongoose.model('bank_name', bankname);

//exports
module.exports = bank_name