const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const authenticateToken = require('../middleware/authenticateToken');

// Get chat messages for a room
router.get('/messages/:room?', async (req, res) => {
    try {
        const room = req.params.room || 'general';
        
        let chat = await Chat.findOne({ room, isActive: true });
        
        if (!chat) {
            // Create default chat room if it doesn't exist
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
            messages,
            participantCount: chat.participants.length
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get chat history (paginated)
router.get('/history/:room?', async (req, res) => {
    try {
        const room = req.params.room || 'general';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        const chat = await Chat.findOne({ room, isActive: true });
        
        if (!chat) {
            return res.json({ messages: [], hasMore: false });
        }
        
        const totalMessages = chat.messages.length;
        const messages = chat.messages
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(skip, skip + limit)
            .reverse();
        
        res.json({
            messages,
            hasMore: skip + limit < totalMessages,
            page,
            totalMessages
        });
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get active participants in a room
router.get('/participants/:room?', async (req, res) => {
    try {
        const room = req.params.room || 'general';
        const chat = await Chat.findOne({ room, isActive: true });
        
        if (!chat) {
            return res.json({ participants: [] });
        }
        
        res.json({
            participants: chat.participants,
            count: chat.participants.length
        });
    } catch (error) {
        console.error('Error fetching participants:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;






