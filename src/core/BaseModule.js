/**
 * BaseModule - 所有模块的基类
 * 提供模块的基础功能和生命周期钩子
 */
import eventBus from './EventBus.js';

export class BaseModule {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
    this.eventBus = eventBus;
    this.config = {};
    this.state = 'created';
    this.subscriptions = [];
  }

  /**
   * 初始化模块
   * 子类应该重写此方法
   */
  async initialize(config = {}) {
    this.config = { ...this.getDefaultConfig(), ...config };
    this.state = 'initialized';
    console.log(`[${this.getName()}] Initialized`);
  }

  /**
   * 启动模块
   * 子类可以重写此方法
   */
  async start() {
    this.state = 'running';
    console.log(`[${this.getName()}] Started`);
  }

  /**
   * 停止模块
   * 子类可以重写此方法
   */
  async stop() {
    this.state = 'stopped';
    console.log(`[${this.getName()}] Stopped`);
  }

  /**
   * 销毁模块
   * 清理资源和事件监听
   */
  async destroy() {
    this.unsubscribeAll();
    this.state = 'destroyed';
    console.log(`[${this.getName()}] Destroyed`);
  }

  /**
   * 获取模块名称
   * 子类应该重写此方法
   */
  getName() {
    return this.constructor.name;
  }

  /**
   * 获取默认配置
   * 子类可以重写此方法
   */
  getDefaultConfig() {
    return {};
  }

  /**
   * 更新配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    this.onConfigUpdate(config);
  }

  /**
   * 配置更新钩子
   * 子类可以重写此方法
   */
  onConfigUpdate(config) {
    // Override in subclass
  }

  /**
   * 订阅事件
   */
  subscribe(event, handler, context = this) {
    const unsubscribe = this.eventBus.on(event, handler, context);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * 发布事件
   */
  emit(event, data) {
    this.eventBus.emit(event, data);
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }

  /**
   * 获取依赖模块
   */
  getDependency(name) {
    if (!this.dependencies[name]) {
      throw new Error(`Dependency ${name} not found in ${this.getName()}`);
    }
    return this.dependencies[name];
  }

  /**
   * 检查模块状态
   */
  isRunning() {
    return this.state === 'running';
  }

  /**
   * 错误处理
   */
  handleError(error, context = '') {
    console.error(`[${this.getName()}] Error ${context}:`, error);
    this.emit('module:error', {
      module: this.getName(),
      error,
      context
    });
  }

  /**
   * 性能监控
   */
  measurePerformance(operation, callback) {
    const startTime = performance.now();
    const result = callback();
    const duration = performance.now() - startTime;
    
    this.emit('module:performance', {
      module: this.getName(),
      operation,
      duration
    });
    
    return result;
  }

  /**
   * 异步性能监控
   */
  async measurePerformanceAsync(operation, callback) {
    const startTime = performance.now();
    const result = await callback();
    const duration = performance.now() - startTime;
    
    this.emit('module:performance', {
      module: this.getName(),
      operation,
      duration
    });
    
    return result;
  }
}