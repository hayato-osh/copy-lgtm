import type { PlasmoMessaging } from "@plasmohq/messaging";
import bundledImageUrls from "../../../images/imageUrls.json";

type Response = {
  images: string[];
};

/**
 * LGTM画像のURL一覧を取得する
 * 1. GitHub（raw.githubusercontent.com）上の imageUrls.json を取得
 * 2. 取得できない場合は、ビルド時に同梱した imageUrls.json にフォールバック
 */
const handler: PlasmoMessaging.MessageHandler<any, Response> = async (
  _,
  res,
) => {
  const endpoint = process.env.PLASMO_PUBLIC_IMAGES_JSON;

  let images: string[] = [];

  if (endpoint) {
    try {
      const response = await fetch(`${endpoint}/imageUrls.json`, {
        cache: "default",
      });
      if (response.ok) {
        const json: unknown = await response.json();
        if (Array.isArray(json)) {
          images = json.filter((url): url is string => typeof url === "string");
        }
      }
    } catch (error) {
      console.error("Failed to fetch imageUrls.json:", error);
    }
  } else {
    console.warn("PLASMO_PUBLIC_IMAGES_JSON is not defined");
  }

  if (images.length === 0) {
    // フォールバック: 同梱している画像URLを使用
    images = bundledImageUrls;
  }

  res.send({
    images,
  });
};

export default handler;
