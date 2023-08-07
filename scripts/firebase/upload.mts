#!/usr/bin/env -S node --loader ts-node/esm
import type { Storage } from "firebase-admin/lib/storage/storage";

/* Firebase Storageにアップロード
 *
 */
export async function uploadImage(
  bucket: ReturnType<Storage["bucket"]>,
  fileName: string,
  buffer: Buffer,
) {
  const file = bucket.file(fileName || "");

  try {
    await file.save(buffer, {
      metadata: {
        contentType: "image/jpeg",
      },
    });

    console.log(`Success: ${fileName} uploaded.`);
  } catch (error) {
    console.error(error);
  }

  await file.makePublic();
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  return publicUrl;
}

/*
 * Firebase Storageに画像URLが入ったjsonをアップロード
 */
export async function uploadJson(
  bucket: ReturnType<Storage["bucket"]>,
  imageUrls: string[],
) {
  const file = bucket.file("imageUrls.json");

  try {
    await file.save(JSON.stringify(imageUrls), {
      metadata: {
        contentType: "application/json",
      },
    });

    console.log(`Success: imageUrls.json uploaded.`);
  } catch (error) {
    console.error(error);
  }

  await file.makePublic();
}
