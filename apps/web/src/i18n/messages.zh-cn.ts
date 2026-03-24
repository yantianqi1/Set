import type { Messages } from "./messages.en";

export const messagesZhCN: Messages = {
  header: {
    productName: "Image Set Studio",
    slogan: "专业级套图工作流",
    nav: {
      create: "创建任务",
      jobs: "历史任务",
      settings: "设置"
    }
  },
  common: {
    languageLabel: "语言",
    localeSelectAria: "选择界面语言",
    unknownError: "未知错误"
  },
  home: {
    title: "新建创意套图",
    subtitle: "在此勾勒你的角色与场景，我们将把它变成现实。",
    labels: {
      theme: "主题名称",
      characterProfile: "角色画像",
      imageCount: "张数",
      stylePreset: "视觉风格",
      aspectRatio: "画面比例",
      consistencyLevel: "一致性",
      outfitChangePolicy: "换装程度",
      macroConfig: "叙事逻辑 / 构图笔记"
    },
    placeholders: {
      theme: "给你的套图起个好听的名字",
      characterProfile: "描述她的样貌、性格、穿搭细节...",
      macroConfig: "如何分配镜头？场景如何流转？"
    },
    consistencyOptions: {
      low: "随性一些",
      medium: "普通",
      high: "高度一致"
    },
    outfitOptions: {
      fixed: "一套到底",
      minor_variation: "小幅改动",
      major_variation: "频繁换装"
    },
    toggles: {
      sceneProgression: "开启自动场景流转",
      nsfw: "NSFW 模式"
    },
    actions: {
      loading: "正在认真记录...",
      submit: "画下第一笔 (开始生成)",
      needsApiKey: "请先去设置页填写 Pollinations Key",
      viewDetail: "去笔记本查看详情"
    },
    messages: {
      success: "任务已记录到笔记本中，正在等待处理...",
      error: (message: string) => `记录出错了：${message}`
    }
  },
  jobs: {
    title: "历史任务",
    subtitle: "查看并管理已创建的批量套图任务。",
    loading: "正在同步云端任务列表...",
    createdAt: (value: string) => `创建于 ${value}`,
    progress: (completed: number, total: number) => `任务进度：${completed} / ${total} 张`,
    actions: {
      viewDetail: "查看详情",
      cloneConfig: "克隆配置",
      previous: "上一页",
      next: "下一页"
    },
    empty: "还没有创建过任何任务，去主页创建一个吧！"
  },
  detail: {
    closeNotebook: "合上笔记",
    status: (label: string) => `状态：${label}`,
    recordedAt: (value: string) => `灵感记录于 ${value}`,
    actions: {
      retryFailed: "重试失败项"
    },
    tabs: {
      images: "成果预览",
      planning: "创作大纲",
      prompts: "咒语草稿",
      events: "过程日志"
    },
    imagePending: "正在努力画画中...",
    imageAlt: (index: number) => `第 ${index} 张生成结果`,
    retryImageTitle: (index: number) => `重画第 ${index} 张`,
    promptTitle: (index: number) => `第 ${index} 张的草图咒语`,
    promptPending: "仍在构思提示词...",
    loading: "正在翻开笔记...",
    messages: {
      loadFailed: "拉取笔记失败了。",
      retryImageSuccess: (index: number) => `第 ${index} 张已加入重画队列。`,
      retryFailedSuccess: "失败项已重新加入队列。"
    }
  },
  settings: {
    title: "Pollinations 配置",
    subtitle: "当前固定使用 Pollinations 单渠道。请填写 Key，并选择规划、提示词、生图模型。",
    labels: {
      baseUrl: "固定 Base URL",
      apiKey: "Pollinations API Key",
      planningModel: "规划模型",
      promptModel: "提示词模型",
      imageModel: "生图模型"
    },
    actions: {
      fetchModels: "拉取模型",
      fetchingModels: "拉取中...",
      save: "保存设置",
      clear: "清空本地设置"
    },
    placeholders: {
      fetchModelsFirst: "请先拉取模型"
    },
    messages: {
      loadDefaultsError: "默认配置加载失败。",
      missingApiKey: "请先输入 Pollinations API Key，再拉取模型。",
      modelsUpdated: "模型列表已更新。",
      fetchModelsFailed: "模型拉取失败。",
      saved: "Pollinations 设置已保存到本地浏览器。",
      cleared: "本地 Pollinations 设置已清除。"
    }
  },
  status: {
    pending: "待调度",
    planning: "规划中",
    planning_failed: "规划失败",
    prompt_generating: "提示词生成中",
    prompt_partial_failed: "提示词部分失败",
    image_generating: "图片生成中",
    completed: "已完成",
    partial_completed: "部分完成",
    failed: "生成失败",
    cancelled: "已取消"
  }
};
