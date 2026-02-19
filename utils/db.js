// utils/db.js
const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
    if (isConnected) return;

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            connectTimeoutMS: 10000,
        });

        isConnected = true;
        console.log('✅ MongoDB connesso correttamente');
    } catch (err) {
        console.error('❌ Errore connessione MongoDB:', err.message);
        process.exit(1);
    }

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️  MongoDB disconnesso, riconnessione in corso...');
        isConnected = false;
        setTimeout(connectDB, 5000);
    });

    mongoose.connection.on('error', err => {
        console.error('❌ MongoDB errore:', err.message);
    });
}

module.exports = { connectDB };