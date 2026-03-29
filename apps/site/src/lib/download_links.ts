// @unocss-include
import { call_gh_api, file, repo } from "@/lib/gh_api.ts";

type Platform = {
  label: string;
  icon: string;
  binaries: {
    ext: "exe" | "msi" | "dmg" | "deb" | "rpm" | "appimage" | "apk";
    arch: "x64" | "arm64" | "armv7";
    size: number | undefined;
    link: string;
  }[];
};
export const gh_relases_latest_metadata = (await call_gh_api(
  "/releases/latest",
)) as {
  tag_name: string | undefined;
  assets: { name: string; size: number }[] | undefined;
};

function file_size(suffix: string): number | undefined {
  return (
    gh_relases_latest_metadata.assets &&
    gh_relases_latest_metadata.assets.find(
      (asset) => asset.name === `${repo}-${suffix}`,
    )?.size
  );
}

export let platforms: Platform[] = [
  {
    label: "windows",
    icon: "i-tabler:brand-windows-filled",
    binaries: [
      {
        ext: "exe",
        arch: "x64",
        size: file_size("windows-x64.exe"),
        link: file("windows-x64.exe"),
      },
      {
        ext: "exe",
        arch: "arm64",
        size: file_size("windows-arm64.exe"),
        link: file("windows-arm64.exe"),
      },
      {
        ext: "msi",
        arch: "x64",
        size: file_size("windows-x64.msi"),
        link: file("windows-x64.msi"),
      },
      {
        ext: "msi",
        arch: "arm64",
        size: file_size("windows-arm64.exe"),
        link: file("windows-arm64.msi"),
      },
    ],
  },
  {
    label: "macos",
    icon: "i-tabler:brand-apple-filled",
    binaries: [
      {
        ext: "dmg",
        arch: "x64",
        size: file_size("darwin-x64.dmg"),
        link: file("darwin-x64.dmg"),
      },
      {
        ext: "dmg",
        arch: "arm64",
        size: file_size("darwin-aarch64.dmg"),
        link: file("darwin-aarch64.dmg"),
      },
    ],
  },
  {
    label: "linux",
    icon: "i-mdi:linux",
    binaries: [
      {
        ext: "deb",
        arch: "x64",
        size: file_size("linux-amd64.deb"),
        link: file("linux-amd64.deb"),
      },
      {
        ext: "deb",
        arch: "arm64",
        size: file_size("linux-arm64.deb"),
        link: file("linux-arm64.deb"),
      },
      {
        ext: "rpm",
        arch: "x64",
        size: file_size("linux-x86_64.rpm"),
        link: file("linux-x86_64.rpm"),
      },
      {
        ext: "rpm",
        arch: "arm64",
        size: file_size("linux-aarch64.rpm"),
        link: file("linux-aarch64.rpm"),
      },
      {
        ext: "appimage",
        arch: "x64",
        size: file_size("linux-amd64.AppImage"),
        link: file("linux-amd64.AppImage"),
      },
      {
        ext: "appimage",
        arch: "arm64",
        size: file_size("linux-aarch64.AppImage"),
        link: file("linux-aarch64.AppImage"),
      },
    ],
  },
  {
    label: "android",
    icon: "i-mdi:android",
    binaries: [
      {
        ext: "apk",
        arch: "arm64",
        size: file_size("android-arm64.apk"),
        link: file("android-arm64.apk"),
      },
      {
        ext: "apk",
        arch: "armv7",
        size: file_size("android-arm.apk"),
        link: file("android-arm.apk"),
      },
    ],
  },
  { label: "IOS", icon: "i-mdi:apple-ios", binaries: [] },
];
