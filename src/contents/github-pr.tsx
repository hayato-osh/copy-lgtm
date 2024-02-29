import { sendToBackground } from "@plasmohq/messaging";
import { Storage } from "@plasmohq/storage";

/**
 * コンポーネントのスタイルを読み込む
 */
// eslint-disable-next-line import/no-unresolved
import githubStyle from "data-text:./github-pr.module.pcss";
// eslint-disable-next-line import/no-unresolved
import popoverStyle from "data-text:@/components/Popover/Popover.module.pcss";

import { useCallback, useState } from "react";

import { Popover } from "@/components/Popover/Popover";

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
  const storage = new Storage();

  const textarea = document.getElementById(
    "pull_request_review_body",
  ) as HTMLTextAreaElement;

  const onClickCopyLGTM = useCallback(async (open: boolean) => {
    if (!open) {
      return;
    }

    try {
      const lgtmImages = (await storage.get<string[]>("urls")) ?? [];
      // https:// で始まるURLのみを抽出
      const filteredImages = lgtmImages.filter((url) =>
        url.startsWith("https://"),
      );

      let images = filteredImages;

      if (images.length === 0) {
        const res = await sendToBackground<any, { images: string[] }>({
          name: "getImages",
        });

        images = res.images;
      }
      // imagesの中から、ランダムに1つ選択
      const image = images[Math.floor(Math.random() * images.length)];

      // すでに貼付け済みの場合はスキップ
      if (!textarea.value.includes("![LGTM](")) {
        // テキストエリアに貼り付ける
        if (textarea.value === "") {
          textarea.value = `![LGTM](${image})`;
        } else {
          textarea.value = `${textarea.value}\n![LGTM](${image})`;
        }
      }

      const isAutomaticallySelect =
        (await storage.get<boolean>("AutomaticallySelect")) ?? false;

      // 自動的にApproveを選択する
      if (isAutomaticallySelect) {
        const approveRadioButton = document.getElementById(
          "pull_request_review[event]_approve",
        ) as HTMLInputElement;

        approveRadioButton.checked = true;
      }

      setIsCopied(true);

      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (e) {
      console.error(e);
    }
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
      Success!
    </Popover>
  );
};

export default PlasmoInline;
