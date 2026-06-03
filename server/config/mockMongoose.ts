import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";

// Global flag to track whether we're currently bypassing mongoose with mock DB
declare global {
  var useMockDB: boolean;
}

const DB_FILE = path.join("/tmp", "smartcity_db_clean.json");

interface MockStore {
  [collectionName: string]: any[];
}

export let mockStore: MockStore = {
  users: [],
  issues: [],
  notifications: [],
  auditlogs: [],
  votes: []
};

// Generate a random MongoDB-like string _id
export function createObjectId() {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
}

// Save database to persistent /tmp file
function saveStore() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(mockStore, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save mock store to file:", err);
  }
}

// Load database from file with mock seeds if empty
export async function loadAndSeedStore() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, "utf-8");
      mockStore = JSON.parse(data);
      console.log(`Loaded ${Object.keys(mockStore).reduce((acc, key) => acc + mockStore[key].length, 0)} items from local persistent storage.`);
      return;
    }
  } catch (err) {
    console.error("Failed to read local persistent store, using fresh in-memory data:", err);
  }

  // Seed initial values if empty and file doesn't exist
  console.log("Seeding fresh fallback database with mock users and issues...");
  
  const hashedPassword = await bcrypt.hash("password123", 10);
  
  const superAdminId = createObjectId();
  const adminId = createObjectId();
  const citizenId = createObjectId();

  const users = [
    {
      _id: superAdminId,
      name: "Super Admin",
      email: "superadmin@smartcity.com",
      password: hashedPassword,
      role: "super_admin",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: adminId,
      name: "City Engineer",
      email: "admin@smartcity.com",
      password: hashedPassword,
      role: "admin",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: citizenId,
      name: "Jane Doe",
      email: "citizen@smartcity.com",
      password: hashedPassword,
      role: "citizen",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const issues: any[] = [];

  const auditlogs: any[] = [];

  mockStore.users = users;
  mockStore.issues = issues;
  mockStore.auditlogs = auditlogs;

  saveStore();
}

// Convert mock data objects into fake Mongoose Documents with save(), deleteOne(), conversion methods
function makeDocument(obj: any, collectionName: string) {
  if (!obj) return obj;
  
  const doc = { ...obj };
  const idStr = doc._id ? String(doc._id) : createObjectId();
  
  // Custom smart ObjectId replacement
  doc._id = {
    toString() { return idStr; },
    equals(other: any) { return String(other) === idStr; }
  };

  doc.save = async function() {
    const list = mockStore[collectionName];
    const index = list.findIndex(item => String(item._id) === idStr);
    
    const now = new Date().toISOString();
    doc.updatedAt = now;
    if (!doc.createdAt) doc.createdAt = now;

    // Build plain object to write back to JSON store
    const cleanDoc = { ...doc };
    delete cleanDoc.save;
    delete cleanDoc.deleteOne;
    delete cleanDoc.toObject;
    delete cleanDoc.toJSON;
    cleanDoc._id = idStr;

    if (index >= 0) {
      list[index] = cleanDoc;
    } else {
      list.push(cleanDoc);
    }
    
    saveStore();
    return makeDocument(cleanDoc, collectionName);
  };

  doc.deleteOne = async function() {
    const list = mockStore[collectionName];
    const index = list.findIndex(item => String(item._id) === idStr);
    if (index >= 0) {
      list.splice(index, 1);
      saveStore();
    }
    return { deletedCount: 1 };
  };

  doc.toObject = function() {
    const clean = { ...doc };
    delete clean.save;
    delete clean.deleteOne;
    delete clean.toObject;
    delete clean.toJSON;
    clean._id = idStr;
    return clean;
  };

  doc.toJSON = function() {
    return doc.toObject();
  };

  return doc;
}

// Mock query matching including standard selectors ($ne, $gte, $lte, $in)
function matchesQuery(item: any, query: any): boolean {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const key of Object.keys(query)) {
    const val = query[key];
    
    if (val && typeof val === 'object') {
      if ('$ne' in val) {
        if (String(item[key]) === String(val.$ne)) return false;
      }
      if ('$gte' in val) {
        if (new Date(item[key]).getTime() < new Date(val.$gte).getTime()) return false;
      }
      if ('$lte' in val) {
        if (new Date(item[key]).getTime() > new Date(val.$lte).getTime()) return false;
      }
      if ('$in' in val && Array.isArray(val.$in)) {
        const itemValStr = String(item[key]);
        const inValsStrs = val.$in.map((v: any) => String(v));
        if (!inValsStrs.includes(itemValStr)) return false;
      }
    } else {
      let itemVal = item[key];
      let queryVal = val;
      
      if (key === '_id' || key === 'user_id' || key === 'issue_id') {
        if (String(itemVal) !== String(queryVal)) return false;
      } else if (itemVal !== queryVal) {
        return false;
      }
    }
  }
  return true;
}

