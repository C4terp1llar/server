const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const tokenSchema = new Schema({
    userID: {
        ref: 'User',
        type: Schema.Types.ObjectId,
    },
    token: {
        type: String,
        required: true
    },
    device: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: '30d'
    }
})

const Token = mongoose.model('Token', tokenSchema);

module.exports = Token;