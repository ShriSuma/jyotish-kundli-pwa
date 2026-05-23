import Dexie, { type Table } from "dexie";
import type { KundliInput, KundliOutput, PanchangOutput, PredictionOutput } from "../core/AstroTypes";

export type SettingsRecord = {
  id?: number;
  language: "en" | "hi" | "kn" | "te" | "ta";
  createdAt: string;
  consentChoice?: "accepted" | "declined";
  analyticsEnabled?: boolean;
  chartStyle?: "north" | "south";
  notificationSettings?: {
    dailyPanchang: boolean;
    rahuKaal: boolean;
  };
  /** Default place for Panchang, Rahu Kaal, and Home (decimal degrees) */
  defaultLat?: number;
  defaultLng?: number;
  placeLabel?: string;
  pincode?: string;
  /** User confirmed a real place for Panchang (not the initial default-only state). */
  locationConfirmed?: boolean;
  /** Allow POSTing chart summary to optional narrative API. */
  narrativeConsent?: boolean;
  /** Sidereal zero-point for charts, panchānga, and predictions. */
  ayanamsaModel?: "lahiri" | "drik_ganita";
  /** Rāhu/Ketu node: mean (patrikā) vs true (modern software). */
  nodeType?: "mean" | "true";
};

export type KundliRecord = {
  id?: string;
  userId: string;
  name: string;
  birthDate: string;
  birthTime: string;
  latitude: number;
  longitude: number;
  placeName: string;
  gothra?: string;
  pincode?: string;
  kundliData: KundliOutput;
  createdAt: string;
};

export type PanchangCacheRecord = {
  id?: string;
  date: string;
  location: string;
  data: PanchangOutput;
  cachedAt: string;
};

export type PredictionCacheRecord = {
  id?: string;
  kundliId: string;
  period: "daily" | "weekly" | "monthly";
  periodKey: string;
  data: PredictionOutput;
  cachedAt: string;
};

export type ScheduledNotificationRecord = {
  id?: string;
  type: "dailyPanchang" | "rahuKaal";
  scheduledTime: string;
  payload: Record<string, unknown>;
  fired: boolean;
};

export type AnalyticsEventRecord = {
  id?: number;
  eventName: string;
  payload: Record<string, unknown>;
  timestamp: string;
};

export type GeocodeCacheRecord = {
  placeName: string;
  lat: number;
  lng: number;
  cachedAt: string;
};

class AppDatabase extends Dexie {
  settings!: Table<SettingsRecord>;
  kundlis!: Table<KundliRecord>;
  panchangCache!: Table<PanchangCacheRecord>;
  predictionCache!: Table<PredictionCacheRecord>;
  scheduledNotifications!: Table<ScheduledNotificationRecord>;
  analyticsEvents!: Table<AnalyticsEventRecord>;
  geocodeCache!: Table<GeocodeCacheRecord>;

  constructor() {
    super("jyotish-kundli-db");
    this.version(1).stores({
      settings: "++id,language,createdAt"
    });
    this.version(7).stores({
      settings: "++id,language,createdAt,consentChoice,analyticsEnabled,chartStyle",
      kundlis: "id,userId,name,createdAt",
      panchangCache: "id,date,location,cachedAt",
      predictionCache: "id,kundliId,period,periodKey,cachedAt",
      scheduledNotifications: "id,type,scheduledTime,fired",
      analyticsEvents: "++id,eventName,timestamp",
      geocodeCache: "placeName,cachedAt"
    });
  }
}

export const db = new AppDatabase();

export const initDatabase = async (): Promise<void> => {
  try {
    await db.open();
  } catch (error) {
    const name = (error as { name?: string })?.name;
    if (name === "UpgradeError") {
      await db.delete();
      await db.open();
      return;
    }
    throw error;
  }
};

export const getSettings = async (): Promise<SettingsRecord | undefined> => {
  return db.settings.orderBy("id").last();
};

export const saveSettings = async (
  data: Partial<Omit<SettingsRecord, "id" | "createdAt">> &
    Partial<Pick<SettingsRecord, "createdAt">>
): Promise<SettingsRecord> => {
  const existing = await getSettings();
  const record: SettingsRecord = {
    language: data.language ?? existing?.language ?? "en",
    createdAt: data.createdAt ?? existing?.createdAt ?? new Date().toISOString(),
    consentChoice: data.consentChoice ?? existing?.consentChoice,
    analyticsEnabled: data.analyticsEnabled ?? existing?.analyticsEnabled,
    chartStyle: data.chartStyle ?? existing?.chartStyle,
    notificationSettings: data.notificationSettings ?? existing?.notificationSettings,
    defaultLat: data.defaultLat ?? existing?.defaultLat ?? 19.076,
    defaultLng: data.defaultLng ?? existing?.defaultLng ?? 72.8777,
    placeLabel: data.placeLabel !== undefined ? data.placeLabel : (existing?.placeLabel ?? "Mumbai"),
    pincode: data.pincode !== undefined ? data.pincode : (existing?.pincode ?? ""),
    locationConfirmed: data.locationConfirmed ?? existing?.locationConfirmed,
    narrativeConsent: data.narrativeConsent ?? existing?.narrativeConsent,
    ayanamsaModel: data.ayanamsaModel ?? existing?.ayanamsaModel ?? "lahiri",
    nodeType: data.nodeType ?? existing?.nodeType ?? "mean"
  };

  if (existing?.id) {
    await db.settings.update(existing.id, record);
    return { ...record, id: existing.id };
  }

  const id = await db.settings.add(record);
  return { ...record, id };
};

