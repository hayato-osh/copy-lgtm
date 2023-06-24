#!/usr/bin/env -S node --loader ts-node/esm

import axios from 'axios';
import sharp from 'sharp';
import admin from 'firebase-admin';
import fs from 'fs/promises';
import 'dotenv/config'
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const serviceAccount = require("../credential.json");

const lgtmText = await fs.readFile('assets/lgtm.svg');

// Firebase初期化
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "gs://lgtm-ea733.appspot.com/" // あなたのFirebase StorageのURL
});

const bucket = admin.storage().bucket();

// Firebase Storageにアップロード
async function uploadImage(fileName: string, buffer: Buffer) {
  const file = bucket.file(fileName || "");

  try {
    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
      },
    });

    console.log(`Success: ${fileName} uploaded.`)
  } catch (error) {
    console.error(error)
  }
}

async function processImage(image: { url: string; id: string }) {
  const response = await axios.get(image.url, { responseType: 'arraybuffer' });
  const imageBuffer = response.data;

  // sharpを使用して画像にテキストを追加
  const outputBuffer = await sharp(imageBuffer)
  .composite([{ input: Buffer.from(lgtmText), gravity: 'center' }])
    .resize(2560, 1440)
    .jpeg()
    .toBuffer();

  await uploadImage(image.id, outputBuffer);
}

async function main() {
  const pixabayResponse = await axios.get(
    `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&image_type=photo`
  );
  const images = pixabayResponse.data.hits.map((hit) => ({url: hit.largeImageURL, id: hit.id}));

  for (const image of images) {
    await processImage(image);
  }
}

main().catch(console.error);