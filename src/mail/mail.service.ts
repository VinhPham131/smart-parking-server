import { Injectable } from "@nestjs/common";
import nodemailer from 'nodemailer';

@Injectable()
export class MailService {
    constructor() { }

    async sendMail(to: string, subject: string, html: string) {
        console.log(process.env.EMAIL_HOST, process.env.EMAIL_PORT, process.env.EMAIL_USER, process.env.EMAIL_PASSWORD, process.env.EMAIL_FROM);
        const transport = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            }
        });
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject: subject,
            html,
        };
        await transport.sendMail(mailOptions);
    }
}