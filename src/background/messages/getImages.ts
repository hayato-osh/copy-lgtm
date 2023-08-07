import type { PlasmoMessaging } from "@plasmohq/messaging";

type Response = {
  images: string[];
};

const handler: PlasmoMessaging.MessageHandler<any, Response> = async (
  _,
  res,
) => {
  if (process.env.PLASMO_PUBLIC_IMAGES_JSON === undefined) {
    throw new Error("PLASMO_PUBLIC_IMAGES_JSON is not defined");
  }

  const endpoint = process.env.PLASMO_PUBLIC_IMAGES_JSON;

  const response = await fetch(`${endpoint}/imageUrls.json`, {
    cache: "default",
  });

  let images: string[] = [];

  if (response.ok) {
    images = JSON.parse(await response.text());
  } else {
    Array.from({ length: 3 }).forEach(async (_, i) => {
      images.push(`${endpoint}/sample/lgtm${i}`);
    });
  }

  res.send({
    images,
  });
};

export default handler;
