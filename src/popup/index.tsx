import { useStorage } from "@plasmohq/storage/hook";

// eslint-disable-next-line import/no-unresolved
import githubIcon from "data-base64:~assets/github-icon.svg";
// eslint-disable-next-line import/no-unresolved
import logo from "data-base64:~assets/logo.svg";

import { Checkbox } from "@/components/Checkbox/Checkbox";
import { Label } from "@/components/Label/Label";

import * as style from "./index.module.pcss";

import type { ChangeEvent } from "react";

const popup = () => {
  const [isChecked, setIsChecked] = useStorage<boolean>(
    "AutomaticallySelect",
    (v) => (v === undefined ? false : v),
  );

  const onChangeCheck = async (e: ChangeEvent<HTMLInputElement>) => {
    await setIsChecked(e.target.checked);
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
      <Label>
        <Checkbox onChange={onChangeCheck} checked={isChecked} />
        Automatically Select Approve
      </Label>
    </div>
  );
};

export default popup;
