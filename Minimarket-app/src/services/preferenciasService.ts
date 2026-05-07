export interface AppPreferences {
  stockAlert: boolean;
  inactivityTimeout: number;
  enableAutoLogout: boolean;
}

const PREFS_KEY = 'minimarket_prefs';

const defaultPrefs: AppPreferences = {
  stockAlert: true,
  inactivityTimeout: 25,
  enableAutoLogout: false,
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
  },

  toggle(key: keyof AppPreferences) {
    const current = this.get();
    const updated = { ...current, [key]: !current[key] };
    this.save(updated);
    return updated;
  }
};
