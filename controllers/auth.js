const User = require("../models/User");
const CustomError = require("../helpers/error/CustomError");
const asyncErrorWrapper = require("express-async-handler");
const { sendJwtToClient } = require("../helpers/authorization/tokenHelpers");
const {
  validateUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers");
const sendEmail = require("../helpers/libraries/sendEmail");

//asyncErrorWrapper ile try-catch kodunu kaldırarak kodu aşağıdaki hale getiriyoruz
//try-catch yazmak yerine wrapper bu exception handling işlerini görüyor
const register = asyncErrorWrapper(async (req, res, next) => {
  // POST DATA
  const { firstName, lastName, email, password, role } = req.body;

  // firstName ve lastName'i birleştirerek name oluştur
  const name = `${firstName} ${lastName}`.trim();

  const user = await User.create({ name, email, password, role });

  sendJwtToClient(user, res);
});

const login = asyncErrorWrapper(async (req, res, next) => {
  const { email, password } = req.body;
  if (!validateUserInput(email, password)) {
    return next(new CustomError("Please provide an email and password", 400));
  }

  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new CustomError("Invalid credentials", 400));
  }

  const isPasswordCorrect = await comparePassword(password, user.password);
  if (!isPasswordCorrect) {
    return next(new CustomError("Invalid credentials", 400));
  }

  sendJwtToClient(user, res);
});

const logout = asyncErrorWrapper(async (req, res, next) => {
  const { NODE_ENV } = process.env;
  res.cookie("access_token", "none", {
    httpOnly: true,
    expires: new Date(Date.now()),
    secure: NODE_ENV === "development" ? false : true,
  });

  res.status(200).json({
    success: true,
    message: "Logout success",
  });
});

const getUser = (req, res, next) => {
  res.json({
    success: true,
    data: {
      id: req.user.id,
      name: req.user.name,
    },
  });
};

const imageUpload = asyncErrorWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    {
      profile_image: req.savedProfileImage,
    },
    {
      new: true, //güncel veriyi döndür
      runValidators: true, //validasyonları çalıştır
    }
  );

  res.status(200).json({
    success: true,
    message: "Image uploaded successfully",
    data: user,
  });
});

const forgotpassword = asyncErrorWrapper(async (req, res, next) => {
  const email = req.body.email;
  const user = await User.findOne({ email });
  if (!user) {
    return next(new CustomError("There is no user with that email", 400));
  }
  const resetPasswordToken = user.getResetPasswordTokenFromUser();

  console.log("\nToken Creation:");
  console.log("Token:", resetPasswordToken);
  console.log("User before save:", {
    email: user.email,
    token: user.resetPasswordToken,
    expire: user.resetPasswordExpire,
  });

  await user.save();

  console.log("User after save:", {
    email: user.email,
    token: user.resetPasswordToken,
    expire: user.resetPasswordExpire,
  });

  const resetPasswordUrl = `http://localhost:5000/api/auth/resetpassword?resetPasswordToken=${resetPasswordToken}`;
  const emailTemplate = `
    <h1>Reset Password</h1>
    <p>This is your reset password link: <a href="${resetPasswordUrl}">${resetPasswordUrl}</a></p>
    <p>This link will expire in 1 hour</p>
    <p>If you did not request this, you can safely ignore this email</p>
    `;
  try {
    await sendEmail({
      from: process.env.SMTP_USER,
      to: email,
      subject: "Reset Password",
      html: emailTemplate,
    });
    return res.status(200).json({
      success: true,
      message: "Reset password token sent to email",
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    return next(new CustomError("Email could not be sent", 500));
  }
});

const resetpassword = asyncErrorWrapper(async (req, res, next) => {
  const { resetPasswordToken } = req.query;

  const userByEmail = await User.findOne({ email: "mertbarandev@gmail.com" });

  // Şimdi normal aramayı yapalım ama expire kontrolü olmadan
  const user = await User.findOne({
    resetPasswordToken: resetPasswordToken,
  }).select("+password");

  if (!resetPasswordToken) {
    return next(new CustomError("Please provide a valid token", 400));
  }
  if (!user) {
    return next(
      new CustomError("Invalid reset password token or expired", 400)
    );
  }

  const { password } = req.body;
  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();
  return res.status(200).json({
    success: true,
    message: "Password reset successful",
  });
});

const editDetails = asyncErrorWrapper(async (req, res, next) => {
  const editInformation = req.body;
  const user = await User.findByIdAndUpdate(req.user.id, editInformation, {
    new: true,
    runValidators: true,
  });
  return res.status(200).json({
    success: true,
    data: user,
  });
});

module.exports = {
  register,
  login,
  logout,
  getUser,
  imageUpload,
  forgotpassword,
  resetpassword,
  editDetails,
};
