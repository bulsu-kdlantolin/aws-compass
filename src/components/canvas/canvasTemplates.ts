import { SEED_BLUEPRINTS, type ArchitectureBlueprint } from '../../db/seedBlueprints';

export type ArchitectureTemplate = ArchitectureBlueprint;

/**
 * Re-exports the reference blueprints as ARCHITECTURE_TEMPLATES to maintain
 * a single source of truth for all canvas templates and references.
 */
export const ARCHITECTURE_TEMPLATES: Record<string, ArchitectureTemplate> = SEED_BLUEPRINTS;
