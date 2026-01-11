const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Thread = require('../models/Thread');
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
        
        let user;
        if (decoded.role === 'volunteer') {
            user = await Volunteer.findById(decoded.id);
        } else {
            user = await NGO.findById(decoded.id);
        }
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid token.' });
        }
        
        req.user = {
            id: decoded.id,
            role: decoded.role,
            name: user.name,
            email: user.email
        };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token.' });
    }
};


router.get('/groups', async (req, res) => {
    try {
        const groups = await Group.find({ isActive: true })
            .select('name description category members creator createdAt')
            .sort({ createdAt: -1 });

        // Populate creator manually to handle both Volunteer and NGO
        const Volunteer = require('../models/Volunteer');
        const NGO = require('../models/NGO');
        
        const groupsWithStats = await Promise.all(groups.map(async (group) => {
            let creatorName = 'Unknown';
            
            // Try to find creator in Volunteer first, then NGO
            try {
                const volunteer = await Volunteer.findById(group.creator);
                if (volunteer) {
                    creatorName = volunteer.name || 'Volunteer';
                } else {
                    const ngo = await NGO.findById(group.creator);
                    if (ngo) {
                        creatorName = ngo.name || 'NGO';
                    }
                }
            } catch (err) {
                console.error('Error fetching creator:', err);
            }
            
            return {
                id: group._id,
                name: group.name,
                description: group.description,
                category: group.category,
                memberCount: group.members ? group.members.length : 0,
                creatorName: creatorName,
                createdAt: group.createdAt
            };
        }));

        res.json(groupsWithStats);
    } catch (error) {
        console.error('Error fetching groups:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/groups', authenticateToken, async (req, res) => {
    try {
        const { name, description, category } = req.body;

        if (!name || !description) {
            return res.status(400).json({ message: 'Name and description are required' });
        }

        const existingGroup = await Group.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
        if (existingGroup) {
            return res.status(400).json({ message: 'Group with this name already exists' });
        }

        const newGroup = new Group({
            name,
            description,
            category: category || 'Other',
            creator: req.user.id,
            members: [{
                user: req.user.id,
                userType: req.user.role === 'volunteer' ? 'Volunteer' : 'NGO'
            }]
        });

        await newGroup.save();
        await newGroup.populate('creator', 'name');

        res.status(201).json({
            id: newGroup._id,
            name: newGroup.name,
            description: newGroup.description,
            category: newGroup.category,
            memberCount: 1,
            creatorName: newGroup.creator.name,
            createdAt: newGroup.createdAt
        });
    } catch (error) {
        console.error('Error creating group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Join a group
router.post('/groups/:groupId/join', authenticateToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        const isMember = group.members.some(member => 
            member.user.toString() === req.user.id
        );

        if (isMember) {
            return res.status(400).json({ message: 'You are already a member of this group' });
        }

        // Add user to group
        group.members.push({
            user: req.user.id,
            userType: req.user.role === 'volunteer' ? 'Volunteer' : 'NGO'
        });

        await group.save();

        res.json({ 
            message: 'Successfully joined the group',
            memberCount: group.members.length
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Leave a group
router.post('/groups/:groupId/leave', authenticateToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        
        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Remove user from group
        group.members = group.members.filter(member => 
            member.user.toString() !== req.user.id
        );

        await group.save();

        res.json({ 
            message: 'Successfully left the group',
            memberCount: group.members.length
        });
    } catch (error) {
        console.error('Error leaving group:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ===== THREAD ROUTES =====

router.get('/threads', async (req, res) => {
    try {
        const { groupId, limit = 20 } = req.query;
        
        let query = { isActive: true };
        if (groupId) {
            query.group = groupId;
        }

        const threads = await Thread.find(query)
            .populate('group', 'name')
            .sort({ updatedAt: -1 })
            .limit(parseInt(limit));

        const threadsWithStats = threads.map(thread => ({
            id: thread._id,
            title: thread.title,
            content: thread.content.substring(0, 200) + (thread.content.length > 200 ? '...' : ''),
            authorName: thread.author.name,
            groupName: thread.group ? thread.group.name : null,
            replyCount: thread.replies.length,
            tags: thread.tags || [],
            lastActivity: thread.replies.length > 0 
                ? thread.replies[thread.replies.length - 1].createdAt 
                : thread.createdAt,
            createdAt: thread.createdAt
        }));

        res.json(threadsWithStats);
    } catch (error) {
        console.error('Error fetching threads:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get a specific thread with replies
router.get('/threads/:threadId', async (req, res) => {
    try {
        const thread = await Thread.findById(req.params.threadId)
            .populate('group', 'name');

        if (!thread || !thread.isActive) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        res.json({
            id: thread._id,
            title: thread.title,
            content: thread.content,
            author: thread.author,
            groupName: thread.group ? thread.group.name : null,
            replies: thread.replies,
            createdAt: thread.createdAt,
            updatedAt: thread.updatedAt
        });
    } catch (error) {
        console.error('Error fetching thread:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create a new thread
router.post('/threads', authenticateToken, async (req, res) => {
    try {
        const { title, content, groupId, tags } = req.body;

        if (!title || !content) {
            return res.status(400).json({ message: 'Title and content are required' });
        }

        const newThread = new Thread({
            title,
            content,
            author: {
                user: req.user.id,
                userType: req.user.role === 'volunteer' ? 'Volunteer' : 'NGO',
                name: req.user.name
            },
            group: groupId || null,
            tags: tags || []
        });

        await newThread.save();
        await newThread.populate('group', 'name');

        res.status(201).json({
            id: newThread._id,
            title: newThread.title,
            content: newThread.content,
            authorName: newThread.author.name,
            groupName: newThread.group ? newThread.group.name : null,
            replyCount: 0,
            lastActivity: newThread.createdAt,
            createdAt: newThread.createdAt
        });
    } catch (error) {
        console.error('Error creating thread:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a reply to a thread
router.post('/threads/:threadId/replies', authenticateToken, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const thread = await Thread.findById(req.params.threadId);
        
        if (!thread || !thread.isActive) {
            return res.status(404).json({ message: 'Thread not found' });
        }

        const newReply = {
            author: {
                user: req.user.id,
                userType: req.user.role === 'volunteer' ? 'Volunteer' : 'NGO',
                name: req.user.name
            },
            content
        };

        thread.replies.push(newReply);
        thread.updatedAt = new Date();
        await thread.save();

        res.status(201).json({
            message: 'Reply added successfully',
            reply: newReply,
            replyCount: thread.replies.length
        });
    } catch (error) {
        console.error('Error adding reply:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's groups
router.get('/user/groups', authenticateToken, async (req, res) => {
    try {
        const groups = await Group.find({
            'members.user': req.user.id,
            isActive: true
        }).select('name description category members createdAt');

        const userGroups = groups.map(group => ({
            id: group._id,
            name: group.name,
            description: group.description,
            category: group.category,
            memberCount: group.members.length,
            joinedAt: group.members.find(m => m.user.toString() === req.user.id)?.joinedAt
        }));

        res.json(userGroups);
    } catch (error) {
        console.error('Error fetching user groups:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get group chat messages (group-specific chat room)
router.get('/groups/:groupId/chat', authenticateToken, async (req, res) => {
    try {
        const group = await Group.findById(req.params.groupId);
        
        if (!group || !group.isActive) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user is a member of the group
        const isMember = group.members.some(member => 
            member.user.toString() === req.user.id
        );

        if (!isMember) {
            return res.status(403).json({ message: 'You must be a member of this group to access its chat' });
        }

        // Use group ID as room name
        const room = `group-${req.params.groupId}`;
        const Chat = require('../models/Chat');
        
        let chat = await Chat.findOne({ room, isActive: true });
        
        if (!chat) {
            // Create chat room for this group if it doesn't exist
            chat = new Chat({
                room,
                messages: [],
                participants: []
            });
            await chat.save();
        }
        
        // Get last 50 messages
        const messages = chat.messages
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50)
            .reverse();
        
        res.json({
            room: chat.room,
            groupId: group._id,
            groupName: group.name,
            messages,
            participantCount: chat.participants.length
        });
    } catch (error) {
        console.error('Error fetching group chat:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;