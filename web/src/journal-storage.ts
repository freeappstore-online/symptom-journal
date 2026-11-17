import { emptyDiary, loadDiary, STORAGE_KEY, validateDiary, type Diary } from "./store";

const recordKey = "current";
const storeName = "journal";
export const maxBackupBytes = 50_000_000;

type StoredDiary = { revision: string; diary: Diary };
export class DiaryConflict extends Error {}

export function serializeBackup(diary: Diary): Blob {
  const file = new Blob([JSON.stringify(diary)], { type: "application/json" });
  if (file.size > maxBackupBytes) throw new Error("Backup exceeds the 50 MB limit.");
  return file;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("symptom-journal", 1);
    let blocked = false;
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Could not open journal storage."));
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (blocked) db.close();
      else resolve(db);
    };
  });
}

async function transact(
  update: (store: IDBObjectStore, value: StoredDiary | undefined) => StoredDiary,
): Promise<StoredDiary> {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, "readwrite");
      const store = tx.objectStore(storeName);
      const request = store.get(recordKey);
      let result: StoredDiary;
      let failure: unknown;
      request.onsuccess = () => {
        try {
          result = update(store, request.result);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
      tx.oncomplete = () => resolve(result);
      tx.onabort = () => reject(failure ?? tx.error);
    });
  } finally {
    db.close();
  }
}

export async function openJournal(): Promise<StoredDiary> {
  let migrated: string | null = null;
  const result = await transact((store, value) => {
    if (value) return { ...value, diary: validateDiary(value.diary) };
    const legacy = loadDiary(window.localStorage);
    const first = { revision: crypto.randomUUID(), diary: legacy.diary };
    store.put(first, recordKey);
    migrated = legacy.raw;
    return first;
  });

  if (migrated !== null) {
    try {
      const verified = await transact((_store, value) => {
        if (!value) throw new Error("Migrated diary could not be read.");
        return { ...value, diary: validateDiary(value.diary) };
      });
      if (verified.revision === result.revision && window.localStorage.getItem(STORAGE_KEY) === migrated) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // The committed IndexedDB record remains authoritative.
    }
  }
  return result;
}

export async function writeJournal(diary: Diary, expected: string): Promise<StoredDiary> {
  const next = { revision: crypto.randomUUID(), diary: validateDiary(diary) };
  serializeBackup(next.diary);
  return transact((store, value) => {
    if (value?.revision !== expected) throw new DiaryConflict();
    store.put(next, recordKey);
    return next;
  });
}

export function readLegacyForRecovery(): Diary {
  try {
    return loadDiary(window.localStorage).diary;
  } catch {
    return emptyDiary();
  }
}
