import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const failures = [];
const passes = [];

function check(condition, message) {
  (condition ? passes : failures).push(message);
}

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(projectRoot, relativePath), "utf8"));
}

const appJson = readJson("app.json");
const packageJson = readJson("package.json");
const easJson = readJson("eas.json");
const expo = appJson.expo ?? {};
const android = expo.android ?? {};
const imagePickerPlugin = (expo.plugins ?? []).find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker",
);
const imagePickerOptions = Array.isArray(imagePickerPlugin)
  ? imagePickerPlugin[1] ?? {}
  : {};

check(Boolean(expo.name && expo.slug && expo.version), "应用基础信息完整");
check(
  /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/.test(android.package ?? ""),
  "Android 包名格式正确",
);
check(
  Number.isInteger(android.versionCode) && android.versionCode > 0,
  "Android versionCode 已配置",
);
check(
  imagePickerOptions.microphonePermission === false,
  "图片选择器已禁用麦克风权限",
);
check(
  !(android.permissions ?? []).includes("android.permission.RECORD_AUDIO") &&
    (android.blockedPermissions ?? []).includes(
      "android.permission.RECORD_AUDIO",
    ),
  "Android Manifest 已阻止录音权限",
);
check(
  easJson.build?.preview?.android?.buildType === "apk",
  "preview 构建产物为 APK",
);
check(
  easJson.build?.production?.android?.buildType === "app-bundle",
  "production 构建产物为 AAB",
);
check(
  Boolean(packageJson.dependencies?.["expo-file-system"]),
  "本地图片持久化依赖已声明",
);

const iconPath = resolve(projectRoot, expo.icon ?? "");
check(Boolean(expo.icon) && existsSync(iconPath), "应用图标文件存在");
if (existsSync(iconPath)) {
  const png = readFileSync(iconPath);
  const isPng = png.subarray(1, 4).toString("ascii") === "PNG";
  const width = isPng && png.length >= 24 ? png.readUInt32BE(16) : 0;
  const height = isPng && png.length >= 24 ? png.readUInt32BE(20) : 0;
  check(isPng && width === height && width >= 512, "应用图标为至少 512px 的正方形 PNG");
}

passes.forEach((message) => console.log(`PASS  ${message}`));
if (failures.length) {
  failures.forEach((message) => console.error(`FAIL  ${message}`));
  process.exitCode = 1;
} else {
  console.log(`\nAndroid 发布配置检查通过（${passes.length} 项）。`);
}
