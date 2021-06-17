const { UsersReporitory } = require("../repository");
const { EmailService } = require("./email");
const { ErrorHandler } = require("../helpers/errorHandler");

const { nanoid } = require("nanoid");
//
// const cloudinary = require("cloudinary").v2;
// const fs = require("fs/promises");
//
require("dotenv").config();

class UserService {
  constructor() {
    // this.cloudinary = cloudinary;
    // cloudinary.config({
    //   cloud_name: process.env.CLOUD_NAME,
    //   api_key: process.env.API_KEY,
    //   api_secret: process.env.API_SECRET,
    // });
    this.emailServise = new EmailService();
    this.repositories = {
      users: new UsersReporitory(),
    };
  }

  async verify({ token }) {
    const user = await this.repositories.users.findByField({
      verifyToken: token,
    });

    if (user) {
      await user.updateOne({ verify: true, verifyToken: null });
      return true;
    }
    return false;
  }

  async addUser(body) {
    const verifyToken = nanoid();
    const { email, name } = body;

    try {
      await this.emailServise.sendVerifyEmail(verifyToken, email, name);
    } catch (error) {
      throw new ErrorHandler(503, error.message, "Service Unavailable");
    }

    const data = await this.repositories.users.addUser({
      ...body,
      verifyToken,
    });

    return data;
  }

  async findByEmail(email) {
    const data = await this.repositories.users.findByEmail(email);
    return data;
  }

  async findById(id) {
    const data = await this.repositories.users.findById(id);
    return data;
  }

  async findByTokenCurrent(token) {
    const data = await this.repositories.users.findByTokenCurrent(token);
    return data;
  }

  async updateSubscriptionStatus(id, contactId, body) {
    const data = await this.repositories.users.updateSubscriptionStatus(
      id,
      contactId,
      body
    );
    return data;
  }

  // async updateAvatar(id, pathFile) {
  //   try {
  //     const { secure_url: avatar, public_id: idCloudAvatar } =
  //       await this.#uploadCloud(pathFile);

  //     const oldAvatar = await this.repositories.users.getAvatar(id);
  //     this.cloudinary.uploader.destroy(oldAvatar.idCloudAvatar),
  //       (err, result) => {
  //         console.log(err, result);
  //       };

  //     await this.repositories.users.updateAvatar(id, avatar, idCloudAvatar);

  //     await fs.unlink(pathFile);

  //     return avatar;
  //   } catch (error) {
  //     throw new Error(null, "Error upload avatar");
  //   }
  // }

  // #uploadCloud = (pathFile) => {
  //   return new Promise((resolve, reject) => {
  //     this.cloudinary.uploader.upload(
  //       pathFile,
  //       {
  //         folder: "Avatars",
  //         transformation: {
  //           width: 250,
  //           crop: "pad",
  //         },
  //       },
  //       (err, result) => {
  //         if (err) reject(err);
  //         if (result) resolve(result);
  //       }
  //     );
  //   });
  // };
}

module.exports = { UserService };
