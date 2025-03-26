const mongoose = require('mongoose');

const NGOSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    missionStatement: String,
    areasOfOperation: String
});

module.exports = mongoose.model('NGO', NGOSchema);

