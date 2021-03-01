const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const bank = new Schema({
    Bank_Name : String,
    IFSC : String,
    MICR : String,
    Branch_name : String,
    Address : String,
    city1 : String,
    city2 : String,
    state : String,
});

const bankdetail = mongoose.model('bank_details', bank);

//exports
module.exports = bankdetail