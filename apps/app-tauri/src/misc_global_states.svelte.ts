import { platform } from "@tauri-apps/plugin-os";

export let root_folder_picker_dialog_state: { open: boolean } = $state({
  open: true,
});

const PLATFORM_TYPE_MAP = {
  linux: "desktop",
  macos: "desktop",
  ios: "mobile",
  freebsd: "desktop",
  dragonfly: "desktop",
  netbsd: "desktop",
  openbsd: "desktop",
  solaris: "desktop",
  android: "mobile",
  windows: "desktop",
} as const;

export const current_platform = platform();
export const current_platform_type: "desktop" | "mobile" =
  PLATFORM_TYPE_MAP[current_platform as keyof typeof PLATFORM_TYPE_MAP];
