import { Directory, File, Paths } from "expo-file-system";
import { ImageAsset } from "../types";

const IMAGE_DIRECTORY_NAME = "wardrobe-images";
const imageDirectory = new Directory(Paths.document, IMAGE_DIRECTORY_NAME);

const createId = () =>
  `asset-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

export function imageSourceKey(uri: string) {
  try {
    return decodeURIComponent(uri.split("?")[0]).toLowerCase();
  } catch {
    return uri.split("?")[0].toLowerCase();
  }
}

function ensureImageDirectory() {
  imageDirectory.create({ idempotent: true, intermediates: true });
}

function safeExtension(file: File) {
  const extension = file.extension.toLowerCase();
  if (
    [
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".gif",
      ".bmp",
      ".heic",
      ".heif",
    ].includes(extension)
  ) {
    return extension;
  }

  const extensionByMime: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/bmp": ".bmp",
    "image/heic": ".heic",
    "image/heif": ".heif",
  };
  return extensionByMime[file.type.toLowerCase()] ?? ".jpg";
}

export async function importImageAsset(uri: string): Promise<ImageAsset> {
  ensureImageDirectory();
  const source = new File(uri);
  if (!source.exists) throw new Error(`图片文件不存在: ${uri}`);

  const id = createId();
  const localFileName = `${id}${safeExtension(source)}`;
  const destination = new File(imageDirectory, localFileName);
  await source.copy(destination);

  return {
    id,
    localFileName,
    mimeType: source.type || "image/jpeg",
    byteSize: source.size,
    checksum: source.md5,
    sourceKey: imageSourceKey(uri),
    createdAt: new Date().toISOString(),
  };
}

export function resolveImageAssetUri(asset: ImageAsset) {
  return new File(imageDirectory, asset.localFileName).uri;
}

export function deleteImageAssetFile(asset: ImageAsset) {
  const file = new File(imageDirectory, asset.localFileName);
  if (file.exists) file.delete();
}

export function deleteImageAssetFiles(assets: ImageAsset[]) {
  assets.forEach((asset) => {
    try {
      deleteImageAssetFile(asset);
    } catch {
      // 元数据已经保存时，文件清理失败不应影响用户数据。
    }
  });
}

export function cleanupUntrackedImageFiles(assets: ImageAsset[]) {
  try {
    ensureImageDirectory();
    const trackedNames = new Set(assets.map((asset) => asset.localFileName));
    imageDirectory.list().forEach((entry) => {
      if (entry instanceof File && !trackedNames.has(entry.name)) {
        entry.delete();
      }
    });
  } catch {
    // 清理仅用于回收异常中断留下的文件，不阻塞衣柜加载。
  }
}
