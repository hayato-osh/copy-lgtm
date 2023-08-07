#!/usr/bin/env -S node --loader ts-node/esm
import { readFile } from "fs/promises";

import axios from "axios";

import sharp from "sharp";

const lgtmText = await readFile("assets/lgtm.svg");

// 画像に LGTM のテキストを追加する処理を行う
export async function processImage(image: { url: string }) {
  const response = await axios.get(image.url, { responseType: "arraybuffer" });
  const imageBuffer = response.data;

  // sharpを使用して画像にテキストを追加
  const outputBuffer = await sharp(imageBuffer)
    .composite([{ input: Buffer.from(lgtmText), gravity: "center" }])
    .resize(2560, 1440)
    .jpeg()
    .toBuffer();

  return outputBuffer;
}
