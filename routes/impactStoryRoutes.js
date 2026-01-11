const express = require('express');
const router = express.Router();
const ImpactStory = require('../models/ImpactStory');
const authenticateToken = require('../middleware/authenticateToken');

// Get all approved impact stories
router.get('/', async (req, res) => {
    try {
        const { category, featured, limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;
        
        let query = { isApproved: true };
        
        if (category) {
            query.category = category;
        }
        
        if (featured === 'true') {
            query.isFeatured = true;
        }
        
        const stories = await ImpactStory.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit))
            .skip(skip);
        
        // Format stories (author.user might not populate correctly due to dynamic ref)
        const formattedStories = stories.map(story => ({
            _id: story._id,
            title: story.title,
            content: story.content,
            author: {
                name: story.author.name,
                user: story.author.user,
                userType: story.author.userType
            },
            category: story.category,
            location: story.location,
            impactMetrics: story.impactMetrics,
            images: story.images,
            tags: story.tags,
            likes: story.likes,
            isFeatured: story.isFeatured,
            createdAt: story.createdAt
        }));
        
        const total = await ImpactStory.countDocuments(query);
        
        res.json({
            stories: formattedStories,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching impact stories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a single impact story
router.get('/:storyId', async (req, res) => {
    try {
        const story = await ImpactStory.findById(req.params.storyId)
            .populate('author.user', 'name email');
        
        if (!story || !story.isApproved) {
            return res.status(404).json({ message: 'Story not found' });
        }
        
        res.json(story);
    } catch (error) {
        console.error('Error fetching story:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new impact story (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            title,
            content,
            category,
            location,
            impactMetrics,
            images,
            tags
        } = req.body;
        
        if (!title || !content || !location) {
            return res.status(400).json({ 
                message: 'Title, content, and location are required' 
            });
        }
        
        const newStory = new ImpactStory({
            title,
            content,
            author: {
                user: req.user.id,
                userType: req.user.role === 'volunteer' ? 'Volunteer' : 'NGO',
                name: req.user.name
            },
            category: category || 'Other',
            location,
            impactMetrics: impactMetrics || {},
            images: images || [],
            tags: tags || [],
            isApproved: false // Requires admin approval
        });
        
        await newStory.save();
        
        res.status(201).json({
            message: 'Impact story submitted successfully. It will be reviewed before being published.',
            story: newStory
        });
    } catch (error) {
        console.error('Error creating impact story:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Like an impact story
router.post('/:storyId/like', authenticateToken, async (req, res) => {
    try {
        const story = await ImpactStory.findById(req.params.storyId);
        
        if (!story || !story.isApproved) {
            return res.status(404).json({ message: 'Story not found' });
        }
        
        const userId = req.user.id.toString();
        const existingLike = story.likes.find(
            like => like.user.toString() === userId
        );
        
        if (existingLike) {
            // Unlike
            story.likes = story.likes.filter(
                like => like.user.toString() !== userId
            );
            await story.save();
            return res.json({ 
                message: 'Story unliked',
                liked: false,
                likeCount: story.likes.length
            });
        } else {
            // Like
            story.likes.push({ user: req.user.id });
            await story.save();
            return res.json({ 
                message: 'Story liked',
                liked: true,
                likeCount: story.likes.length
            });
        }
    } catch (error) {
        console.error('Error liking story:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's submitted stories
router.get('/user/my-stories', authenticateToken, async (req, res) => {
    try {
        const stories = await ImpactStory.find({
            'author.user': req.user.id
        })
            .sort({ createdAt: -1 });
        
        res.json({ stories });
    } catch (error) {
        console.error('Error fetching user stories:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;

