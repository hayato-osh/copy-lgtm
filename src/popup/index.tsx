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

  const [inputLength, setInputLength] = useState(1);

  const onChangeCheck = async (e: ChangeEvent<HTMLInputElement>) => {
    await setIsChecked(e.target.checked);
  };

  const onClickIncreaseButton = () => {
    // 8個以上は登録できないようにする
    if (inputLength > 8) {
      return;
    }
    setInputLength((currentLength) => currentLength + 1);
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
          Enter URL
          {[...Array(inputLength).keys()].map((value) => (
            <Input key={value} />
          ))}
        </Label>
        <Button onClick={onClickIncreaseButton} disabled={inputLength >= 8}>
          Increase Input
        </Button>
        {inputLength >= 8 && (
          <span>※No more than 8 images can be registered</span>
        )}
      </div>
    </div>
  );
};

export default popup;
