const mongoose = require("mongoose");

const connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB", err);
    });
};

module.exports = connectDatabase;
