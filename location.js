const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const location = new Schema({
    district : String,
    state : String,
});

const localities = mongoose.model('location', location);

//exports
module.exports = localities