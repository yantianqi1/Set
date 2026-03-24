export const messagesEn = {
  header: {
    productName: "Image Set Studio",
    slogan: "PRO-LEVEL PACKING WORKFLOW",
    nav: {
      create: "Create Job",
      jobs: "Job History",
      settings: "Settings"
    }
  },
  common: {
    languageLabel: "Language",
    localeSelectAria: "Select interface language",
    unknownError: "Unknown error"
  },
  home: {
    title: "Create a New Image Set",
    subtitle: "Describe the character and scene here, and we'll turn them into a polished set.",
    labels: {
      theme: "Theme",
      characterProfile: "Character Profile",
      imageCount: "Image Count",
      stylePreset: "Visual Style",
      aspectRatio: "Aspect Ratio",
      consistencyLevel: "Consistency",
      outfitChangePolicy: "Wardrobe Change",
      macroConfig: "Story / Composition Notes"
    },
    placeholders: {
      theme: "Give your image set a memorable title",
      characterProfile: "Describe appearance, personality, styling details...",
      macroConfig: "How should shots be distributed? How does the scene evolve?"
    },
    consistencyOptions: {
      low: "Loose and varied",
      medium: "Balanced",
      high: "Highly consistent"
    },
    outfitOptions: {
      fixed: "Single outfit",
      minor_variation: "Minor changes",
      major_variation: "Frequent changes"
    },
    toggles: {
      sceneProgression: "Enable automatic scene progression",
      nsfw: "NSFW mode"
    },
    actions: {
      loading: "Saving your idea...",
      submit: "Start Generating",
      needsApiKey: "Add your Pollinations key in Settings first",
      viewDetail: "Open Notebook"
    },
    messages: {
      success: "The job has been saved to your notebook and is waiting to run...",
      error: (message: string) => `Failed to save the job: ${message}`
    }
  },
  jobs: {
    title: "Job History",
    subtitle: "Review and manage the image set jobs you've created.",
    loading: "Syncing jobs from the cloud...",
    createdAt: (value: string) => `Created ${value}`,
    progress: (completed: number, total: number) => `Progress: ${completed} / ${total} images`,
    actions: {
      viewDetail: "View Details",
      cloneConfig: "Clone Config",
      previous: "Previous",
      next: "Next"
    },
    empty: "No jobs yet. Create your first one from the home page."
  },
  detail: {
    closeNotebook: "Close Notebook",
    status: (label: string) => `Status: ${label}`,
    recordedAt: (value: string) => `Captured ${value}`,
    actions: {
      retryFailed: "Retry Failed Items"
    },
    tabs: {
      images: "Results",
      planning: "Plan",
      prompts: "Prompt Drafts",
      events: "Logs"
    },
    imagePending: "Drawing in progress...",
    imageAlt: (index: number) => `Generated result ${index}`,
    retryImageTitle: (index: number) => `Regenerate image ${index}`,
    promptTitle: (index: number) => `Prompt draft for image ${index}`,
    promptPending: "The prompt is still being prepared...",
    loading: "Opening notebook...",
    messages: {
      loadFailed: "Failed to open the notebook.",
      retryImageSuccess: (index: number) => `Image ${index} has been queued for regeneration.`,
      retryFailedSuccess: "Failed items have been queued for retry."
    }
  },
  settings: {
    title: "Pollinations Settings",
    subtitle:
      "This app currently uses Pollinations only. Add your key and choose planning, prompt, and image models.",
    labels: {
      baseUrl: "Fixed Base URL",
      apiKey: "Pollinations API Key",
      planningModel: "Planning Model",
      promptModel: "Prompt Model",
      imageModel: "Image Model"
    },
    actions: {
      fetchModels: "Fetch Models",
      fetchingModels: "Fetching...",
      save: "Save Settings",
      clear: "Clear Local Settings"
    },
    placeholders: {
      fetchModelsFirst: "Fetch models first"
    },
    messages: {
      loadDefaultsError: "Failed to load default configuration.",
      missingApiKey: "Enter your Pollinations API Key before fetching models.",
      modelsUpdated: "Model list updated.",
      fetchModelsFailed: "Failed to fetch models.",
      saved: "Pollinations settings were saved in this browser.",
      cleared: "Local Pollinations settings were cleared."
    }
  },
  status: {
    pending: "Pending",
    planning: "Planning",
    planning_failed: "Planning Failed",
    prompt_generating: "Generating Prompts",
    prompt_partial_failed: "Prompt Partially Failed",
    image_generating: "Generating Images",
    completed: "Completed",
    partial_completed: "Partially Completed",
    failed: "Failed",
    cancelled: "Cancelled"
  }
};

export type Messages = typeof messagesEn;
