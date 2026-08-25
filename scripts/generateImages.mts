/**
 * LGTM 画像を生成して images/ に書き出すスクリプト
 *
 * 1. Pixabay API から写真を取得
 * 2. Sharp で「LGTM」を合成して JPEG にする
 * 3. images/<pixabayId>.jpg と images/imageUrls.json を書き出す
 *
 * 生成した画像は main ブランチにコミットすると
 * ${PLASMO_PUBLIC_IMAGES_JSON}/<pixabayId>.jpg（raw.githubusercontent.com）で配信される。
 *
 * 実行: pnpm generate:images（PIXABAY_API_KEY と PLASMO_PUBLIC_IMAGES_JSON が .env に必要）
 */
import { mkdir, writeFile } from "node:fs/promises";
import { URLSearchParams } from "node:url";
import axios from "axios";

import "dotenv/config";
import { processImage } from "./sharp/processImage.mts";

const outputDir = "images";
const resourceLength = 20;

const category = [
  "animals",
  "places",
  "computer",
  "buildings",
  "food",
  "transportation",
  "travel",
];

type PixabayHit = { id: number; largeImageURL: string };

const requireEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not defined. Set it in .env (see sample.env).`);
  }
  return value;
};

const pixabayApiKey = requireEnv("PIXABAY_API_KEY");
const publicBaseUrl = requireEnv("PLASMO_PUBLIC_IMAGES_JSON").replace(
  /\/$/,
  "",
);

const apiEndpoint = new URLSearchParams({
  key: pixabayApiKey,
  image_type: "photo",
  per_page: resourceLength.toString(),
  safesearch: "true",
  orientation: "horizontal",
});
for (const c of category) {
  apiEndpoint.append("category", c);
}

const pixabayResponse = await axios.get<{ hits: PixabayHit[] }>(
  `https://pixabay.com/api?${apiEndpoint.toString()}`,
);

await mkdir(outputDir, { recursive: true });

const imageUrls: string[] = [];

for (const hit of pixabayResponse.data.hits) {
  const fileName = `${hit.id}.jpg`;
  const buffer = await processImage(hit.largeImageURL);
  await writeFile(`${outputDir}/${fileName}`, buffer);
  console.log(`Success: ${outputDir}/${fileName} written.`);
  imageUrls.push(`${publicBaseUrl}/${fileName}`);
}

await writeFile(
  `${outputDir}/imageUrls.json`,
  `${JSON.stringify(imageUrls, null, 2)}\n`,
  "utf8",
);
console.log(
  `Success: ${outputDir}/imageUrls.json written (${imageUrls.length} images).`,
);
