import { injectable } from "tsyringe";
import nodemailer from "nodemailer";
import { MailOptions } from "../contracts/IEmailService";
import { IEmailService } from "../contracts/IEmailService";

@injectable()
export class EmailManager implements IEmailService {
    async sendEmail(mailOptions: MailOptions) {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env["SMTP_USER"],
                pass: process.env["SMTP_APP_PASS"]
            }
        });

        try {
            let info = await transporter.sendMail(mailOptions);
            console.log(`Message sent: ${info.response}`);
            return info;
        } catch (error) {
            console.error("Error sending email:", error);
            throw new (require("../../helpers/error/CustomError").default)("Email service error", 500);
        }
    }
} 