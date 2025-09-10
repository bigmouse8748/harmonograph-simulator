/**
 * Application Entry Point
 * 应用程序主入口
 */

import moduleManager from './core/ModuleManager.js';
import eventBus from './core/EventBus.js';
import { Events } from './core/Events.js';
import appConfig from './config/app.config.js';

// 导入模块
import PhysicsModule from './modules/physics/PhysicsModule.js';
import SimpleRenderer from './modules/renderer/SimpleRenderer.js';
import PlatformRenderer from './modules/renderer/PlatformRenderer.js';
import TestUI from './test/TestUI.js';
// import UIModule from './modules/ui/UIModule.js';
// import StateModule from './modules/state/StateModule.js';
// import InputModule from './modules/input/InputModule.js';
// import ExportModule from './modules/export/ExportModule.js';

class HarmonographApp {
  constructor() {
    this.config = appConfig;
    this.moduleManager = moduleManager;
    this.eventBus = eventBus;
    this.initialized = false;
  }

  /**
   * 初始化应用
   */
  async initialize() {
    console.log('🎨 Harmonograph Generator Initializing...');
    
    try {
      // 设置调试模式
      if (this.config.dev.debug) {
        this.eventBus.setDebug(true);
      }

      // 注册模块
      await this.registerModules();

      // 初始化所有模块
      await this.moduleManager.initializeAll();

      // 设置事件监听
      this.setupEventListeners();

      // 启动所有模块
      await this.moduleManager.startAll();

      // 初始化测试UI
      TestUI.initialize();

      // 初始化摆锤状态显示和渲染器样式
      setTimeout(() => {
        const physicsModule = this.moduleManager.get('physics');
        const renderer = this.moduleManager.get('renderer');
        
        if (physicsModule) {
          const pendulums = physicsModule.getPendulums();
          if (TestUI && pendulums) {
            TestUI.updatePendulumStatus(pendulums);
          }
        }
        
        // 初始化渲染器样式
        if (renderer) {
          renderer.setStyle({
            strokeStyle: '#2563eb',
            lineWidth: 2,
            globalAlpha: 0.8
          });
        }
      }, 200);

      this.initialized = true;
      this.eventBus.emit(Events.SYSTEM.READY);
      
      console.log('✅ Harmonograph Generator Ready!');
    } catch (error) {
      console.error('❌ Failed to initialize application:', error);
      this.eventBus.emit(Events.SYSTEM.ERROR, {
        message: 'Failed to initialize application',
        error
      });
    }
  }

  /**
   * 注册所有模块
   */
  async registerModules() {
    console.log('📦 Registering modules...');
    
    // 注册核心模块
    // this.moduleManager.register('state', StateModule, []);
    this.moduleManager.register('physics', PhysicsModule, []);
    this.moduleManager.register('renderer', SimpleRenderer, []);
    this.moduleManager.register('platform', PlatformRenderer, []);
    // this.moduleManager.register('input', InputModule, ['state']);
    // this.moduleManager.register('ui', UIModule, ['state', 'input']);
    // this.moduleManager.register('export', ExportModule, ['renderer', 'state']);
    
    console.log('✅ Modules registered');
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听系统事件
    this.eventBus.on(Events.SYSTEM.ERROR, this.handleError.bind(this));
    
    // 监听用户操作
    this.eventBus.on(Events.CANVAS.DRAWING_START, this.onDrawingStart.bind(this));
    this.eventBus.on(Events.CANVAS.DRAWING_STOP, this.onDrawingStop.bind(this));
    this.eventBus.on(Events.PRESET.APPLIED, this.onPresetApplied.bind(this));
    this.eventBus.on(Events.TOOL.COLOR_CHANGE, this.onColorChange.bind(this));
    this.eventBus.on(Events.TOOL.SIZE_CHANGE, this.onSizeChange.bind(this));
    this.eventBus.on(Events.TOOL.SETTINGS_CHANGE, this.onSettingsChange.bind(this));
    this.eventBus.on(Events.PERFORMANCE.FPS_UPDATE, this.onFpsUpdate.bind(this));
    
    // 监听自定义事件
    this.eventBus.on('physics:speed:change', this.onSpeedChange.bind(this));
    this.eventBus.on('physics:trail:change', this.onTrailChange.bind(this));
    this.eventBus.on('renderer:smooth:change', this.onSmoothChange.bind(this));
    
    // 监听窗口事件
    window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // 监听键盘快捷键
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }

  /**
   * 开始绘制
   */
  onDrawingStart() {
    console.log('🎨 Drawing started');
    // 实现绘制逻辑
  }

  /**
   * 停止绘制
   */
  onDrawingStop() {
    console.log('⏹️ Drawing stopped');
    // 实现停止逻辑
  }

  /**
   * 处理预设应用
   */
  onPresetApplied(preset) {
    const physicsModule = this.moduleManager.get('physics');
    if (physicsModule) {
      // 应用预设到物理引擎
      physicsModule.applyPreset(preset);
      
      // 更新摆锤状态显示
      setTimeout(() => {
        const pendulums = physicsModule.getPendulums();
        if (TestUI && pendulums) {
          TestUI.updatePendulumStatus(pendulums);
        }
      }, 100);
    }
  }

