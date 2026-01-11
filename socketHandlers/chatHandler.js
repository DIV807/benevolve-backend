const Chat = require('../models/Chat');
const Volunteer = require('../models/Volunteer');
const NGO = require('../models/NGO');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key';

// Store active users in each room
const activeUsers = new Map(); // room -> Set of userIds

function setupChatSocket(io) {
    // Authentication middleware for Socket.io
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            if (!token) {
                return next(new Error('Authentication error: No token provided'));
            }
            
            const decoded = jwt.verify(token, JWT_SECRET);
            
            // Get user details
            let user = await Volunteer.findById(decoded.id);
            let userType = 'Volunteer';
            
            if (!user) {
                user = await NGO.findById(decoded.id);
                userType = 'NGO';
            }
            
            if (!user) {
                return next(new Error('Authentication error: User not found'));
            }
            
            socket.user = {
                id: decoded.id,
                role: decoded.role,
                name: user.name,
                userType: userType
            };
            
            next();
        } catch (error) {
            next(new Error('Authentication error: Invalid token'));
        }
    });
    
    io.on('connection', async (socket) => {
        console.log(`✅ User connected: ${socket.user.name} (${socket.id})`);
        
        // Track current room for this socket
        socket.currentRoom = 'general';
        
        // Join general room by default
        const room = 'general';
        socket.join(room);
        
        // Add user to active users
        if (!activeUsers.has(room)) {
            activeUsers.set(room, new Set());
        }
        activeUsers.get(room).add(socket.user.id.toString());
        
        // Get or create chat room
        let chat = await Chat.findOne({ room, isActive: true });
        if (!chat) {
            chat = new Chat({
                room,
                messages: [],
                participants: []
            });
            await chat.save();
        }
        
        // Add user to participants if not already there
        const isParticipant = chat.participants.some(
            p => p.user.toString() === socket.user.id.toString()
        );
        
        if (!isParticipant) {
            chat.participants.push({
                user: socket.user.id,
                userType: socket.user.userType,
                name: socket.user.name
            });
            await chat.save();
        }
        
        // Emit current participants
        io.to(room).emit('participants-update', {
            count: activeUsers.get(room).size,
            participants: Array.from(activeUsers.get(room))
        });
        
        // Load recent messages
        const recentMessages = chat.messages
            .sort((a, b) => b.createdAt - a.createdAt)
            .slice(0, 50)
            .reverse();
        
        socket.emit('message-history', recentMessages);
        
        // Handle new message
        socket.on('send-message', async (data) => {
            try {
                const { message, room: messageRoom = 'general' } = data;
                
                if (!message || !message.trim()) {
                    return socket.emit('error', { message: 'Message cannot be empty' });
                }
                
                // Get or create chat room
                let chatRoom = await Chat.findOne({ room: messageRoom, isActive: true });
                if (!chatRoom) {
                    chatRoom = new Chat({
                        room: messageRoom,
                        messages: [],
                        participants: []
                    });
                }
                
                // Create new message
                const newMessage = {
                    sender: {
                        user: socket.user.id,
                        userType: socket.user.userType,
                        name: socket.user.name
                    },
                    message: message.trim(),
                    createdAt: new Date()
                };
                
                chatRoom.messages.push(newMessage);
                
                // Keep only last 1000 messages per room
                if (chatRoom.messages.length > 1000) {
                    chatRoom.messages = chatRoom.messages.slice(-1000);
                }
                
                await chatRoom.save();
                
                // Broadcast message to all users in the room
                io.to(messageRoom).emit('new-message', newMessage);
                
                console.log(`💬 Message from ${socket.user.name} in ${messageRoom}: ${message.substring(0, 50)}...`);
            } catch (error) {
                console.error('Error handling message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        
        // Handle typing indicator
        socket.on('typing', (data) => {
            const { room: typingRoom = 'general', isTyping } = data;
            socket.to(typingRoom).emit('user-typing', {
                userId: socket.user.id,
                userName: socket.user.name,
                isTyping
            });
        });
        
        // Handle room join (for group chats, use room name like "group-{groupId}")
        socket.on('join-room', async (roomName) => {
            // Leave previous room (if not general)
            const previousRoom = socket.currentRoom;
            if (previousRoom && previousRoom !== 'general' && previousRoom !== roomName) {
                socket.leave(previousRoom);
                if (activeUsers.has(previousRoom)) {
                    activeUsers.get(previousRoom).delete(socket.user.id.toString());
                    io.to(previousRoom).emit('participants-update', {
                        count: activeUsers.get(previousRoom).size
                    });
                }
            }
            
            // Join new room
            socket.join(roomName);
            socket.currentRoom = roomName;
            
            if (!activeUsers.has(roomName)) {
                activeUsers.set(roomName, new Set());
            }
            activeUsers.get(roomName).add(socket.user.id.toString());
            
            // Get or create chat room
            let chatRoom = await Chat.findOne({ room: roomName, isActive: true });
            if (!chatRoom) {
                chatRoom = new Chat({
                    room: roomName,
                    messages: [],
                    participants: []
                });
                await chatRoom.save();
            }
            
            // Add user to participants if not already there
            const isParticipant = chatRoom.participants.some(
                p => p.user.toString() === socket.user.id.toString()
            );
            
            if (!isParticipant) {
                chatRoom.participants.push({
                    user: socket.user.id,
                    userType: socket.user.userType,
                    name: socket.user.name
                });
                await chatRoom.save();
            }
            
            // Get messages for new room
            const recentMessages = chatRoom.messages
                .sort((a, b) => b.createdAt - a.createdAt)
                .slice(0, 50)
                .reverse();
            socket.emit('message-history', recentMessages);
            
            io.to(roomName).emit('participants-update', {
                count: activeUsers.get(roomName).size
            });
            
            console.log(`👤 ${socket.user.name} joined room: ${roomName}`);
        });
        
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`❌ User disconnected: ${socket.user.name} (${socket.id})`);
            
            // Remove from active users
            activeUsers.forEach((userSet, roomName) => {
                userSet.delete(socket.user.id.toString());
                io.to(roomName).emit('participants-update', {
                    count: userSet.size
                });
            });
        });
    });
}

module.exports = setupChatSocket;


