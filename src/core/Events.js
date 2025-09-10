/**
 * Events - 全局事件定义
 * 定义所有模块间通信使用的事件
 */

export const Events = {
  // 系统事件
  SYSTEM: {
    READY: 'system:ready',
    ERROR: 'system:error',
    WARNING: 'system:warning',
    INFO: 'system:info'
  },

  // 物理引擎事件
  PHYSICS: {
    UPDATE: 'physics:update',
    RESET: 'physics:reset',
    PENDULUM_ADDED: 'physics:pendulum:added',
    PENDULUM_REMOVED: 'physics:pendulum:removed',
    PENDULUM_UPDATED: 'physics:pendulum:updated',
    SIMULATION_START: 'physics:simulation:start',
    SIMULATION_STOP: 'physics:simulation:stop',
    SIMULATION_PAUSE: 'physics:simulation:pause',
    SIMULATION_RESUME: 'physics:simulation:resume'
  },
  
  // 新的物理事件（用于悬挂画板系统）
  PHYSICS_START: 'physics:start',
  PHYSICS_STOP: 'physics:stop',
  PHYSICS_RESET: 'physics:reset',
  PHYSICS_PAUSE: 'physics:pause',
  PHYSICS_RESUME: 'physics:resume',
  PHYSICS_UPDATE: 'physics:update',
  PHYSICS_RESET_COMPLETE: 'physics:reset:complete',
  
  // 画布交互事件
  CANVAS_MOUSEDOWN: 'canvas:mousedown',
  CANVAS_MOUSEMOVE: 'canvas:mousemove',
  CANVAS_MOUSEUP: 'canvas:mouseup',
  CANVAS_TOUCHSTART: 'canvas:touchstart',
  CANVAS_TOUCHMOVE: 'canvas:touchmove',
  CANVAS_TOUCHEND: 'canvas:touchend',
  
  // 交互事件
  INTERACTION_START: 'interaction:start',
  INTERACTION_END: 'interaction:end',
  
  // 绘制事件
  DRAWING_START: 'drawing:start',
  DRAWING_STOP: 'drawing:stop',
  DRAWING_PAUSE: 'drawing:pause',
  DRAWING_RESUME: 'drawing:resume',
  DRAWING_COMPLETE: 'drawing:complete',
  
  // 渲染事件
  RENDER_POINT: 'render:point',
  RENDER_CLEAR: 'render:clear',
  
  // FPS事件
  FPS_UPDATE: 'fps:update',

  // 渲染器事件
  RENDERER: {
    FRAME_START: 'renderer:frame:start',
    FRAME_END: 'renderer:frame:end',
    CLEAR: 'renderer:clear',
    STYLE_CHANGE: 'renderer:style:change',
    EFFECT_ADDED: 'renderer:effect:added',
    EFFECT_REMOVED: 'renderer:effect:removed',
    SCREENSHOT_TAKEN: 'renderer:screenshot:taken'
  },

  // UI事件
  UI: {
    INITIALIZED: 'ui:initialized',
    CONTROL_CHANGE: 'ui:control:change',
    PANEL_TOGGLE: 'ui:panel:toggle',
    THEME_CHANGE: 'ui:theme:change',
    LAYOUT_CHANGE: 'ui:layout:change',
    NOTIFICATION_SHOW: 'ui:notification:show',
    MODAL_OPEN: 'ui:modal:open',
    MODAL_CLOSE: 'ui:modal:close',
    FULLSCREEN_TOGGLE: 'ui:fullscreen:toggle'
  },

  // 输入事件
  INPUT: {
    MOUSE_DOWN: 'input:mouse:down',
    MOUSE_UP: 'input:mouse:up',
    MOUSE_MOVE: 'input:mouse:move',
    MOUSE_WHEEL: 'input:mouse:wheel',
    KEY_DOWN: 'input:key:down',
    KEY_UP: 'input:key:up',
    TOUCH_START: 'input:touch:start',
    TOUCH_END: 'input:touch:end',
    TOUCH_MOVE: 'input:touch:move',
    GESTURE_DETECTED: 'input:gesture:detected'
  },

  // 状态管理事件
  STATE: {
    CHANGE: 'state:change',
    SAVE: 'state:save',
    LOAD: 'state:load',
    UNDO: 'state:undo',
    REDO: 'state:redo',
    RESET: 'state:reset',
    HISTORY_UPDATE: 'state:history:update'
  },

  // 导出事件
  EXPORT: {
    START: 'export:start',
    PROGRESS: 'export:progress',
    COMPLETE: 'export:complete',
    ERROR: 'export:error',
    CANCELLED: 'export:cancelled'
  },

  // 预设事件
  PRESET: {
    LOADED: 'preset:loaded',
    SAVED: 'preset:saved',
    DELETED: 'preset:deleted',
    APPLIED: 'preset:applied',
    LIST_UPDATE: 'preset:list:update'
  },

  // 画布事件
  CANVAS: {
    READY: 'canvas:ready',
    RESIZE: 'canvas:resize',
    DRAWING_START: 'canvas:drawing:start',
    DRAWING_STOP: 'canvas:drawing:stop',
    DRAWING_PAUSE: 'canvas:drawing:pause',
    DRAWING_RESUME: 'canvas:drawing:resume',
    CLEAR: 'canvas:clear'
  },

  // 动画事件
  ANIMATION: {
    START: 'animation:start',
    STOP: 'animation:stop',
    PAUSE: 'animation:pause',
    RESUME: 'animation:resume',
    FRAME: 'animation:frame',
    COMPLETE: 'animation:complete'
  },

  // 工具事件
  TOOL: {
    SELECTED: 'tool:selected',
    SETTINGS_CHANGE: 'tool:settings:change',
    BRUSH_CHANGE: 'tool:brush:change',
    COLOR_CHANGE: 'tool:color:change',
    SIZE_CHANGE: 'tool:size:change'
  },

  // 性能事件
  PERFORMANCE: {
    FPS_UPDATE: 'performance:fps:update',
    MEMORY_WARNING: 'performance:memory:warning',
    OPTIMIZATION_NEEDED: 'performance:optimization:needed'
  }
};

// 事件优先级
export const EventPriority = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
};

// 事件类别
export const EventCategory = {
  SYSTEM: 'system',
  USER_INPUT: 'user_input',
  RENDER: 'render',
  DATA: 'data',
  NETWORK: 'network'
};