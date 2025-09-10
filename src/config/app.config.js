/**
 * Application Configuration
 * 应用程序的全局配置
 */

export default {
  // 应用基础信息
  app: {
    name: 'Harmonograph Generator',
    version: '1.0.0',
    author: '',
    description: 'Interactive harmonograph art generator with physics simulation'
  },

  // 画布默认设置
  canvas: {
    defaultWidth: 1920,
    defaultHeight: 1080,
    minWidth: 400,
    minHeight: 300,
    maxWidth: 7680,
    maxHeight: 4320,
    backgroundColor: '#ffffff',
    antialias: true,
    preserveDrawingBuffer: true
  },

  // 物理引擎配置
  physics: {
    fps: 60,
    timeScale: 1.0,
    defaultGravity: 9.81,
    defaultDamping: 0.995,
    minFrequency: 0.1,
    maxFrequency: 10,
    minAmplitude: 10,
    maxAmplitude: 500,
    maxPendulums: 8
  },

  // 渲染配置
  renderer: {
    defaultLineWidth: 1,
    minLineWidth: 0.1,
    maxLineWidth: 20,
    defaultColor: '#000000',
    defaultOpacity: 1,
    maxPathPoints: 100000,
    batchSize: 1000,
    useWebGL: false
  },

  // UI配置
  ui: {
    theme: 'light',
    language: 'zh-CN',
    showFPS: true,
    showTooltips: true,
    autoSave: true,
    autoSaveInterval: 60000, // 1分钟
    animations: true,
    animationDuration: 300
  },

  // 导出配置
  export: {
    defaultFormat: 'png',
    defaultQuality: 0.95,
    maxImageSize: 10000,
    enableSVG: true,
    enablePDF: true,
    enableAnimation: true,
    defaultDPI: 96,
    highDPI: 300
  },

  // 预设配置
  presets: {
    maxUserPresets: 100,
    thumbnailWidth: 200,
    thumbnailHeight: 200,
    autoGenerateThumbnail: true
  },

  // 性能配置
  performance: {
    enableWebWorkers: true,
    enableGPU: true,
    cacheSize: 50, // MB
    maxUndoSteps: 50,
    throttleDelay: 16, // ms
    debounceDelay: 300 // ms
  },

  // 快捷键配置
  shortcuts: {
    start: 'Space',
    stop: 'Escape',
    clear: 'Ctrl+L',
    save: 'Ctrl+S',
    export: 'Ctrl+E',
    undo: 'Ctrl+Z',
    redo: 'Ctrl+Y',
    fullscreen: 'F11',
    toggleUI: 'Tab'
  },

  // 存储配置
  storage: {
    prefix: 'harmonograph_',
    useLocalStorage: true,
    useIndexedDB: true,
    maxStorageSize: 100 // MB
  },

  // 开发配置
  dev: {
    debug: false,
    logLevel: 'info',
    showStats: false,
    mockData: false
  }
};