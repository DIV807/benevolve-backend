const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
    author: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'replies.author.userType'
        },
        userType: {
            type: String,
            enum: ['Volunteer', 'NGO'],
            required: true
        },
        name: String
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const threadSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    author: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'author.userType'
        },
        userType: {
            type: String,
            enum: ['Volunteer', 'NGO'],
            required: true
        },
        name: String
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group',
        default: null
    },
    replies: [replySchema],
    tags: [String],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Thread', threadSchema);
