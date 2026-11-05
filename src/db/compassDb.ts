import Dexie, { type EntityTable } from 'dexie';
import type { AWSService, Diagram } from '../types/aws';
import { SEED_SERVICES } from './seedServices';
import { VERIFIED_AWS_DOCS } from '../utils/awsDocs';

/**
 * AWS Compass Dexie Database
 * Manages indexed local storage for AWS Service Catalog and Architecture Diagrams.
 */
export class CompassDatabase extends Dexie {
  services!: EntityTable<AWSService, 'id'>;
  diagrams!: EntityTable<Diagram, 'id'>;

  constructor() {
    super('AWSCompassDB');
    this.version(1).stores({
      services: 'id, name, category, tier, isFavorite, updatedAt',
      diagrams: 'id, name, updatedAt',
    });
  }
}

export const db = new CompassDatabase();

/**
 * Initializes the database and seeds it with default AWS services if empty.
 * Also synchronizes canonical docsUrl, isFavorite flag, and overhauled Section 3 flowchart diagrams
 * for existing services without overwriting user's custom notes or order.
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.services.count();
  if (count === 0) {
    await db.services.bulkPut(SEED_SERVICES);
    return;
  }

  // Ensure missing services are added, and docsUrl, isFavorite, and metadata are up-to-date
  const existingServices = await db.services.toArray();
  const existingMap = new Map(existingServices.map((s) => [s.id, s]));
  const seedMap = new Map(SEED_SERVICES.map((s) => [s.id, s]));

  // 1. Bulk insert any missing services from the expanded 230+ catalog
  const missingServices = SEED_SERVICES.filter((s) => !existingMap.has(s.id));
  if (missingServices.length > 0) {
    await db.services.bulkPut(missingServices);
  }

  // 2. Synchronize existing services with canonical metadata while preserving user favorites & custom notes
  const updates: Array<{ id: string } & Partial<AWSService>> = [];

  for (const svc of existingServices) {
    const seed = seedMap.get(svc.id);
    const canonicalDocsUrl = VERIFIED_AWS_DOCS[svc.id] || seed?.docsUrl;
    let needsUpdate = false;
    const updateData: { id: string } & Partial<AWSService> = { id: svc.id };

    if (canonicalDocsUrl && svc.docsUrl !== canonicalDocsUrl) {
      updateData.docsUrl = canonicalDocsUrl;
      needsUpdate = true;
    }

    if (svc.isFavorite === undefined) {
      updateData.isFavorite = false;
      needsUpdate = true;
    }

      if (seed) {
        if (seed.shortName && svc.shortName !== seed.shortName) {
          updateData.shortName = seed.shortName;
          needsUpdate = true;
        }
        if (seed.cliPrefix && svc.cliPrefix !== seed.cliPrefix) {
          updateData.cliPrefix = seed.cliPrefix;
          needsUpdate = true;
        }
        if (seed.tier && svc.tier !== seed.tier) {
          updateData.tier = seed.tier;
          needsUpdate = true;
        }
        if (seed.category && svc.category !== seed.category) {
          updateData.category = seed.category;
          needsUpdate = true;
        }

        // Auto-migrate diagrams: if service contains banned sequenceDiagram
        if (svc.markdownDoc && svc.markdownDoc.includes('sequenceDiagram')) {
          updateData.markdownDoc = seed.markdownDoc;
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        updates.push(updateData);
      }
    }

    if (updates.length > 0) {
      await db.transaction('rw', db.services, async () => {
        for (const update of updates) {
          const { id, ...data } = update;
          await db.services.update(id, data);
        }
      });
    }
  }

  /**
   * Resets the service catalog to the initial seed dataset.
   */
  export async function resetDatabaseToDefaults(): Promise<void> {
    await db.services.clear();
    await db.services.bulkPut(SEED_SERVICES);
  }

  /**
   * Retrieves all services from the database, sorted by custom order if set, or alphabetically by name.
   */
  export async function getAllServices(): Promise<AWSService[]> {
    const all = await db.services.toArray();
    return all.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  }

  /**
   * Fetches a single AWS service by its unique ID.
   */
  export async function getServiceById(id: string): Promise<AWSService | undefined> {
    return await db.services.get(id);
  }

  /**
   * Toggles the favorite status for a specific AWS service.
   */
  export async function toggleServiceFavorite(id: string): Promise<boolean> {
    const svc = await db.services.get(id);
    if (!svc) return false;
    const nextFav = !svc.isFavorite;
    await db.services.update(id, {
      isFavorite: nextFav,
      updatedAt: Date.now(),
    });
    return nextFav;
  }

  /**
   * Clears all favorited bookmarks.
   */
  export async function clearAllFavorites(): Promise<void> {
    await db.transaction('rw', db.services, async () => {
      const all = await db.services.toArray();
      for (const s of all) {
        if (s.isFavorite) {
          await db.services.update(s.id, {
            isFavorite: false,
            updatedAt: Date.now(),
          });
        }
      }
    });
  }

  /**
   * Updates the markdown concept documentation for a specific AWS service.
   */
  export async function updateServiceDoc(id: string, markdownDoc: string): Promise<void> {
    await db.services.update(id, {
      markdownDoc,
      updatedAt: Date.now(),
    });
  }

  /**
   * Saves or updates an architecture diagram snapshot.
   */
  export async function saveDiagram(diagram: Diagram): Promise<void> {
    await db.diagrams.put({
      ...diagram,
      updatedAt: Date.now(),
    });
  }

  /**
   * Retrieves all architecture diagrams.
   */
  export async function getAllDiagrams(): Promise<Diagram[]> {
    return await db.diagrams.orderBy('updatedAt').reverse().toArray();
  }

  /**
   * Retrieves a single architecture diagram by ID.
   */
  export async function getDiagramById(id: string): Promise<Diagram | undefined> {
    return await db.diagrams.get(id);
  }

  /**
   * Deletes an architecture diagram by ID.
   */
  export async function deleteDiagram(id: string): Promise<void> {
    await db.diagrams.delete(id);
  }

  export interface CompassDatabaseBackup {
    version: string;
    app: 'aws-compass';
    exportedAt: number;
    services: AWSService[];
    diagrams: Diagram[];
  }

  /**
   * Exports the entire Dexie database (services with custom notes & study status + diagrams)
   * as a portable JSON formatted string.
   */
  export async function exportFullDatabase(): Promise<string> {
    const services = await db.services.toArray();
    const diagrams = await db.diagrams.toArray();
    const backup: CompassDatabaseBackup = {
      version: '1.0',
      app: 'aws-compass',
      exportedAt: Date.now(),
      services,
      diagrams,
    };
    return JSON.stringify(backup, null, 2);
  }

  /**
   * Imports and restores services and diagrams into Dexie from a JSON backup.
   */
  export async function importFullDatabase(
    jsonString: string
  ): Promise<{ servicesCount: number; diagramsCount: number }> {
    const parsed = JSON.parse(jsonString) as Partial<CompassDatabaseBackup>;
    if (!parsed || !Array.isArray(parsed.services)) {
      throw new Error('Invalid backup file format: missing "services" array.');
    }

    if (parsed.services.length > 0) {
      await db.services.bulkPut(parsed.services);
    }

    if (Array.isArray(parsed.diagrams) && parsed.diagrams.length > 0) {
      await db.diagrams.bulkPut(parsed.diagrams);
    }

    return {
      servicesCount: parsed.services.length,
      diagramsCount: Array.isArray(parsed.diagrams) ? parsed.diagrams.length : 0,
    };
  }
