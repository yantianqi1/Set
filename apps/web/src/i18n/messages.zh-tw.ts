import type { Messages } from "./messages.en";

export const messagesZhTW: Messages = {
  header: {
    productName: "Image Set Studio",
    slogan: "專業級套圖工作流",
    nav: {
      create: "建立任務",
      jobs: "歷史任務",
      settings: "設定"
    }
  },
  common: {
    languageLabel: "語言",
    localeSelectAria: "選擇介面語言",
    unknownError: "未知錯誤"
  },
  home: {
    title: "建立創意套圖",
    subtitle: "在這裡勾勒角色與場景，我們會把它變成完整作品。",
    labels: {
      theme: "主題名稱",
      characterProfile: "角色描寫",
      imageCount: "張數",
      stylePreset: "視覺風格",
      aspectRatio: "畫面比例",
      consistencyLevel: "一致性",
      outfitChangePolicy: "換裝程度",
      macroConfig: "敘事邏輯 / 構圖筆記"
    },
    placeholders: {
      theme: "替你的套圖取個好名字",
      characterProfile: "描述她的外貌、性格與穿搭細節...",
      macroConfig: "鏡頭如何分配？場景如何轉換？"
    },
    consistencyOptions: {
      low: "更隨性",
      medium: "普通",
      high: "高度一致"
    },
    outfitOptions: {
      fixed: "一路同套",
      minor_variation: "小幅變化",
      major_variation: "頻繁換裝"
    },
    toggles: {
      sceneProgression: "啟用自動場景流轉",
      nsfw: "NSFW 模式"
    },
    actions: {
      loading: "正在認真記錄...",
      submit: "畫下第一筆 (開始生成)",
      needsApiKey: "請先到設定頁填寫 Pollinations Key",
      viewDetail: "前往筆記查看詳情"
    },
    messages: {
      success: "任務已記錄到筆記中，正在等待處理...",
      error: (message: string) => `記錄失敗：${message}`
    }
  },
  jobs: {
    title: "歷史任務",
    subtitle: "查看並管理已建立的批量套圖任務。",
    loading: "正在同步雲端任務列表...",
    createdAt: (value: string) => `建立於 ${value}`,
    progress: (completed: number, total: number) => `任務進度：${completed} / ${total} 張`,
    actions: {
      viewDetail: "查看詳情",
      cloneConfig: "複製配置",
      previous: "上一頁",
      next: "下一頁"
    },
    empty: "還沒有建立任何任務，先去首頁新增一個吧！"
  },
  detail: {
    closeNotebook: "闔上筆記",
    status: (label: string) => `狀態：${label}`,
    recordedAt: (value: string) => `靈感記錄於 ${value}`,
    actions: {
      retryFailed: "重試失敗項"
    },
    tabs: {
      images: "成果預覽",
      planning: "創作大綱",
      prompts: "咒語草稿",
      events: "流程日誌"
    },
    imagePending: "正在努力作畫中...",
    imageAlt: (index: number) => `第 ${index} 張生成結果`,
    retryImageTitle: (index: number) => `重畫第 ${index} 張`,
    promptTitle: (index: number) => `第 ${index} 張的提示詞草稿`,
    promptPending: "提示詞仍在構思中...",
    loading: "正在翻開筆記...",
    messages: {
      loadFailed: "拉取筆記失敗了。",
      retryImageSuccess: (index: number) => `第 ${index} 張已加入重畫佇列。`,
      retryFailedSuccess: "失敗項已重新加入佇列。"
    }
  },
  settings: {
    title: "Pollinations 設定",
    subtitle: "目前固定使用 Pollinations 單一渠道。請填寫 Key，並選擇規劃、提示詞與生圖模型。",
    labels: {
      baseUrl: "固定 Base URL",
      apiKey: "Pollinations API Key",
      planningModel: "規劃模型",
      promptModel: "提示詞模型",
      imageModel: "生圖模型"
    },
    actions: {
      fetchModels: "拉取模型",
      fetchingModels: "拉取中...",
      save: "儲存設定",
      clear: "清除本地設定"
    },
    placeholders: {
      fetchModelsFirst: "請先拉取模型"
    },
    messages: {
      loadDefaultsError: "載入預設配置失敗。",
      missingApiKey: "請先輸入 Pollinations API Key，再拉取模型。",
      modelsUpdated: "模型列表已更新。",
      fetchModelsFailed: "模型拉取失敗。",
      saved: "Pollinations 設定已儲存到本機瀏覽器。",
      cleared: "本地 Pollinations 設定已清除。"
    }
  },
  status: {
    pending: "待排程",
    planning: "規劃中",
    planning_failed: "規劃失敗",
    prompt_generating: "提示詞生成中",
    prompt_partial_failed: "提示詞部分失敗",
    image_generating: "圖片生成中",
    completed: "已完成",
    partial_completed: "部分完成",
    failed: "生成失敗",
    cancelled: "已取消"
  }
};
