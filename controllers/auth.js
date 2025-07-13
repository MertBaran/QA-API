const User = require("../models/User");
const CustomError = require("../helpers/error/CustomError");
const asyncErrorWrapper = require("express-async-handler");
const { sendJwtToClient } = require("../helpers/authorization/tokenHelpers");
const {
  validateUserInput,
  comparePassword,
} = require("../helpers/input/inputHelpers");
const sendEmail = require("../helpers/libraries/sendEmail");
const { OAuth2Client } = require("google-auth-library");
const dotenv = require("dotenv");

dotenv.config({
  path: "./config/env/config.env",
});

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res, next) => {
  const { token } = req.body;
  console.log(token);
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    console.log(ticket);
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await User.findOne({ email });
    console.log(user);
    if (!user) {
      user = await User.create({
        name,
        email,
        password: Math.random().toString(36),
      }); // random password
    }

    sendJwtToClient(user, res);
  } catch (err) {
    console.log(err);
    return next(new CustomError("Google ile giriş başarısız oldu", 401));
  }
};

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

  const clientUrl = process.env.CLIENT_URL || "https://localhost:3001";
  const resetPasswordUrl = `${clientUrl}/reset-password?token=${resetPasswordToken}`;
  const emailTemplate = `
    <div style="font-family: Arial, sans-serif; background: #f9f9f9; padding: 32px; border-radius: 8px; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #1976d2;">Şifre Sıfırlama Talebi</h2>
      <p>Hesabınız için bir şifre sıfırlama isteği aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
      <a href="${resetPasswordUrl}" style="display: inline-block; padding: 12px 24px; background: #1976d2; color: #fff; border-radius: 4px; text-decoration: none; font-weight: bold; margin: 16px 0;">Şifreyi Sıfırla</a>
      <p style="font-size: 14px; color: #555;">Eğer buton çalışmazsa, aşağıdaki bağlantıyı kopyalayıp tarayıcınıza yapıştırabilirsiniz:</p>
      <div style="background: #eee; padding: 8px; border-radius: 4px; word-break: break-all; font-size: 13px;">${resetPasswordUrl}</div>
      <p style="font-size: 13px; color: #888; margin-top: 24px;">Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu işlemi siz başlatmadıysanız, bu e-postayı dikkate almayabilirsiniz.</p>
    </div>
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
    resetPasswordExpire: { $gt: Date.now() },
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
  googleLogin,
};
