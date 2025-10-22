#!/usr/bin/env -S node --loader ts-node/esm

import { writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { URLSearchParams } from "node:url";
import axios from "axios";
import admin from "firebase-admin";

import "dotenv/config";
import { uploadImage, uploadJson } from "./firebase/upload.mjs";
import { processImage } from "./sharp/processImage.mjs";

const require = createRequire(import.meta.url);
const serviceAccount = require("../credential.json");

// Firebase初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://lgtm-ea733.appspot.com/",
});

const bucket = admin.storage().bucket();

// ================================ main ===============================
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

const apiEndpoint = new URLSearchParams({
  key: process.env.PIXABAY_API_KEY || "",
  image_type: "photo",
  per_page: resourceLength.toString(),
  safesearch: "true",
  orientation: "horizontal",
});
for (const c of category) {
  apiEndpoint.append("category", c);
}

const pixabayResponse = await axios.get(
  `https://pixabay.com/api?${apiEndpoint.toString()}`,
);

if (pixabayResponse.status >= 400) {
  throw new Error("Failed to fetch images from Pixabay");
}

const images = pixabayResponse.data.hits.map((hit) => ({
  url: hit.largeImageURL,
  id: hit.id,
}));
const processedImageUrls: string[] = [];

for (const image of images) {
  const buffer = await processImage(image);
  const url = await uploadImage(bucket, `lgtm/${image.id}`, buffer);
  processedImageUrls.push(url);
}

await writeFile(
  "uploaded/imagesUrls.json",
  JSON.stringify(processedImageUrls),
  "utf8",
);

await uploadJson(bucket, processedImageUrls);
