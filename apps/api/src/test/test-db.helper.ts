import { MongoMemoryServer } from 'mongodb-memory-server';
import { connect, Connection } from 'mongoose';

let mongod: MongoMemoryServer;
let mongoConnection: Connection;

export async function setupTestDb(): Promise<{ uri: string }> {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  mongoConnection = (await connect(uri)).connection;
  return { uri };
}

export async function teardownTestDb(): Promise<void> {
  await mongoConnection?.dropDatabase();
  await mongoConnection?.close();
  await mongod?.stop();
}

export async function clearTestDb(): Promise<void> {
  const collections = mongoConnection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
}
