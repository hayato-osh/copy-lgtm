import cssText from "data-text:~/contents/github-pr.module.pcss"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

import * as style from "./github-pr.module.pcss"
import { sendToBackground } from "@plasmohq/messaging"
import { copyToClipboard } from "~utils/copyToClipboard"
import { useState } from "react"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector(".pr-toolbar > .diffbar > .pr-review-tools")

const PlasmoInline = () => {
  const [isCopied, setIsCopied] = useState(false);

  const onClickCopyLGTM = async () => {
    const res = await sendToBackground<{}, { images: string[] }>({
      name: "getImages"
    })
    // imagesの中から、ランダムに1つ選択
    const image = res.images[Math.floor(Math.random() * res.images.length)]
    const clipboardText = `![LGTM](${image})`
    await copyToClipboard(clipboardText)
      .then(() => {
        setIsCopied(true)
      })
      .finally(() => {
        setTimeout(() => {
          setIsCopied(false)
        }, 3000)
      })
  }

  return (
    <button
      type="button"
      onClick={onClickCopyLGTM}
      className={style.btn}
      disabled={isCopied}
    >
      {isCopied ? 'Copied!' : 'Copy LGTM'}
    </button>
  )
}

export default PlasmoInline
