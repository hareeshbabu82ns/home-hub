import { env } from "@/lib/env.mjs";
import type {
  Adapter,
  // AdapterAccount,
  // AdapterAuthenticator,
  // AdapterSession,
  // AdapterUser,
} from "@auth/core/adapters";
import { Account, Client, Databases, ID, Query, Storage } from "node-appwrite";
import {
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "next-auth/adapters";

const DB_USERS = "Users";
const DB_ACCOUNTS = "UserAccounts";
const DB_SESSIONS = "Sessions";
const DB_VERIFICATION_TOKENS = "VerificationTokens";

export function NextAuthAdapter({
  client,
  adminClient,
  account: clientAccount,
  databases: clientDatabases,
  // storage: clientStorage,
}: {
  client: Client;
  adminClient: Client;
  account?: Account;
  databases?: Databases;
  storage?: Storage;
}): Adapter {
  const accountWithKey = new Account(adminClient);
  const databasesWithKey = new Databases(adminClient);
  const account = clientAccount || new Account(client);
  const databases = clientDatabases || new Databases(client);
  // const storage = clientStorage || new Storage(client);

  return {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async createUser({ id: _id, email, ...data }) {
      console.log("createUser", data);
      let userId: string | null = null;
      // try {
      const users = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        [Query.equal("email", email)],
      );
      if (users.total === 0) {
        const newAccountUser = await accountWithKey.create(
          ID.unique(),
          email,
          email,
          data?.name || "",
        );
        userId = newAccountUser.$id;
        await databasesWithKey.createDocument(
          env.APPWRITE_DATABASE_ID,
          DB_USERS,
          newAccountUser.$id,
          { email, ...data },
        );
      } else {
        userId = users.documents[0].$id;
      }
      const session = await account.createEmailPasswordSession(email, email);
      client.setSession(session.secret);
      userId = session.userId;
      return {
        id: userId,
        email,
        emailVerified: data.emailVerified,
      };
      // } catch (e: any) {
      //   return data;
      // }
    },
    async getUser(id) {
      console.log("getUser", id);
      const user = await databases.getDocument(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        id,
      );
      return {
        id: user.$id,
        email: user.email,
        emailVerified: user.emailVerified,
      };
    },
    async getUserByAccount({ provider, providerAccountId }) {
      console.log("getUserByAccount", providerAccountId);
      if (!providerAccountId) return null;
      const accounts = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_ACCOUNTS,
        [
          Query.equal("provider", `${provider}`),
          Query.equal("providerAccountId", `${providerAccountId}`),
        ],
      );
      if (!accounts.total) return null;
      const user = await databasesWithKey.getDocument(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        accounts.documents[0].userId,
      );
      console.log("accountUser", user);
      return {
        email: user.email,
        id: user.$id,
        emailVerified: user.emailVerified,
      };
    },
    async getUserByEmail(email) {
      console.log("getUserByEmail", email);
      const users = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        [Query.equal("email", email)],
      );
      if (!users.total) return null;
      const user = users.documents[0];
      console.log("user", user);
      return {
        id: user.$id,
        email: user.email,
        emailVerified: user.emailVerified,
        name: user.name,
        image: user.image,
      };
    },
    async updateUser(user) {
      console.log("updateUser", user);
      // await account.updateEmail( user.email );
      if (user?.name) await account.updateName(user.name);
      const userRes = await databases.updateDocument(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        user.id,
        {
          ...user,
        },
      );
      // const userRes = await account.get();
      return {
        id: userRes.$id,
        email: userRes.email,
        emailVerified: userRes.emailVerified,
      };
    },
    async deleteUser(userId) {
      console.log("deleteUser", userId);
      await account.deleteSession(userId);
    },
    async linkAccount(data) {
      console.log("linkAccount", data);
      const account = await databasesWithKey.createDocument(
        env.APPWRITE_DATABASE_ID,
        DB_ACCOUNTS,
        ID.unique(),
        { ...data },
      );
      console.log("account", account);
      // return account as unknown as AdapterAccount;
    },
    async getAccount(providerAccountId, provider) {
      console.log("linkAccount", provider, providerAccountId);
      const accounts = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_ACCOUNTS,
        [
          Query.equal("provider", provider),
          Query.equal("providerAccountId", providerAccountId),
        ],
      );
      if (!accounts.total) return null;
      return accounts.documents[0] as unknown as AdapterAccount;
    },
    async unlinkAccount(provider_providerAccountId) {
      console.log("unlinkAccount", provider_providerAccountId);
      throw new Error("Not implemented");
    },
    async getSessionAndUser(sessionToken) {
      console.log("getSessionAndUser", sessionToken);
      const sessions = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_SESSIONS,
        [Query.equal("sessionToken", sessionToken)],
      );
      if (!sessions.total) return null;
      const session = { ...sessions.documents[0] };
      session.expires = new Date(session.expires);
      const user = await databasesWithKey.getDocument(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        session.userId,
      );
      if (!user) return null;
      console.log("user", user, "session", sessions.documents[0]);
      return { user, session } as {
        user: AdapterUser;
        session: AdapterSession;
      };
    },
    async createSession(data) {
      console.log("createSession", data);
      const user = await databasesWithKey.getDocument(
        env.APPWRITE_DATABASE_ID,
        DB_USERS,
        data.userId,
      );
      const session = await account.createEmailPasswordSession(
        user.email,
        user.email,
      );
      client.setSession(session.secret);
      console.log("appwrite session", session);
      await databasesWithKey.createDocument(
        env.APPWRITE_DATABASE_ID,
        DB_SESSIONS,
        ID.unique(),
        { ...data },
      );
      return data;
    },
    async updateSession(data) {
      console.log("updateSession", data);
      const res = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_SESSIONS,
        [Query.equal("sessionToken", data.sessionToken)],
      );
      if (!res.total) return null;

      await account.updateSession(data.sessionToken);
      const session = await databasesWithKey.updateDocument(
        env.APPWRITE_DATABASE_ID,
        DB_SESSIONS,
        res.documents[0].$id,
        { ...data },
      );
      return session as unknown as AdapterSession;
    },
    async deleteSession(sessionToken) {
      console.log("deleteSession", sessionToken);
      const res = await databasesWithKey.listDocuments(
        env.APPWRITE_DATABASE_ID,
        DB_SESSIONS,
        [Query.equal("sessionToken", sessionToken)],
      );
      if (!res.total) return null;
      // await account.deleteSession(res.documents[0].$id);
    },
    async createVerificationToken(data) {
      console.log("createVerificationToken", data);
      // await databasesWithKey.createDocument(
      //   env.APPWRITE_DATABASE_ID,
      //   DB_VERIFICATION_TOKENS,
      //   ID.unique(),
      //   { ...data },
      // );
      return data;
    },
    async useVerificationToken(identifier_token) {
      console.log("useVerificationToken", identifier_token);
      throw new Error("Not implemented");
    },
    async createAuthenticator(authenticator) {
      console.log("createAuthenticator", authenticator);
      throw new Error("Not implemented");
    },
    async getAuthenticator(credentialID) {
      console.log("getAuthenticator", credentialID);
      throw new Error("Not implemented");
    },
    async listAuthenticatorsByUserId(userId) {
      console.log("listAuthenticatorsByUserId", userId);
      throw new Error("Not implemented");
    },
    async updateAuthenticatorCounter(credentialID, counter) {
      console.log("updateAuthenticatorCounter", credentialID, counter);
      throw new Error("Not implemented");
    },
  };
}