const toId = (seed: string): string => `${seed}-${Math.random().toString(36).slice(2, 10)}`;

export const saveKundli = async (input: KundliInput, output: KundliOutput): Promise<string> => {
  const id = toId(input.name || "kundli");
  const record: KundliRecord = {
    id,
    userId: "local-user",
    name: input.name,
    birthDate: input.birthDate,
    birthTime: input.birthTime,
    latitude: input.latitude,
    longitude: input.longitude,
    placeName: "Custom",
    gothra: input.gothra,
    pincode: input.pincode,
    kundliData: output,
    createdAt: new Date().toISOString()
  };
  await db.kundlis.put(record);
  return id;
};

export const getKundlis = async (): Promise<KundliOutput[]> => {
  const records = await db.kundlis.orderBy("createdAt").reverse().toArray();
  return records.map((r) => r.kundliData);
};

export const getLatestKundliRecord = async (): Promise<KundliRecord | undefined> => {
  return db.kundlis.orderBy("createdAt").reverse().first();
};

export const savePanchangCache = async (date: string, location: string, data: PanchangOutput): Promise<void> => {
  const id = `${date}-${location}`;
  await db.panchangCache.put({ id, date, location, data, cachedAt: new Date().toISOString() });
};

export const getPanchangCache = async (date: string, location: string): Promise<PanchangOutput | null> => {
  const id = `${date}-${location}`;
  const row = await db.panchangCache.get(id);
  return row?.data ?? null;
};

export const savePredictionCache = async (
  kundliId: string,
  period: "daily" | "weekly" | "monthly",
  key: string,
  lang: string,
  data: PredictionOutput
): Promise<void> => {
  const id = `${kundliId}-${period}-${key}-${lang}`;
  await db.predictionCache.put({
    id,
    kundliId,
    period,
    periodKey: key,
    data,
    cachedAt: new Date().toISOString()
  });
};

export const getPredictionCache = async (
  kundliId: string,
  period: "daily" | "weekly" | "monthly",
  key: string,
  lang: string
): Promise<PredictionOutput | null> => {
  const row = await db.predictionCache.get(`${kundliId}-${period}-${key}-${lang}`);
  if (!row) return null;
  const ageMs = Date.now() - new Date(row.cachedAt).getTime();
  const ttl = period === "daily" ? 86400000 : period === "weekly" ? 7 * 86400000 : 31 * 86400000;
  return ageMs > ttl ? null : row.data;
};

export const saveScheduledNotification = async (record: ScheduledNotificationRecord): Promise<void> => {
  const id = record.id ?? `${record.type}-${record.scheduledTime}`;
  await db.scheduledNotifications.put({ ...record, id });
};

export const clearScheduledNotifications = async (type?: "dailyPanchang" | "rahuKaal"): Promise<void> => {
  if (!type) {
    await db.scheduledNotifications.clear();
    return;
  }
  const rows = await db.scheduledNotifications.where("type").equals(type).toArray();
  await db.scheduledNotifications.bulkDelete(rows.map((r) => r.id!).filter(Boolean));
};

export const getScheduledNotifications = async (): Promise<ScheduledNotificationRecord[]> => {
  return db.scheduledNotifications.toArray();
};

export const saveAnalyticsEvent = async (eventName: string, payload: Record<string, unknown>): Promise<void> => {
  const settings = await getSettings();
  if (!settings?.analyticsEnabled) {
    return;
  }
  await db.analyticsEvents.add({
    eventName,
    payload,
    timestamp: new Date().toISOString()
  });
};

export const getAnalyticsEventCounts = async (): Promise<Record<string, number>> => {
  const rows = await db.analyticsEvents.toArray();
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.eventName] = (acc[row.eventName] ?? 0) + 1;
    return acc;
  }, {});
};

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export const cacheGeocode = async (placeName: string, lat: number, lng: number): Promise<void> => {
  await db.geocodeCache.put({
    placeName: placeName.toLowerCase(),
    lat,
    lng,
    cachedAt: new Date().toISOString()
  });
};

export const getGeocode = async (placeName: string): Promise<{ lat: number; lng: number } | null> => {
  const row = await db.geocodeCache.get(placeName.toLowerCase());
  if (!row) return null;
  const ageMs = Date.now() - new Date(row.cachedAt).getTime();
  if (ageMs > THIRTY_DAYS_MS) {
    await db.geocodeCache.delete(placeName.toLowerCase());
    return null;
  }
  return { lat: row.lat, lng: row.lng };
};
