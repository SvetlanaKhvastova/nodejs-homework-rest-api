const nodemailer = require("nodemailer");
const smtpTransport = require("nodemailer-smtp-transport");
require("dotenv").config();

class CreateSenderNodemailer {
  async send(msg) {
    const config = {
      service: "gmail",
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    const transporter = nodemailer.createTransport(smtpTransport(config));
    const s = await transporter.sendMail({ ...msg, from: process.env.EMAIL });
    console.log(`s`, s);
    return s;
  }
}

module.exports = { CreateSenderNodemailer };
