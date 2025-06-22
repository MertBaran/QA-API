const multer = require('multer');
const path = require('path');
const CustomError = require('../../helpers/error/CustomError');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        
        const rootDir = path.dirname(require.main.filename);
        cb(null, path.join(rootDir, 'public/uploads'));
    },
    filename: (req, file, cb) => {
        const extension = file.mimetype.split("/")[1];
        req.savedProfileImage = `image_${req.user.id}.${extension}`;
        cb(null, req.savedProfileImage);
    }
});

const fileFilter = (req, file, cb) => {
    let allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if(!allowedTypes.includes(file.mimetype)) {
        return cb(new CustomError("Only jpeg, jpg and png images are allowed!", 400), false);
    } 

    return cb(null, true);    
};

const profileImageUpload = multer({ storage, fileFilter });

module.exports = profileImageUpload;

