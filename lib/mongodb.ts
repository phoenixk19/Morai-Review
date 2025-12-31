import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;
const options = {};

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  if (!client) client = new MongoClient(uri, options);

  if (process.env.NODE_ENV === 'development') {
    // @ts-ignore
    if (!global._mongoClientPromise) {
      // @ts-ignore
      global._mongoClientPromise = client.connect();
    }
    // @ts-ignore
    return global._mongoClientPromise;
  }

  if (!clientPromise) clientPromise = client.connect();
  return clientPromise;
}

export default getClientPromise;
