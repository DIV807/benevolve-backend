const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
        // Note: Creator can be either Volunteer or NGO, handled in routes
    },
    members: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'members.userType'
        },
        userType: {
            type: String,
            enum: ['Volunteer', 'NGO'],
            required: true
        },
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    category: {
        type: String,
        enum: ['Environment', 'Education', 'Health', 'Community', 'Technology', 'Other'],
        default: 'Other'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Group', groupSchema);