  /**
   * 处理颜色变化
   */
  onColorChange(data) {
    const renderer = this.moduleManager.get('renderer');
    if (renderer) {
      renderer.setStyle({ strokeStyle: data.color });
    }
  }

  /**
   * 处理尺寸变化
   */
  onSizeChange(data) {
    const renderer = this.moduleManager.get('renderer');
    if (renderer) {
      renderer.setStyle({ lineWidth: data.lineWidth });
    }
  }

  /**
   * 处理设置变化
   */
  onSettingsChange(data) {
    const renderer = this.moduleManager.get('renderer');
    if (renderer) {
      renderer.setStyle(data);
    }
  }

  /**
   * 处理速度变化
   */
  onSpeedChange(data) {
    const physicsModule = this.moduleManager.get('physics');
    if (physicsModule) {
      physicsModule.setDrawSpeed(data.speed);
    }
  }

  /**
   * 处理轨迹密度变化
   */
  onTrailChange(data) {
    const physicsModule = this.moduleManager.get('physics');
    if (physicsModule) {
      physicsModule.setTrailDensity(data.density);
    }
  }

  /**
   * 处理平滑线条开关
   */
  onSmoothChange(data) {
    const renderer = this.moduleManager.get('renderer');
    if (renderer) {
      renderer.setStyle({ smoothLines: data.smooth });
    }
  }

  /**
   * 处理FPS更新
   */
  onFpsUpdate(data) {
    if (TestUI) {
      TestUI.updateFPS(data.fps);
    }
  }

  /**
   * 处理错误
   */
  handleError(data) {
    console.error('System Error:', data);
    // 显示错误通知
  }

  /**
   * 处理窗口关闭
   */
  handleBeforeUnload(event) {
    if (this.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '有未保存的更改，确定要离开吗？';
      return event.returnValue;
    }
  }

  /**
   * 处理窗口大小调整
   */
  handleResize() {
    this.eventBus.emit(Events.CANVAS.RESIZE, {
      width: window.innerWidth,
      height: window.innerHeight
    });
  }

  /**
   * 处理键盘输入
   */
  handleKeyDown(event) {
    const shortcuts = this.config.shortcuts;
    const key = this.getKeyString(event);
    
    // 检查快捷键
    for (const [action, shortcut] of Object.entries(shortcuts)) {
      if (key === shortcut) {
        event.preventDefault();
        this.handleShortcut(action);
        break;
      }
    }
  }

  /**
   * 获取按键字符串
   */
  getKeyString(event) {
    const keys = [];
    if (event.ctrlKey) keys.push('Ctrl');
    if (event.shiftKey) keys.push('Shift');
    if (event.altKey) keys.push('Alt');
    if (event.metaKey) keys.push('Meta');
    
    if (event.key && event.key !== 'Control' && event.key !== 'Shift' && 
        event.key !== 'Alt' && event.key !== 'Meta') {
      keys.push(event.key === ' ' ? 'Space' : event.key);
    }
    
    return keys.join('+');
  }

  /**
   * 处理快捷键
   */
  handleShortcut(action) {
    console.log(`Shortcut triggered: ${action}`);
    
    switch (action) {
      case 'start':
        this.eventBus.emit(Events.CANVAS.DRAWING_START);
        break;
      case 'stop':
        this.eventBus.emit(Events.CANVAS.DRAWING_STOP);
        break;
      case 'clear':
        this.eventBus.emit(Events.CANVAS.CLEAR);
        break;
      case 'save':
        this.eventBus.emit(Events.STATE.SAVE);
        break;
      case 'export':
        this.eventBus.emit(Events.EXPORT.START);
        break;
      case 'undo':
        this.eventBus.emit(Events.STATE.UNDO);
        break;
      case 'redo':
        this.eventBus.emit(Events.STATE.REDO);
        break;
      case 'fullscreen':
        this.eventBus.emit(Events.UI.FULLSCREEN_TOGGLE);
        break;
      case 'toggleUI':
        this.eventBus.emit(Events.UI.PANEL_TOGGLE);
        break;
    }
  }

  /**
   * 检查是否有未保存的更改
   */
  hasUnsavedChanges() {
    // TODO: 实现检查逻辑
    return false;
  }

  /**
   * 销毁应用
   */
  async destroy() {
    console.log('🔚 Shutting down Harmonograph Generator...');
    
    // 移除事件监听
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
    window.removeEventListener('resize', this.handleResize);
    document.removeEventListener('keydown', this.handleKeyDown);
    
    // 销毁所有模块
    await this.moduleManager.destroyAll();
    
    // 清理事件总线
    this.eventBus.clear();
    
    this.initialized = false;
    console.log('👋 Harmonograph Generator shut down');
  }

  /**
   * 获取应用实例
   */
  static getInstance() {
    if (!HarmonographApp.instance) {
      HarmonographApp.instance = new HarmonographApp();
    }
    return HarmonographApp.instance;
  }
}

// 导出单例
export default HarmonographApp.getInstance();

// 自动初始化（如果是浏览器环境）
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', async () => {
    const app = HarmonographApp.getInstance();
    await app.initialize();
    
    // 暴露到全局以便调试
    if (app.config.dev.debug) {
      window.harmonographApp = app;
    }
  });
}