// src/store/useCompareStore.ts
// Zustand store managing the Concept Vault side-by-side comparison state, floating tray, and modal.

import { create } from 'zustand';
import { COMPARISON_PRESETS } from '../utils/serviceComparisonEngine';

export interface CompareState {
  comparedServiceIds: string[];
  isCompareModalOpen: boolean;
  activePresetId: string | null;

  // Actions
  addCompareService: (serviceId: string) => void;
  removeCompareService: (serviceId: string) => void;
  toggleCompareService: (serviceId: string) => void;
  clearCompare: () => void;
  setComparedServices: (serviceIds: string[], presetId?: string | null) => void;
  swapService: (oldServiceId: string, newServiceId: string) => void;
  openCompareModal: (presetId?: string) => void;
  closeCompareModal: () => void;
  loadPreset: (presetId: string) => void;
}

export const useCompareStore = create<CompareState>((set, get) => ({
  comparedServiceIds: [],
  isCompareModalOpen: false,
  activePresetId: null,

  addCompareService: (serviceId: string) => {
    set((state) => {
      if (state.comparedServiceIds.includes(serviceId)) return state;
      if (state.comparedServiceIds.length >= 3) {
        // Replace the last service when at maximum 3 capacity
        return {
          comparedServiceIds: [state.comparedServiceIds[0], state.comparedServiceIds[1], serviceId],
          activePresetId: null,
        };
      }
      return {
        comparedServiceIds: [...state.comparedServiceIds, serviceId],
        activePresetId: null,
      };
    });
  },

  removeCompareService: (serviceId: string) => {
    set((state) => ({
      comparedServiceIds: state.comparedServiceIds.filter((id) => id !== serviceId),
      activePresetId: null,
    }));
  },

  toggleCompareService: (serviceId: string) => {
    const { comparedServiceIds, removeCompareService, addCompareService } = get();
    if (comparedServiceIds.includes(serviceId)) {
      removeCompareService(serviceId);
    } else {
      addCompareService(serviceId);
    }
  },

  clearCompare: () => {
    set({
      comparedServiceIds: [],
      activePresetId: null,
    });
  },

  setComparedServices: (serviceIds: string[], presetId: string | null = null) => {
    set({
      comparedServiceIds: serviceIds.slice(0, 3),
      activePresetId: presetId,
    });
  },

  swapService: (oldServiceId: string, newServiceId: string) => {
    set((state) => {
      const idx = state.comparedServiceIds.indexOf(oldServiceId);
      if (idx === -1) return state;
      const updated = [...state.comparedServiceIds];
      updated[idx] = newServiceId;
      return {
        comparedServiceIds: updated,
        activePresetId: null,
      };
    });
  },

  openCompareModal: (presetId?: string) => {
    if (presetId) {
      const preset = COMPARISON_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        set({
          comparedServiceIds: [...preset.serviceIds],
          activePresetId: presetId,
          isCompareModalOpen: true,
        });
        return;
      }
    }

    // If modal is opened without services queued, default to the classic ingress preset
    const current = get().comparedServiceIds;
    if (current.length < 2) {
      const defaultPreset = COMPARISON_PRESETS[0];
      set({
        comparedServiceIds: [...defaultPreset.serviceIds],
        activePresetId: defaultPreset.id,
        isCompareModalOpen: true,
      });
      return;
    }

    set({ isCompareModalOpen: true });
  },

  closeCompareModal: () => {
    set({ isCompareModalOpen: false });
  },

  loadPreset: (presetId: string) => {
    const preset = COMPARISON_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    set({
      comparedServiceIds: [...preset.serviceIds],
      activePresetId: presetId,
    });
  },
}));

