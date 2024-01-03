import { useStorage } from "@plasmohq/storage/hook";

// eslint-disable-next-line import/no-unresolved
import githubIcon from "data-base64:~assets/github-icon.svg";
// eslint-disable-next-line import/no-unresolved
import logo from "data-base64:~assets/logo.svg";

import { useState, type ChangeEvent } from "react";

import { Button } from "@/components/Button/Button";
import { Checkbox } from "@/components/Checkbox/Checkbox";
import { Input } from "@/components/Input/Input";
import { Label } from "@/components/Label/Label";

import * as style from "./index.module.pcss";

const popup = () => {
  const [isChecked, setIsChecked] = useStorage<boolean>(
    "AutomaticallySelect",
    (v) => (v === undefined ? false : v),
  );

  const [initialUrls, setInitialUrls] = useState<string[]>([]);

  const [urls, setUrls] = useStorage<string[]>("urls", (v) =>
    // 空文字列は除外する
    v === undefined ? [] : v.filter((url) => url !== ""),
  );

  const initialUrlsLength = initialUrls.length;

  // key を固定するために、初期値を保持する
  if (urls.length !== 0 && initialUrlsLength === 0) {
    setInitialUrls(urls);
  }

  const onChangeCheck = async (e: ChangeEvent<HTMLInputElement>) => {
    await setIsChecked(e.target.checked);
  };

  const onChangeValue = async (e: ChangeEvent<HTMLInputElement>, i: number) => {
    const { value } = e.target;
    await setUrls((currentUrls) => {
      const newUrls = [...currentUrls];
      newUrls[i] = value;

      return newUrls;
    });
  };

  const disabledIncreaseButton = initialUrlsLength >= 8 || urls.at(-1) === "";

  const onClickIncreaseButton = async () => {
    // 8個以上は登録できないようにする
    if (initialUrlsLength > 8) {
      return;
    }
    await setUrls((currentUrls) => [...currentUrls, ""]);
  };

  return (
    <div className={style.root}>
      <header className={style.header}>
        <img src={logo} alt="Copy LGTM" className={style.logo} />
        <a
          href="https://github.com/hayato-osh/copy-lgtm"
          target="_ blank"
          rel="noopener noreferrer"
        >
          <img src={githubIcon} alt="GitHub" className={style.githubIcon} />
        </a>
      </header>
      <div>
        <Label>
          <Checkbox onChange={onChangeCheck} checked={isChecked} />
          Automatically Select Approve
        </Label>
      </div>
      <div className={style.inputControl}>
        <Label className={style.inputLabel}>
          LGTM Image URLs (format: https://*)
          {[...Array(urls.length).keys()].map((_value, i) => (
            <Input
              key={initialUrls[i]}
              type="url"
              value={urls[i]}
              onChange={(e) => onChangeValue(e, i)}
              autoFocus={i === urls.length - 1}
            />
          ))}
        </Label>
        <Button
          onClick={onClickIncreaseButton}
          disabled={disabledIncreaseButton}
        >
          Increase Input
        </Button>
        {initialUrlsLength >= 8 && (
          <span>※No more than 8 images can be registered</span>
        )}
      </div>
    </div>
  );
};

export default popup;
