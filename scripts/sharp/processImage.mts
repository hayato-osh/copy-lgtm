import { readFile } from "node:fs/promises";
import axios from "axios";
import sharp from "sharp";

const lgtmText = await readFile("assets/lgtm.svg");

/**
 * 画像に「LGTM」のテキストを合成し、JPEG にして返す
 * リポジトリにコミットするため、PR に貼る幅（600px）に十分なサイズに抑える
 */
export async function processImage(imageUrl: string): Promise<Buffer> {
  const response = await axios.get<ArrayBuffer>(imageUrl, {
    responseType: "arraybuffer",
  });

  return sharp(Buffer.from(response.data))
    .composite([{ input: Buffer.from(lgtmText), gravity: "center" }])
    .resize(1280, 720)
    .jpeg({ quality: 82 })
    .toBuffer();
}
