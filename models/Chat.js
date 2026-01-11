const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userType: {
            type: String,
            enum: ['Volunteer', 'NGO'],
            required: true
        },
        name: {
            type: String,
            required: true
        }
    },
    message: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const chatSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        unique: true,
        default: 'general' // Main community chat room
    },
    messages: [messageSchema],
    participants: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        userType: {
            type: String,
            enum: ['Volunteer', 'NGO'],
            required: true
        },
        name: String,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Index for faster queries (room already has unique index, so only add messages index)
chatSchema.index({ 'messages.createdAt': -1 });

module.exports = mongoose.model('Chat', chatSchema);