// Chainable mock mongoose query simulator
class MockQuery {
  private promise: Promise<any>;

  constructor(promise: Promise<any>) {
    this.promise = promise;
  }

  then(onfulfilled?: (value: any) => any, onrejected?: (reason: any) => any) {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch(onrejected?: (reason: any) => any) {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: () => void) {
    return this.promise.finally(onfinally);
  }

  sort(arg: any) {
    this.promise = this.promise.then(data => {
      if (!Array.isArray(data)) return data;
      if (arg && typeof arg === 'object') {
        const key = Object.keys(arg)[0];
        const order = arg[key];
        return [...data].sort((a, b) => {
          const valA = a[key];
          const valB = b[key];
          if (!valA) return 1;
          if (!valB) return -1;
          if (order === -1) {
            return new Date(valB).getTime() - new Date(valA).getTime();
          } else {
            return new Date(valA).getTime() - new Date(valB).getTime();
          }
        });
      }
      return data;
    });
    return this;
  }

  limit(num: number) {
    this.promise = this.promise.then(data => {
      if (!Array.isArray(data)) return data;
      return data.slice(0, num);
    });
    return this;
  }

  populate(path: string, selectFields?: string) {
    this.promise = this.promise.then(data => {
      const populateDoc = (doc: any) => {
        if (!doc) return doc;
        if (path === 'user_id' && doc.user_id) {
          const userIdStr = typeof doc.user_id === 'object' && doc.user_id._id ? doc.user_id._id.toString() : String(doc.user_id);
          const userObj = mockStore.users.find(u => String(u._id) === userIdStr);
          if (userObj) {
            doc.user_id = {
              _id: userObj._id,
              name: userObj.name,
              email: userObj.email,
              role: userObj.role,
              createdAt: userObj.createdAt
            };
          }
        }
        return doc;
      };

      if (Array.isArray(data)) {
        return data.map(populateDoc);
      } else {
        return populateDoc(data);
      }
    });
    return this;
  }

  select(fields: string) {
    return this;
  }
}

// Hook up Mongoose interceptors
export function enableMongooseMock() {
  global.useMockDB = true;
  console.log("----------------------------------------------------------------");
  console.log("🔮 ENABLED MONGODB MOCK SANDBOX BYPASS:");
  console.log("No MongoDB URI configured. App is running with robust JSON fallbacks!");
  console.log("Credentials seeded automatically: ");
  console.log("  - Super Admin: superadmin@smartcity.com | password123");
  console.log("  - Admin: admin@smartcity.com | password123");
  console.log("  - Citizen: citizen@smartcity.com | password123");
  console.log("----------------------------------------------------------------");

  // Stub model connection state
  Object.defineProperty(mongoose.connection, "readyState", {
    get: () => 1,
    configurable: true
  });

  // Inject monkey patches on Model static actions
  const getCollectionName = (modelName: string) => {
    switch (modelName.toLowerCase()) {
      case "user": return "users";
      case "issue": return "issues";
      case "notification": return "notifications";
      case "auditlog": return "auditlogs";
      case "vote": return "votes";
      default: return modelName.toLowerCase() + "s";
    }
  };

  (mongoose.Model as any).find = function(this: any, query: any) {
    const col = getCollectionName(this.modelName);
    const p = Promise.resolve(
      (mockStore[col] || [])
        .filter(item => matchesQuery(item, query))
        .map(item => makeDocument(item, col))
    );
    return new MockQuery(p) as any;
  };

  (mongoose.Model as any).findOne = function(this: any, query: any) {
    const col = getCollectionName(this.modelName);
    const item = (mockStore[col] || []).find(item => matchesQuery(item, query));
    const p = Promise.resolve(item ? makeDocument(item, col) : null);
    return new MockQuery(p) as any;
  };

  (mongoose.Model as any).findById = function(this: any, id: any) {
    const col = getCollectionName(this.modelName);
    const item = (mockStore[col] || []).find(item => String(item._id) === String(id));
    const p = Promise.resolve(item ? makeDocument(item, col) : null);
    return new MockQuery(p) as any;
  };

  (mongoose.Model as any).create = async function(this: any, doc: any) {
    const col = getCollectionName(this.modelName);
    const item = { 
      _id: createObjectId(), 
      ...doc,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockStore[col] = mockStore[col] || [];
    mockStore[col].push(item);
    saveStore();
    return makeDocument(item, col);
  };

  (mongoose.Model as any).updateOne = function(this: any, query: any, update: any) {
    const col = getCollectionName(this.modelName);
    const list = mockStore[col] || [];
    const index = list.findIndex(item => matchesQuery(item, query));
    if (index >= 0) {
      if (update.$set) {
        list[index] = { ...list[index], ...update.$set, updatedAt: new Date().toISOString() };
      }
      saveStore();
    }
    return Promise.resolve({ matchedCount: index >= 0 ? 1 : 0, modifiedCount: index >= 0 ? 1 : 0 }) as any;
  };

  (mongoose.Model as any).updateMany = function(this: any, query: any, update: any) {
    const col = getCollectionName(this.modelName);
    const list = mockStore[col] || [];
    let matchCount = 0;
    for (let i = 0; i < list.length; i++) {
      if (matchesQuery(list[i], query)) {
        matchCount++;
        if (update.$set) {
          list[i] = { ...list[i], ...update.$set, updatedAt: new Date().toISOString() };
        }
      }
    }
    if (matchCount > 0) saveStore();
    return Promise.resolve({ matchedCount: matchCount, modifiedCount: matchCount }) as any;
  };

  (mongoose.Model as any).deleteOne = function(this: any, query: any) {
    const col = getCollectionName(this.modelName);
    const list = mockStore[col] || [];
    const index = list.findIndex(item => matchesQuery(item, query));
    let deletedCount = 0;
    if (index >= 0) {
      list.splice(index, 1);
      deletedCount = 1;
      saveStore();
    }
    return Promise.resolve({ deletedCount }) as any;
  };

  (mongoose.Model as any).deleteMany = function(this: any, query: any) {
    const col = getCollectionName(this.modelName);
    const prevLen = (mockStore[col] || []).length;
    mockStore[col] = (mockStore[col] || []).filter(item => !matchesQuery(item, query));
    const deletedCount = prevLen - mockStore[col].length;
    if (deletedCount > 0) saveStore();
    return Promise.resolve({ deletedCount }) as any;
  };

  (mongoose.Model as any).findByIdAndDelete = function(this: any, id: any) {
    const col = getCollectionName(this.modelName);
    const list = mockStore[col] || [];
    const index = list.findIndex(item => String(item._id) === String(id));
    let item = null;
    if (index >= 0) {
      item = list.splice(index, 1)[0];
      saveStore();
    }
    return Promise.resolve(item ? makeDocument(item, col) : null) as any;
  };

  (mongoose.Model as any).countDocuments = function(this: any, query: any) {
    const col = getCollectionName(this.modelName);
    const count = (mockStore[col] || []).filter(item => matchesQuery(item, query)).length;
    return Promise.resolve(count) as any;
  };

  // Custom Pipeline Aggregator representation
  (mongoose.Model as any).aggregate = function(this: any, pipeline: any[]) {
    const col = getCollectionName(this.modelName);
    let data = [...(mockStore[col] || [])];

    for (const stage of pipeline) {
      if (stage.$match) {
        data = data.filter(item => matchesQuery(item, stage.$match));
      }
      if (stage.$group) {
        const groupKey = stage.$group._id;
        const groups: { [key: string]: number } = {};
        
        for (const item of data) {
          let keyVal = "";
          if (typeof groupKey === 'string' && groupKey.startsWith('$')) {
            keyVal = String(item[groupKey.slice(1)] || "");
          } else if (groupKey && typeof groupKey === 'object') {
            if (groupKey.$dateToString) {
              const dateField = groupKey.$dateToString.date.slice(1);
              const dateVal = item[dateField];
              if (dateVal) {
                const d = new Date(dateVal);
                keyVal = d.toISOString().split('T')[0];
              }
            }
          }
          groups[keyVal] = (groups[keyVal] || 0) + 1;
        }

        const results = Object.entries(groups).map(([id, count]) => ({
          _id: id,
          count: count
        }));
        return Promise.resolve(results) as any;
      }
    }
    return Promise.resolve(data) as any;
  };
}
