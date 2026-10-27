import Dexie, { type EntityTable } from 'dexie';
import type { AWSService, Diagram, StudyStatus } from '../types/aws';
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
      services: 'id, name, category, tier, studyStatus, updatedAt',
      diagrams: 'id, name, updatedAt',
    });
  }
}

export const db = new CompassDatabase();

/**
 * Initializes the database and seeds it with default AWS services if empty.
 * Also synchronizes canonical docsUrl and overhauled Section 3 flowchart diagrams for existing services
 * without overwriting user's study status or custom order.
 */
export async function initializeDatabase(): Promise<void> {
  const count = await db.services.count();
  if (count === 0) {
    await db.services.bulkPut(SEED_SERVICES);
    return;
  }

  // Ensure docsUrl and overhauled flowchart diagrams are up-to-date
  const existingServices = await db.services.toArray();
  const seedMap = new Map(SEED_SERVICES.map((s) => [s.id, s]));
  const updates: Array<{ id: string; docsUrl?: string; markdownDoc?: string }> = [];

  for (const svc of existingServices) {
    const seed = seedMap.get(svc.id);
    const canonicalDocsUrl = VERIFIED_AWS_DOCS[svc.id];
    let needsUpdate = false;
    const updateData: { id: string; docsUrl?: string; markdownDoc?: string } = { id: svc.id };

    if (canonicalDocsUrl && svc.docsUrl !== canonicalDocsUrl) {
      updateData.docsUrl = canonicalDocsUrl;
      needsUpdate = true;
    }

    // Auto-migrate diagrams: if service contains banned sequenceDiagram or differs from refreshed seed
    if (seed && svc.markdownDoc && (svc.markdownDoc.includes('sequenceDiagram') || svc.markdownDoc !== seed.markdownDoc)) {
      updateData.markdownDoc = seed.markdownDoc;
      needsUpdate = true;
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
 * Updates the study status for a specific AWS service.
 */
export async function updateServiceStatus(id: string, status: StudyStatus): Promise<void> {
  await db.services.update(id, {
    studyStatus: status,
    updatedAt: Date.now(),
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
