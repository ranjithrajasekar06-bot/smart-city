import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'cityfix-offline-db';
const STORE_NAME = 'offline-reports';
const DB_VERSION = 1;

export interface OfflineReport {
  id?: number;
  title: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  user_address: string;
  issue_location: string;
  pin_code: string;
  severity: string;
  urgency: string;
  keywords: string[];
  imageBlob: Blob;
  imageName: string;
  timestamp: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        }
      },
    });
  }
  return dbPromise;
};

export const saveOfflineReport = async (report: OfflineReport) => {
  const db = await getDB();
  return db.add(STORE_NAME, report);
};

export const getAllOfflineReports = async (): Promise<OfflineReport[]> => {
  const db = await getDB();
  return db.getAll(STORE_NAME);
};

export const deleteOfflineReport = async (id: number) => {
  const db = await getDB();
  return db.delete(STORE_NAME, id);
};

export const clearOfflineReports = async () => {
  const db = await getDB();
  return db.clear(STORE_NAME);
};
