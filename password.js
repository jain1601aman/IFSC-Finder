const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const key = new Schema({
    password:String
});

const authdetail = mongoose.model('admin', key);

//exports
module.exports = authdetail