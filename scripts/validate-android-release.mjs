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
check(expo.name === "X²衣橱", "应用名称已统一为 X²衣橱");
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
  !(android.permissions ?? []).includes(
    "android.permission.SYSTEM_ALERT_WINDOW",
  ) &&
    (android.blockedPermissions ?? []).includes(
      "android.permission.SYSTEM_ALERT_WINDOW",
    ),
  "Android Manifest 已阻止悬浮窗权限",
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

const legalContentPath = resolve(projectRoot, "src/legal/content.ts");
const privacyDocumentPath = resolve(projectRoot, "docs/PRIVACY_POLICY.md");
const agreementDocumentPath = resolve(projectRoot, "docs/USER_AGREEMENT.md");
const appSource = readFileSync(resolve(projectRoot, "App.tsx"), "utf8");
const legalContent = existsSync(legalContentPath)
  ? readFileSync(legalContentPath, "utf8")
  : "";
check(
  existsSync(legalContentPath) &&
    legalContent.includes("suptiger@yeah.net") &&
    legalContent.includes("X²衣橱隐私政策"),
  "应用内隐私政策与联系邮箱已配置",
);
check(
  appSource.includes("PRIVACY_CONSENT_KEY") &&
    appSource.includes("PrivacyConsentModal") &&
    appSource.includes("withdrawPrivacyConsent"),
  "首次启动隐私同意门与撤回机制已接入",
);
check(
  existsSync(privacyDocumentPath) && existsSync(agreementDocumentPath),
  "对外发布用隐私政策与用户协议文档已生成",
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
