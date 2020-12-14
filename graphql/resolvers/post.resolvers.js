const { AuthenticationError, UserInputError } = require("apollo-server");

const Post = require("../../models/post.model");
const checkAuth = require("../../utilities/check-auth");

module.exports = {
  Query: {
    getPosts: async () => {
      try {
        const posts = await Post.find().sort({ createdAt: -1 });
        return posts;
      } catch (err) {
        console.log(err);
      }
    },
    getPost: async (_, { postId }) => {
      try {
        const post = await Post.findById(postId);
        if (post) {
          return post;
        } else {
          throw new Error("Post not found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Mutation: {
    createPost: async (_, { body }, context) => {
      const user = checkAuth(context);

      if (body.trim() === "") {
        throw new UserInputError("Post body must not be Empty", {
          errors: {
            body: "Post body must not be Empty",
          },
        });
      }

      const newPost = new Post({
        body,
        user: user.id,
        username: user.username,
        createdAt: new Date().toISOString(),
      });

      try {
        const post = await newPost.save();

        context.pubsub.publish("NEW_POST", {
          newPost: post,
        });

        return post;
      } catch (err) {
        console.log(err);
      }
    },
    deletePost: async (_, { postId }, context) => {
      const user = checkAuth(context);

      try {
        const post = await Post.findById(postId);

        if (user.username === post.username) {
          post.delete();
          return "Deleted Success fully";
        } else {
          throw new AuthenticationError("Action not allowed");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
    likePost: async (_, { postId }, context) => {
      const { username } = checkAuth(context);

      try {
        const post = await Post.findById(postId);

        if (post) {
          if (post.likes.find((like) => like.username === username)) {
            // post already likes, unlike it
            post.likes = post.likes.filter(
              (like) => like.username !== username
            );
          } else {
            // not liked , like it
            post.likes.push({
              username,
              createdAt: new Date().toISOString(),
            });
          }
          await post.save();
          return post;
        } else {
          throw new UserInputError("Post not Found");
        }
      } catch (err) {
        throw new Error(err);
      }
    },
  },
  Subscription: {
    newPost: {
      subscribe: (_, __, { pubsub }) => pubsub.asyncIterator("NEW_POST"),
    },
  },
};
