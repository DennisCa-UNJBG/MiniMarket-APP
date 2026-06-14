export interface AppPreferences {
  stockAlert: boolean;
  inactivityTimeout: number;
  enableAutoLogout: boolean;
  shortcuts: Record<string, string>;
  brightness: number;
  userMenuOrder?: Record<string, string[]>;
}

const PREFS_KEY = 'minimarket_prefs';

const defaultPrefs: AppPreferences = {
  stockAlert: true,
  inactivityTimeout: 25,
  enableAutoLogout: false,
  shortcuts: {},
  brightness: 100,
  userMenuOrder: {},
};

export const preferenciasService = {
  get(): AppPreferences {
    const saved = localStorage.getItem(PREFS_KEY);
    if (!saved) return defaultPrefs;
    try {
      return { ...defaultPrefs, ...JSON.parse(saved) };
    } catch {
      return defaultPrefs;
    }
  },

  save(prefs: AppPreferences) {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event('preferences-updated'));
  },

  toggle(key: keyof AppPreferences) {
    const current = this.get();
    const updated = { ...current, [key]: !current[key] };
    this.save(updated as AppPreferences);
    return updated as AppPreferences;
  }
};
