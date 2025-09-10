/**
 * ModuleManager - 模块生命周期管理器
 * 负责模块的注册、初始化、启动、停止和销毁
 */
import eventBus from './EventBus.js';

export class ModuleManager {
  constructor() {
    this.modules = new Map();
    this.dependencies = new Map();
    this.initOrder = [];
    this.initialized = false;
  }

  /**
   * 注册模块
   */
  register(name, moduleClass, dependencies = []) {
    if (this.modules.has(name)) {
      throw new Error(`Module ${name} already registered`);
    }

    this.modules.set(name, {
      name,
      class: moduleClass,
      instance: null,
      status: 'registered',
      dependencies
    });

    this.dependencies.set(name, dependencies);
    console.log(`[ModuleManager] Registered module: ${name}`);
    
    return this;
  }

  /**
   * 获取模块实例
   */
  get(name) {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module ${name} not found`);
    }
    return module.instance;
  }

  /**
   * 初始化所有模块
   */
  async initializeAll() {
    if (this.initialized) {
      console.warn('[ModuleManager] Already initialized');
      return;
    }

    this.initOrder = this.topologicalSort();
    
    for (const moduleName of this.initOrder) {
      await this.initializeModule(moduleName);
    }

    this.initialized = true;
    eventBus.emit('modules:initialized');
    console.log('[ModuleManager] All modules initialized');
  }

  /**
   * 初始化单个模块
   */
  async initializeModule(name) {
    const module = this.modules.get(name);
    if (!module) {
      throw new Error(`Module ${name} not found`);
    }

    if (module.status === 'initialized' || module.status === 'running') {
      return module.instance;
    }

    console.log(`[ModuleManager] Initializing module: ${name}`);

    // 初始化依赖
    const deps = {};
    for (const depName of module.dependencies) {
      deps[depName] = await this.initializeModule(depName);
    }

    // 创建模块实例
    try {
      module.instance = new module.class(deps);
      
      // 调用模块的初始化方法
      if (typeof module.instance.initialize === 'function') {
        await module.instance.initialize();
      }

      module.status = 'initialized';
      eventBus.emit(`module:${name}:initialized`, module.instance);
      
      return module.instance;
    } catch (error) {
      module.status = 'error';
      throw new Error(`Failed to initialize module ${name}: ${error.message}`);
    }
  }

  /**
   * 启动所有模块
   */
  async startAll() {
    for (const moduleName of this.initOrder) {
      await this.startModule(moduleName);
    }
    eventBus.emit('modules:started');
    console.log('[ModuleManager] All modules started');
  }

  /**
   * 启动单个模块
   */
  async startModule(name) {
    const module = this.modules.get(name);
    if (!module || !module.instance) {
      throw new Error(`Module ${name} not initialized`);
    }

    if (module.status === 'running') {
      return;
    }

    if (typeof module.instance.start === 'function') {
      await module.instance.start();
    }

    module.status = 'running';
    eventBus.emit(`module:${name}:started`, module.instance);
    console.log(`[ModuleManager] Started module: ${name}`);
  }

  /**
   * 停止所有模块
   */
  async stopAll() {
    const reverseOrder = [...this.initOrder].reverse();
    
    for (const moduleName of reverseOrder) {
      await this.stopModule(moduleName);
    }
    
    eventBus.emit('modules:stopped');
    console.log('[ModuleManager] All modules stopped');
  }

  /**
   * 停止单个模块
   */
  async stopModule(name) {
    const module = this.modules.get(name);
    if (!module || !module.instance) {
      return;
    }

    if (module.status !== 'running') {
      return;
    }

    if (typeof module.instance.stop === 'function') {
      await module.instance.stop();
    }

    module.status = 'stopped';
    eventBus.emit(`module:${name}:stopped`);
    console.log(`[ModuleManager] Stopped module: ${name}`);
  }

  /**
   * 销毁所有模块
   */
  async destroyAll() {
    const reverseOrder = [...this.initOrder].reverse();
    
    for (const moduleName of reverseOrder) {
      await this.destroyModule(moduleName);
    }

    this.modules.clear();
    this.dependencies.clear();
    this.initOrder = [];
    this.initialized = false;
    
    eventBus.emit('modules:destroyed');
    console.log('[ModuleManager] All modules destroyed');
  }

  /**
   * 销毁单个模块
   */
  async destroyModule(name) {
    const module = this.modules.get(name);
    if (!module || !module.instance) {
      return;
    }

    await this.stopModule(name);

    if (typeof module.instance.destroy === 'function') {
      await module.instance.destroy();
    }

    module.instance = null;
    module.status = 'destroyed';
    eventBus.emit(`module:${name}:destroyed`);
    console.log(`[ModuleManager] Destroyed module: ${name}`);
  }

  /**
   * 拓扑排序 - 解决依赖关系
   */
  topologicalSort() {
    const visited = new Set();
    const stack = [];

    const visit = (name) => {
      if (visited.has(name)) return;
      visited.add(name);

      const deps = this.dependencies.get(name) || [];
      for (const dep of deps) {
        visit(dep);
      }

      stack.push(name);
    };

    for (const name of this.modules.keys()) {
      visit(name);
    }

    return stack;
  }

  /**
   * 获取模块状态
   */
  getStatus() {
    const status = {};
    for (const [name, module] of this.modules) {
      status[name] = module.status;
    }
    return status;
  }

  /**
   * 检查模块是否存在
   */
  has(name) {
    return this.modules.has(name);
  }

  /**
   * 重启模块
   */
  async restartModule(name) {
    await this.stopModule(name);
    await this.startModule(name);
    console.log(`[ModuleManager] Restarted module: ${name}`);
  }
}

// 创建单例
export default new ModuleManager();