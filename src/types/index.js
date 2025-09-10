/**
 * Type Definitions
 * JavaScript类型定义和接口（使用JSDoc）
 */

/**
 * @typedef {Object} Point
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 */

/**
 * @typedef {Object} Point3D
 * @property {number} x - X坐标
 * @property {number} y - Y坐标
 * @property {number} z - Z坐标
 */

/**
 * @typedef {Object} PendulumParams
 * @property {number} frequency - 频率 (Hz)
 * @property {number} amplitude - 振幅 (像素)
 * @property {number} phase - 相位 (弧度)
 * @property {number} damping - 阻尼系数 (0-1)
 * @property {number} [angle] - 初始角度 (弧度)
 */

/**
 * @typedef {Object} DrawingStyle
 * @property {string} color - 颜色值
 * @property {number} lineWidth - 线宽
 * @property {string} lineCap - 线端样式
 * @property {string} lineJoin - 线连接样式
 * @property {number} opacity - 透明度 (0-1)
 * @property {string} [blendMode] - 混合模式
 * @property {boolean} [glow] - 是否发光
 * @property {Object} [gradient] - 渐变配置
 */

/**
 * @typedef {Object} ExportOptions
 * @property {number} width - 导出宽度
 * @property {number} height - 导出高度
 * @property {number} quality - 质量 (0-1)
 * @property {string} backgroundColor - 背景颜色
 * @property {boolean} transparent - 是否透明背景
 * @property {number} [dpi] - DPI设置
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} isDrawing - 是否正在绘图
 * @property {boolean} isPaused - 是否暂停
 * @property {Array<PendulumParams>} pendulums - 摆锤参数数组
 * @property {DrawingStyle} drawingStyle - 绘图样式
 * @property {Object} canvasSettings - 画布设置
 * @property {Object} uiSettings - UI设置
 * @property {string} currentTool - 当前工具
 * @property {string} currentPreset - 当前预设
 */

/**
 * @typedef {Object} CanvasSettings
 * @property {number} width - 画布宽度
 * @property {number} height - 画布高度
 * @property {string} backgroundColor - 背景颜色
 * @property {boolean} showGrid - 是否显示网格
 * @property {boolean} showGuides - 是否显示参考线
 * @property {number} zoom - 缩放级别
 */

/**
 * @typedef {Object} PhysicsConfig
 * @property {number} fps - 帧率
 * @property {number} timeScale - 时间缩放
 * @property {number} gravity - 重力系数
 * @property {number} friction - 摩擦系数
 * @property {boolean} useRealPhysics - 使用真实物理
 */

/**
 * @typedef {Object} Preset
 * @property {string} id - 预设ID
 * @property {string} name - 预设名称
 * @property {string} description - 描述
 * @property {string} thumbnail - 缩略图URL
 * @property {Array<PendulumParams>} pendulums - 摆锤参数
 * @property {DrawingStyle} style - 绘图样式
 * @property {Object} [metadata] - 元数据
 */

/**
 * @typedef {Object} AnimationFrame
 * @property {number} timestamp - 时间戳
 * @property {ImageData} imageData - 图像数据
 * @property {number} duration - 持续时间
 */

/**
 * @typedef {Object} ModuleConfig
 * @property {string} name - 模块名称
 * @property {boolean} enabled - 是否启用
 * @property {Object} settings - 模块设置
 */

/**
 * @typedef {Object} InputEvent
 * @property {string} type - 事件类型
 * @property {Point} position - 位置
 * @property {Object} [data] - 额外数据
 * @property {number} timestamp - 时间戳
 */

/**
 * @typedef {Object} Notification
 * @property {string} type - 通知类型 (info|success|warning|error)
 * @property {string} message - 消息内容
 * @property {number} [duration] - 显示时长
 * @property {Function} [action] - 动作回调
 */

/**
 * @typedef {'png'|'jpeg'|'webp'} ImageFormat
 * @typedef {'svg'} VectorFormat
 * @typedef {'gif'|'mp4'|'webm'} AnimationFormat
 * @typedef {'light'|'dark'|'auto'} ThemeMode
 * @typedef {'draw'|'preview'|'select'} InputMode
 */

// 导出常量
export const MAX_PENDULUMS = 8;
export const DEFAULT_FPS = 60;
export const DEFAULT_CANVAS_WIDTH = 1920;
export const DEFAULT_CANVAS_HEIGHT = 1080;
export const DEFAULT_LINE_WIDTH = 1;
export const DEFAULT_DAMPING = 0.995;

// 导出枚举
export const BrushType = {
  ROUND: 'round',
  SQUARE: 'square',
  CALLIGRAPHY: 'calligraphy',
  WATERCOLOR: 'watercolor',
  PENCIL: 'pencil'
};

export const BlendMode = {
  NORMAL: 'normal',
  MULTIPLY: 'multiply',
  SCREEN: 'screen',
  OVERLAY: 'overlay',
  SOFT_LIGHT: 'soft-light',
  HARD_LIGHT: 'hard-light',
  COLOR_DODGE: 'color-dodge',
  COLOR_BURN: 'color-burn'
};

export const ExportQuality = {
  LOW: 0.6,
  MEDIUM: 0.8,
  HIGH: 0.95,
  MAXIMUM: 1.0
};

export const AnimationEasing = {
  LINEAR: 'linear',
  EASE_IN: 'easeIn',
  EASE_OUT: 'easeOut',
  EASE_IN_OUT: 'easeInOut',
  CUBIC_BEZIER: 'cubicBezier'
};