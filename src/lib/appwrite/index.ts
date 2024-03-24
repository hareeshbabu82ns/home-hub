// "use server";
import { env } from "@/lib/env.mjs";
import { Client, Databases, Account, Storage, ID } from "node-appwrite";

export const adminClient = new Client()
  .setEndpoint(`https://${env.APPWRITE_HOST}/v1`)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

export const client = new Client()
  .setEndpoint(`https://${env.APPWRITE_HOST}/v1`)
  .setProject(env.APPWRITE_PROJECT_ID);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// export async function createAdminClient() {
//   const client = new Client()
//     .setEndpoint(`https://${env.APPWRITE_HOST}/v1`)
//     .setProject(env.APPWRITE_PROJECT_ID)
//     .setKey(env.APPWRITE_API_KEY);

//   return {
//     get client() {
//       return client;
//     },
//     get account() {
//       return new Account(client);
//     },
//     get databases() {
//       return new Databases(client);
//     },
//     get storage() {
//       return new Storage(client);
//     },
//   };
// }

// export async function createSessionClient() {
//   const client = new Client()
//     .setEndpoint(`https://${env.APPWRITE_HOST}/v1`)
//     .setProject(env.APPWRITE_PROJECT_ID);

//   const session = cookies().get(env.APPWRITE_SESSION_COOKIE_KEY);
//   if (!session || !session.value) {
//     throw new Error("No session");
//   }

//   client.setSession(session.value);

//   return {
//     get client() {
//       return client;
//     },
//     get account() {
//       return new Account(client);
//     },
//     get databases() {
//       return new Databases(client);
//     },
//     get storage() {
//       return new Storage(client);
//     },
//   };
// }

// export async function getLoggedInUser() {
//   try {
//     const { account } = await createSessionClient();
//     return await account.get();
//   } catch (error) {
//     return null;
//   }
// }

// Users API
export const login = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  try {
    return account.createEmailPasswordSession(email, password);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.message);
  }
};

export const logout = async ({
  sessionId,
  userId,
}: {
  sessionId: string;
  userId: string;
}) => {
  try {
    if (sessionId) await account.deleteSession(sessionId);
    else if (userId) await account.deleteSessions();
    else account.deleteSession("current");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.message);
  }
};

export const register = async ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) => {
  try {
    return account.create("unique()", email, password, name);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.message);
  }
};

export const getUserData = async () => {
  try {
    return account.get();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    throw new Error(error?.message);
  }
};

export const createAccount = ({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}) => {
  return account.create("unique()", email, password, name);
};

export const getAccount = () => {
  return account.get();
};

export const createSession = ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  return account.createEmailPasswordSession(email, password);
};

export const getSession = (id: string) => {
  return account.getSession(id);
};

export const deleteCurrentSession = () => {
  return account.deleteSession("current");
};

// Files API
export const createFile = (file: File) => {
  return storage.createFile(env.APPWRITE_BUCKET_ID, "unique()", file);
};

export const listFiles = () => {
  return storage.listFiles(env.APPWRITE_BUCKET_ID);
};

export const getFilePreview = ({
  fileId,
  width,
}: {
  fileId: string;
  width: number;
}) => {
  return storage.getFilePreview(env.APPWRITE_BUCKET_ID, fileId, width);
};

export const getFileView = (fileId: string) => {
  return storage.getFileView(env.APPWRITE_BUCKET_ID, fileId);
};

// export const makeFilePublic = async ({fileId, ownerId}:{fileId:string, ownerId:string}) => {
//   return storage.updateFile(env.APPWRITE_BUCKET_ID, fileId, [
//       Permission.read(Role.user(ownerId)),
//       Permission.update(Role.user(ownerId)),
//       Permission.delete(Role.user(ownerId)),
//       Permission.read(Role.users()),
//     ]);
// };

// export const makeFilePrivate = async ({fileId, ownerId}:{fileId:string, ownerId:string}) => {
//   return storage.updateFile(env.APPWRITE_BUCKET_ID, fileId, [
//       Permission.read(Role.user(ownerId)),
//       Permission.update(Role.user(ownerId)),
//       Permission.delete(Role.user(ownerId)),
//     ]);
// };

export const deleteFile = (fileId: string) => {
  return storage.deleteFile(env.APPWRITE_BUCKET_ID, fileId);
};

// Documents API
export const createDocument = ({
  collectionId,
  documentId,
  data,
  permissions,
}: {
  collectionId: string;
  documentId?: string;
  data: Record<string, unknown>;
  permissions?: string[];
}) => {
  return databases.createDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId,
    documentId || ID.unique(),
    data,
    permissions,
  );
};

export const getDocument = ({
  collectionId,
  documentId,
}: {
  collectionId: string;
  documentId: string;
}) => {
  return databases.getDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId,
    documentId,
  );
};

export const listDocuments = ({
  collectionId,
  queries = [],
}: {
  collectionId: string;
  queries?: string[];
}) => {
  return databases.listDocuments(env.APPWRITE_DATABASE_ID, collectionId, [
    ...queries,
  ]);
};

export const updateDocument = ({
  collectionId,
  documentId,
  data,
}: {
  collectionId: string;
  documentId: string;
  data: Record<string, unknown>;
}) => {
  return databases.updateDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId,
    documentId,
    data,
  );
};

export const deleteDocument = ({
  collectionId,
  documentId,
}: {
  collectionId: string;
  documentId: string;
}) => {
  return databases.deleteDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId,
    documentId,
  );
};
