const express = require("express");
const {getAccessToRoute,getAdminAccess
} = require("../middlewares/authorization/auth");

const  {checkUserExist} = require("../middlewares/database/databaseErrorHelpers");
const {blockUser,deleteUser} = require("../controllers/admin");

//Block User
//delete User
const router = express.Router();

router.use([getAccessToRoute,getAdminAccess]);

/*router.get("/",(req,res,next) =>
{
    res.status(200).json({
        success:true,
        message: "Admin Page"
    });
});
*/


//Block User
router.get("/block/:id",checkUserExist,blockUser);
router.delete("/user/:id",checkUserExist,deleteUser);

module.exports = router;