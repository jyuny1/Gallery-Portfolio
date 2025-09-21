#!/usr/bin/env node

/**
 * 图片目录索引生成器 (Cloudflare R2版本)
 * 使用 S3 API 获取文件列表
 */

import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { S3Client, ListObjectsV2Command } from "@aws-sdk/client-s3";

dotenv.config();

console.log("========================================");
console.log("图片目录索引生成器 (Cloudflare R2版)");
console.log("========================================");

// 配置
const OUTPUT_FILE = "gallery-index.json";
const BUCKET = process.env.R2_BUCKET_NAME;
const ENDPOINT = process.env.R2_ENDPOINT;
const REGION = process.env.R2_REGION || "auto";
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY;
const IMAGE_DIR = process.env.R2_IMAGE_DIR || ""; // R2 根目录下的父目录，比如 "gallery/"

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];

// 初始化 S3 客户端
const s3 = new S3Client({
  region: REGION,
  endpoint: ENDPOINT,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

// 构建图片URL（从 .env 读取自定义域名/路径）
function buildImageUrls(categoryName, fileName, fileExt, isDirectFile = false) {
  const baseUrl = (process.env.R2_IMAGE_BASE_URL || "").replace(/\/+$/, ""); // 去除末尾斜杠
  const dir = (process.env.R2_IMAGE_DIR || "").replace(/^\/+|\/+$/g, ""); // 去除首尾斜杠

  const pathBase = dir ? `${baseUrl}/${dir}` : baseUrl;

  let originalUrl, previewUrl;
  if (isDirectFile) {
    // 直接在根目录下的文件
    originalUrl = `${pathBase}/${fileName}.${fileExt}`;
    previewUrl = `${pathBase}/0_preview/${fileName}.webp`;
  } else {
    // 有子目录的文件
    originalUrl = `${pathBase}/${categoryName}/${fileName}.${fileExt}`;
    previewUrl = `${pathBase}/0_preview/${categoryName}/${fileName}.webp`;
  }

  return { originalUrl, previewUrl };
}

// 从 R2 获取所有对象
async function listAllObjects(prefix) {
  let continuationToken = undefined;
  let allObjects = [];

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET,
      Prefix: prefix,
      ContinuationToken: continuationToken,
    });

    const response = await s3.send(command);

    if (response.Contents) {
      allObjects = allObjects.concat(response.Contents);
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return allObjects;
}

// 主函数
async function generateGalleryIndex() {
  console.log(`正在扫描 R2 存储桶: ${BUCKET}`);
  console.log(`输出文件: ${OUTPUT_FILE}`);
  console.log();

  const gallery = {};
  let totalImages = 0;

  // 获取所有对象
  const objects = await listAllObjects(IMAGE_DIR);

  // 按 "目录" 分类
  const categories = {};

  for (const obj of objects) {
    const key = obj.Key;
    if (!key) continue;

    const ext = path.extname(key).toLowerCase();
    if (!IMAGE_EXTENSIONS.includes(ext)) continue;

    // 获取 category 和 文件名
    let relativePath = key;
    if (IMAGE_DIR) {
      const prefix = IMAGE_DIR.endsWith('/') ? IMAGE_DIR : IMAGE_DIR + '/';
      if (key.startsWith(prefix)) {
        relativePath = key.substring(prefix.length);
      }
    }
    const parts = relativePath.split("/");

    let categoryName, fileName;
    if (parts.length < 2) {
      // 如果只有一个部分，使用默认分类
      categoryName = "default";
      fileName = parts[0];
    } else {
      categoryName = parts[0];
      fileName = parts[parts.length - 1];
    }
    if (categoryName === "0_preview") continue; // 跳过预览目录

    const originalExt = path.extname(fileName);
    const baseName = path.basename(fileName, originalExt);
    const isDirectFile = parts.length < 2; // 判断是否为直接文件

    const { originalUrl, previewUrl } = buildImageUrls(
      categoryName,
      baseName,
      originalExt.substring(1),
      isDirectFile
    );

    const imageInfo = {
      name: baseName,
      original: originalUrl,
      preview: previewUrl,
      category: categoryName,
    };

    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }
    categories[categoryName].push(imageInfo);
    totalImages++;
  }

  // 整理分类数据
  for (const [categoryName, images] of Object.entries(categories)) {
    images.sort((a, b) => a.name.localeCompare(b.name));

    gallery[categoryName] = {
      name: categoryName,
      images: images,
      count: images.length,
    };

    console.log(`完成分类 ${categoryName}，共 ${images.length} 张图片`);
  }

  // 生成最终 JSON
  const output = {
    gallery: gallery,
    total_images: totalImages,
    generated_at: new Date().toISOString(),
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), "utf8");

  console.log();
  console.log("========================================");
  console.log("索引生成完成！");
  console.log(`总图片数: ${totalImages}`);
  console.log(`输出文件: ${OUTPUT_FILE}`);
  console.log("========================================");
}

// 运行主函数
generateGalleryIndex().catch((err) => {
  console.error("生成索引时发生错误:", err.message);
  process.exit(1);
});
