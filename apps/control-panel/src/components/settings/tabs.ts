/** Shared so the route, the strip and the breadcrumb cannot disagree. */
export const SETTINGS_TABS = [
  { value: 'members', label: 'Members' },
  { value: 'keys', label: 'API Keys' },
  { value: 'organisation', label: 'Organisation' },
] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number]['value'];

export function isSettingsTab(value: string): value is SettingsTab {
  return SETTINGS_TABS.some((tab) => tab.value === value);
}

export function settingsTabLabel(tab: SettingsTab): string {
  return SETTINGS_TABS.find((entry) => entry.value === tab)!.label;
}
