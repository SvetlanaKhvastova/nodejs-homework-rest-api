const fs = require("fs/promises");
const path = require("path");

const { HttpCode } = require("../helpers/constants");
const { UploadService } = require("../services/local-upload");
const { UsersReporitory } = require("../repository");
const { UserService, AuthService } = require("../services");
const { EmailService } = require("../services/email");
const { CreateSenderNodemailer } = require("../services/email-sender");

const { ErrorHandler } = require("../helpers/errorHandler");

require("dotenv").config();
const AVATAR_OF_USERS = process.env.AVATAR_OF_USERS;
const newUserRepo = new UsersReporitory();
//

const serviceUser = new UserService();
const serviceAuth = new AuthService();

const verify = async (req, res, next) => {
  try {
    const result = await serviceUser.verify(req.params);

    if (result) {
      return res.status(HttpCode.OK).json({
        status: "success",
        code: HttpCode.OK,
        data: {
          message: "Verification successful",
        },
      });
    } else {
      return next({
        status: HttpCode.NOT_FOUND,
        message: "User not found",
        data: "User not found",
      });
    }
  } catch (error) {
    next(error);
  }
};

const repeatEmailVerification = async (req, res, next) => {
  try {
    const user = await serviceUser.findByEmail(req.body.email);

    if (user) {
      const { name, email, verify, verifyToken } = user;

      const createSenderNodemailer = new CreateSenderNodemailer();

      if (!verify) {
        const emailService = new EmailService(
          req.app.get("env"),
          createSenderNodemailer
        );

        await emailService.sendVerifyEmail(verifyToken, email, name);

        return res.json({
          status: "success",
          code: 200,
          data: { message: "Verification email sent" },
        });
      }

      return res.status(HttpCode.CONFLICT).json({
        status: "error",
        code: HttpCode.CONFLICT,
        message: "Verification has already been passed",
      });
    }

    return res.status(HttpCode.NOT_FOUND).json({
      status: "error",
      code: HttpCode.NOT_FOUND,
      message: "User not found",
    });
  } catch (error) {
    next(error);
  }
};

const signup = async (req, res, next) => {
  const { name, email, password, subscription, avatarURL } = req.body;

  const user = await serviceUser.findByEmail(email);

  if (user) {
    return next({
      status: HttpCode.CONFLICT,
      message: "Email in use",
    });
  }

  try {
    const newUser = await serviceUser.addUser({
      name,
      email,
      password,
      subscription,
      avatarURL,
    });

    try {
      const createSenderNodemailer = new CreateSenderNodemailer();

      const emailService = new EmailService(
        req.app.get("env"),
        createSenderNodemailer
      );
      await emailService.sendVerifyEmail(
        newUser.verifyToken,
        newUser.email,
        newUser.name
      );
    } catch (error) {
      console.log(error.message);
      // throw new ErrorHandler(503, error.message, "Service Unavailable");
    }

    return res.status(HttpCode.CREATED).json({
      status: "success",
      code: HttpCode.CREATED,
      user: {
        name: newUser.name,
        id: newUser.id,
        email: newUser.email,
        subscription: newUser.subscription,
        avatarURL: newUser.avatarURL,
        verifyToken: newUser.verifyToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const token = await serviceAuth.login({
      email,
      password,
    });

    if (token) {
      return res.status(HttpCode.OK).json({
        status: "success",
        code: HttpCode.OK,
        user: {
          token,
        },
      });
    }

    next({
      status: HttpCode.UNAUTHORIZED,
      message: "Email or password is wrong",
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  const userId = req.user.id;

  await serviceAuth.logout(userId);
  return res
    .status(HttpCode.NO_CONTENT)
    .json({ status: "success", code: HttpCode.NO_CONTENT });
};

const current = async (req, res, next) => {
  try {
    const userToken = req.user.token;

    const user = await serviceUser.findByTokenCurrent(userToken);

    if (user) {
      return res.status(HttpCode.OK).json({
        status: "success",
        code: HttpCode.OK,
        data: {
          user,
        },
      });
    } else {
      return next({
        status: HttpCode.UNAUTHORIZED,
        mesagge: "Not authorized",
        data: "UNAUTHORIZED",
      });
    }
  } catch (error) {
    next(error);
  }
};

const updateSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const user = await serviceUser.updateSubscriptionStatus(
      userId,
      req.params.contactId,
      req.body
    );

    if (user) {
      return res.status(HttpCode.OK).json({
        status: "success",
        code: HttpCode.OK,
        data: {
          user,
        },
      });
    } else {
      return next({
        status: HttpCode.UNAUTHORIZED,
        mesagge: "Not authorized",
        data: "UNAUTHORIZED",
      });
    }
  } catch (error) {
    next(error);
  }
};

// const avatars = async (req, res, next) => {
//   try {
//     const id = req.user.id;
//     const pathFile = req.file.path;
//     const avatarUrl = await serviceUser.updateAvatar(id, pathFile);

//     return res.json({
//       status: "success",
//       code: HttpCode.CREATED,
//       data: { avatarUrl },
//     });
//   } catch (error) {
//     next(error);
//   }
// };

const avatars = async (req, res, next) => {
  try {
    const id = req.user.id;
    const uploads = new UploadService(AVATAR_OF_USERS);
    const avatarUri = await uploads.saveAvatar({ idUser: id, file: req.file });

    try {
      await fs.unlink(path.join(AVATAR_OF_USERS, req.user.avatarURL));
    } catch (e) {
      console.log(e.mesagge);
    }

    await newUserRepo.updateAvatar(id, avatarUri);

    return res.json({
      status: "success",
      code: HttpCode.CREATED,
      data: { avatarUri },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  verify,
  repeatEmailVerification,
  signup,
  login,
  logout,
  current,
  updateSubscription,
  avatars,
};
