import cssText from "data-text:~/contents/github-pr.module.pcss"
import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo"

import * as style from "./github-pr.module.pcss"

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/**/**/pull/**/files"],
}

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector(".pr-review-tools")

const PlasmoInline = () => {
  return (
    <button
      type="button"
      onClick={() => alert("Hello from Plasmo!")}
      className={style.btn}
    >
      Copy LGTM
    </button>
  )
}

export default PlasmoInline
