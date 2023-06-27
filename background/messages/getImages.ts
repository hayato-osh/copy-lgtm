import type { PlasmoMessaging } from "@plasmohq/messaging"

type Response = {
  images: string[]
}

const handler: PlasmoMessaging.MessageHandler<{}, Response> = async (_, res) => {
  if (process.env.PLASMO_PUBLIC_IMAGES_JSON === undefined) {
    throw new Error("PLASMO_PUBLIC_IMAGES_JSON is not defined")
  }

  const response = await fetch(process.env.PLASMO_PUBLIC_IMAGES_JSON, { cache: "force-cache" })
  const images: string[] = JSON.parse(await response.text())
  console.log(images)

  res.send({
    images
  })
}

export default handler