import type { LocaleCode } from "./locale";
import { messagesEn, type Messages } from "./messages.en";
import { messagesJa } from "./messages.ja";
import { messagesZhCN } from "./messages.zh-cn";
import { messagesZhTW } from "./messages.zh-tw";

export const messages = {
  en: messagesEn,
  "zh-CN": messagesZhCN,
  "zh-TW": messagesZhTW,
  ja: messagesJa
} satisfies Record<LocaleCode, Messages>;

export type { Messages };
