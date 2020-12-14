const bycrpt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { UserInputError } = require("apollo-server");

const {
  validateRegisterInput,
  validateLoginInput,
} = require("../../utilities/validators");
const SECRET_KEY = process.env.SECRET_KEY;
const User = require("../../models/user.model");

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    SECRET_KEY,
    { expiresIn: "1h" }
  );
};

module.exports = {
  Mutation: {
    login: async (_, { username, password }) => {
      const { valid, errors } = validateLoginInput(username, password);

      if (!valid) {
        throw new UserInputError("Error", { errors });
      }

      const user = await User.findOne({ username });

      if (!user) {
        errors.general = "User not found";
        throw new UserInputError("User not found", { errors });
      }

      const match = await bycrpt.compare(password, user.password);

      if (!match) {
        errors.general = "Wrong credentials";
        throw new UserInputError("Wrong Credentidals", { errors });
      }

      const token = generateToken(user);

      return {
        ...user._doc,
        id: user._id,
        token,
      };
    },
    register: async (
      _,
      { registerInput: { email, password, username, confirmPassword } }
    ) => {
      // validate registration
      const { valid, errors } = validateRegisterInput(
        email,
        password,
        username,
        confirmPassword
      );

      if (!valid) {
        throw new UserInputError("Error", { errors });
      }
      // check user exist
      username = username.trim();
      const user = await User.findOne({ username });
      if (user) {
        throw new UserInputError("Username is taken", {
          errors: {
            username: "Username is taken",
          },
        });
      }

      // create user
      const newPassword = await bycrpt.hash(password, 12);

      const newUser = new User({
        email,
        password: newPassword,
        username,
        createdAt: new Date().toISOString(),
      });

      const res = await newUser.save();

      const token = generateToken(res);

      return {
        ...res._doc,
        id: res._id,
        token,
      };
    },
  },
};
