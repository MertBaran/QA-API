const User = require("../models/User");
const CustomError = require("../helpers/error/CustomError.js");
const asyncErrorWrapper = require("express-async-handler");

const getSingleUser = asyncErrorWrapper(async (req, res, next) => {
    const {id} = req.params;
    const user = await User.findById(id);
    res.status(200).json({success: true, data: user});
});

const getAllUsers = asyncErrorWrapper(async (req, res, next) => {
    const users = await User.find();
    res.status(200).json({success: true, data: users});
});


module.exports = {
    getSingleUser,
    getAllUsers
}

