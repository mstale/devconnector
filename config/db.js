const mongoose = require('mongoose');
const config = require('config');

const db = config.get('mongoURI');

const connectDB = async () => {
    try {
        await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });

        console.log("---> MongoDB connected to Atlas")

    } catch (error) {
        console.error(error.message);
        // Exit process
        process.exit(1);
    }
}

module.exports = connectDB;