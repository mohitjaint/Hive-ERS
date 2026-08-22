import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import Member from "../models/Members.model.js";
import { APIError } from "better-auth/api";

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();
const db = client.db();

const trustedOrigin = process.env.CORS_ORIGIN || "http://localhost:3001";

export const auth = betterAuth({
  advanced: {
    trustedProxyHeaders: true,
  },

  trustedOrigins: [
    trustedOrigin,
  ],

  onAPIError: {
    errorURL: trustedOrigin,
  },

  database: mongodbAdapter(db, {
    client,
  }),

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
  },

  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const member = await Member.findOne({
            email: user.email.toLowerCase(),
            active: true,
          });

          if (!member) {
            throw new APIError("FORBIDDEN", {
              message: "NOT_AN_ERS_MEMBER",
            });
          }

          return { data: user };
        },
      },
    },
  },
});