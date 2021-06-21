const nodemailer = require("nodemailer");
require("dotenv").config();

class CreateSenderNodemailer {
  async send(msg) {
    const config = {
      host: "smtp.meta.ua",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD,
      },
    };
    const transporter = nodemailer.createTransport(config);
    const result = await transporter.sendMail({
      ...msg,
      from: process.env.EMAIL,
    });
    return result;
  }
}

module.exports = { CreateSenderNodemailer };
