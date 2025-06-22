const nodemailer = require("nodemailer");

const sendEmail = async (mailOptions) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_APP_PASS
        }
    });

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log(`Message sent: ${info.response}`);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
        throw error;
    }
};

module.exports = sendEmail;
