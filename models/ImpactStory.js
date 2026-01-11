const mongoose = require('mongoose');

const impactStorySchema = new mongoose.Schema({
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
    category: {
        type: String,
        enum: ['Environment', 'Education', 'Health', 'Community', 'Technology', 'Disaster Relief', 'Other'],
        default: 'Other'
    },
    location: {
        type: String,
        required: true
    },
    impactMetrics: {
        peopleHelped: Number,
        hoursVolunteered: Number,
        fundsRaised: Number,
        itemsDonated: Number
    },
    images: [String], // URLs to images
    tags: [String],
    likes: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true
        },
        likedAt: {
            type: Date,
            default: Date.now
        }
    }],
    isApproved: {
        type: Boolean,
        default: false // Stories need approval before being public
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for better query performance
impactStorySchema.index({ isApproved: 1, createdAt: -1 });
impactStorySchema.index({ isFeatured: 1 });
impactStorySchema.index({ category: 1 });
impactStorySchema.index({ 'author.user': 1 });

module.exports = mongoose.model('ImpactStory', impactStorySchema);






