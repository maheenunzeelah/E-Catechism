// This file is deprecated - use config/keys.js instead
module.exports = {
    url: process.env.MONGO_URI || 'mongodb://localhost/project1',
    serverport: process.env.PORT || 3001,
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production'
};