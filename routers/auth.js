const express = require("express");
// api/auth
const router = express.Router();

const {
  register,
  getUser,
  login,
  logout,
  imageUpload,
  forgotpassword,
  resetpassword,
  editDetails,
  googleLogin,
} = require("../controllers/auth");
const { getAccessToRoute } = require("../middlewares/authorization/auth");
const profileImageUpload = require("../middlewares/libraries/profileImageUpload");

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgotpassword", forgotpassword);
router.put("/resetpassword", resetpassword);
router.get("/profile", getAccessToRoute, getUser);
router.put("/edit", getAccessToRoute, editDetails);
router.post(
  "/upload",
  [getAccessToRoute, profileImageUpload.single("profile_image")],
  imageUpload
);
router.post("/loginGoogle", googleLogin);

module.exports = router;
