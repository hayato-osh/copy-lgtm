import { sendToBackground } from "@plasmohq/messaging";

/**
 * コンポーネントのスタイルを読み込む
 */
// eslint-disable-next-line import/no-unresolved
import githubStyle from "data-text:./github-pr.module.pcss";
// eslint-disable-next-line import/no-unresolved
import popoverStyle from "data-text:@/components/Popover/Popover.module.pcss";

import { useCallback, useState } from "react";

import { Popover } from "@/components/Popover/Popover";
import { copyToClipboard } from "@/utils/copyToClipboard";

import * as style from "./github-pr.module.pcss";

import type { PlasmoCSConfig, PlasmoGetInlineAnchor } from "plasmo";

const styleText = `${githubStyle} ${popoverStyle}`;

export const config: PlasmoCSConfig = {
  matches: ["https://github.com/*"],
};

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = styleText;
  return style;
};

export const getInlineAnchor: PlasmoGetInlineAnchor = () =>
  document.querySelector(".pr-toolbar > .diffbar > .pr-review-tools");

const PlasmoInline = () => {
  const [isCopied, setIsCopied] = useState(false);

  const onClickCopyLGTM = useCallback(async (open: boolean) => {
    if (!open) {
      return;
    }

    const res = await sendToBackground<any, { images: string[] }>({
      name: "getImages",
    });
    // imagesの中から、ランダムに1つ選択
    const image = res.images[Math.floor(Math.random() * res.images.length)];
    const clipboardText = `![LGTM](${image})`;
    await copyToClipboard(clipboardText)
      .then(() => {
        setIsCopied(true);
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setTimeout(() => {
          setIsCopied(false);
        }, 3000);
      });
  }, []);

  return (
    <Popover
      open={isCopied}
      onOpenChange={onClickCopyLGTM}
      trigger={
        <button type="button" className={style.btn} disabled={isCopied}>
          Copy LGTM
        </button>
      }
    >
      Copied!
    </Popover>
  );
};

export default PlasmoInline;
