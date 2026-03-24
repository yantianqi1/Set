import type { Messages } from "./messages.en";

export const messagesJa: Messages = {
  header: {
    productName: "Image Set Studio",
    slogan: "プロ向けイメージセット制作フロー",
    nav: {
      create: "新規作成",
      jobs: "ジョブ履歴",
      settings: "設定"
    }
  },
  common: {
    languageLabel: "言語",
    localeSelectAria: "表示言語を選択",
    unknownError: "不明なエラー"
  },
  home: {
    title: "新しいイメージセットを作成",
    subtitle: "キャラクターとシーンの方向性をここでまとめると、完成したセットへ仕上げます。",
    labels: {
      theme: "テーマ名",
      characterProfile: "キャラクタープロフィール",
      imageCount: "枚数",
      stylePreset: "ビジュアルスタイル",
      aspectRatio: "アスペクト比",
      consistencyLevel: "一貫性",
      outfitChangePolicy: "衣装変化",
      macroConfig: "構成メモ / カット設計"
    },
    placeholders: {
      theme: "イメージセットにわかりやすい名前を付けてください",
      characterProfile: "見た目、性格、衣装の細部を説明してください...",
      macroConfig: "カット配分やシーン遷移をどう組み立てるか？"
    },
    consistencyOptions: {
      low: "自由度高め",
      medium: "標準",
      high: "高い一貫性"
    },
    outfitOptions: {
      fixed: "衣装固定",
      minor_variation: "小さく変化",
      major_variation: "頻繁に変更"
    },
    toggles: {
      sceneProgression: "自動シーン進行を有効化",
      nsfw: "NSFW モード"
    },
    actions: {
      loading: "内容を保存しています...",
      submit: "最初の一枚を描き始める",
      needsApiKey: "先に設定画面で Pollinations Key を入力してください",
      viewDetail: "ノートを開く"
    },
    messages: {
      success: "ジョブをノートに保存しました。処理待ちです...",
      error: (message: string) => `ジョブの保存に失敗しました: ${message}`
    }
  },
  jobs: {
    title: "ジョブ履歴",
    subtitle: "作成済みのイメージセットジョブを確認して管理します。",
    loading: "クラウド上のジョブ一覧を同期しています...",
    createdAt: (value: string) => `作成日時 ${value}`,
    progress: (completed: number, total: number) => `進捗: ${completed} / ${total} 枚`,
    actions: {
      viewDetail: "詳細を見る",
      cloneConfig: "設定を複製",
      previous: "前へ",
      next: "次へ"
    },
    empty: "まだジョブがありません。ホームから最初のジョブを作成してください。"
  },
  detail: {
    closeNotebook: "ノートを閉じる",
    status: (label: string) => `ステータス: ${label}`,
    recordedAt: (value: string) => `記録日時 ${value}`,
    actions: {
      retryFailed: "失敗項目を再試行"
    },
    tabs: {
      images: "結果一覧",
      planning: "構成案",
      prompts: "プロンプト草案",
      events: "ログ"
    },
    imagePending: "画像を生成しています...",
    imageAlt: (index: number) => `生成結果 ${index}`,
    retryImageTitle: (index: number) => `${index} 枚目を再生成`,
    promptTitle: (index: number) => `${index} 枚目のプロンプト草案`,
    promptPending: "プロンプトを準備中です...",
    loading: "ノートを開いています...",
    messages: {
      loadFailed: "ノートの読み込みに失敗しました。",
      retryImageSuccess: (index: number) => `${index} 枚目を再生成キューに追加しました。`,
      retryFailedSuccess: "失敗項目を再試行キューに追加しました。"
    }
  },
  settings: {
    title: "Pollinations 設定",
    subtitle:
      "現在このアプリは Pollinations のみを利用します。API Key を入力し、計画・プロンプト・画像モデルを選択してください。",
    labels: {
      baseUrl: "固定 Base URL",
      apiKey: "Pollinations API Key",
      planningModel: "計画モデル",
      promptModel: "プロンプトモデル",
      imageModel: "画像モデル"
    },
    actions: {
      fetchModels: "モデル取得",
      fetchingModels: "取得中...",
      save: "設定を保存",
      clear: "ローカル設定を削除"
    },
    placeholders: {
      fetchModelsFirst: "先にモデルを取得してください"
    },
    messages: {
      loadDefaultsError: "既定設定の読み込みに失敗しました。",
      missingApiKey: "先に Pollinations API Key を入力してからモデルを取得してください。",
      modelsUpdated: "モデル一覧を更新しました。",
      fetchModelsFailed: "モデル取得に失敗しました。",
      saved: "Pollinations 設定をこのブラウザに保存しました。",
      cleared: "ローカルの Pollinations 設定を削除しました。"
    }
  },
  status: {
    pending: "待機中",
    planning: "構成作成中",
    planning_failed: "構成失敗",
    prompt_generating: "プロンプト生成中",
    prompt_partial_failed: "プロンプト一部失敗",
    image_generating: "画像生成中",
    completed: "完了",
    partial_completed: "一部完了",
    failed: "失敗",
    cancelled: "キャンセル済み"
  }
};
