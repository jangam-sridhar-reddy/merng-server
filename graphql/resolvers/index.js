const postResolvers = require("./post.resolvers");
const userResolvers = require("./user.resolvers");
const commentsResolvers = require("./comments.resolvers");

module.exports = {
  Post: {
    likeCount: (parent) => parent.likes.length,
    commentCount: (parent) => parent.comments.length,
  },
  Query: {
    ...postResolvers.Query,
  },
  Mutation: {
    ...userResolvers.Mutation,
    ...postResolvers.Mutation,
    ...commentsResolvers.Mutation,
  },
  Subscription: {
    ...postResolvers.Subscription,
  },
};
