/**
 * PhysicsModule - 物理引擎主模块
 * 管理整个物理模拟系统
 */

import { BaseModule } from '../../core/BaseModule.js';
import { PendulumSystem } from './PendulumSystem.js';
import { Events } from '../../core/Events.js';

export class PhysicsModule extends BaseModule {
  constructor(dependencies) {
    super(dependencies);
    
    this.pendulumSystem = null;
    this.animationId = null;
    this.lastTime = 0;
    this.deltaTime = 0;
    this.fps = 60;
    this.targetFrameTime = 1000 / this.fps;
    this.isRunning = false;
    this.isPaused = false;
    
    // 画台和笔的状态
    this.platformState = {
      isRunning: false,    // 画台是否运行
      isDrawing: false     // 笔是否接触纸面
    };
    
    // 性能监控
    this.frameCount = 0;
    this.fpsCounter = 0;
    this.lastFpsUpdate = 0;
    this.currentFps = 0;
    
    // 物理配置
    this.physicsConfig = {
      timeScale: 1.0,          // 时间缩放
      drawSpeed: 1.0,          // 绘画速度倍数
      gravity: 9.81,           // 重力加速度
      useRealisticPhysics: false, // 使用真实物理模型
      interpolation: true,     // 使用插值平滑
      adaptiveTimeStep: true,  // 自适应时间步长
      trailDensity: 5          // 轨迹密度
    };
  }

  /**
   * 获取模块名称
   */
  getName() {
    return 'PhysicsModule';
  }

  /**
   * 获取默认配置
   */
  getDefaultConfig() {
    return {
      fps: 60,
      maxPendulums: 8,
      defaultDamping: 0.995,
      maxTrajectoryPoints: 10000,
      centerX: 960,
      centerY: 540
    };
  }

  /**
   * 初始化模块
   */
  async initialize(config = {}) {
    await super.initialize(config);
    
    // 创建摆锤系统 (使用原点中心坐标系)
    this.pendulumSystem = new PendulumSystem({
      maxPendulums: this.config.maxPendulums,
      maxTrajectoryPoints: this.config.maxTrajectoryPoints,
      centerX: 0,
      centerY: 0
    });
    
    // 设置默认摆锤
    this.setupDefaultPendulums();
    
    // 设置事件监听
    this.setupEventListeners();
    
    console.log('[PhysicsModule] Initialized');
  }

  /**
   * 设置默认摆锤
   */
  setupDefaultPendulums() {
    // X轴主摆
    this.pendulumSystem.addPendulum({
      axis: 'x',
      frequency: 2.1,
      amplitude: 200,
      phase: 0,
      damping: this.config.defaultDamping
    });
    
    // X轴副摆
    this.pendulumSystem.addPendulum({
      axis: 'x',
      frequency: 3.2,
      amplitude: 100,
      phase: Math.PI / 4,
      damping: this.config.defaultDamping
    });
    
    // Y轴主摆
    this.pendulumSystem.addPendulum({
      axis: 'y',
      frequency: 2.0,
      amplitude: 200,
      phase: 0,
      damping: this.config.defaultDamping
    });
    
    // Y轴副摆
    this.pendulumSystem.addPendulum({
      axis: 'y',
      frequency: 3.1,
      amplitude: 100,
      phase: Math.PI / 3,
      damping: this.config.defaultDamping
    });
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听控制事件
    this.subscribe(Events.PHYSICS.SIMULATION_START, () => this.startSimulation());
    this.subscribe(Events.PHYSICS.SIMULATION_STOP, () => this.stopSimulation());
    this.subscribe(Events.PHYSICS.SIMULATION_PAUSE, () => this.pauseSimulation());
    this.subscribe(Events.PHYSICS.SIMULATION_RESUME, () => this.resumeSimulation());
    this.subscribe(Events.PHYSICS.RESET, () => this.reset());
    
    // 监听摆锤操作
    this.subscribe(Events.PHYSICS.PENDULUM_ADDED, (data) => this.addPendulum(data));
    this.subscribe(Events.PHYSICS.PENDULUM_REMOVED, (data) => this.removePendulum(data.id));
    this.subscribe(Events.PHYSICS.PENDULUM_UPDATED, (data) => this.updatePendulum(data));
    
    // 监听画布事件
    this.subscribe(Events.CANVAS.DRAWING_START, () => this.startSimulation());
    this.subscribe(Events.CANVAS.DRAWING_STOP, () => this.stopSimulation());
    this.subscribe(Events.CANVAS.DRAWING_PAUSE, () => this.pauseSimulation());
    this.subscribe(Events.CANVAS.DRAWING_RESUME, () => this.resumeSimulation());
    this.subscribe(Events.CANVAS.CLEAR, () => this.reset());
    
    // 监听新的画台控制事件
    this.subscribe('platform:start', () => this.startPlatform());
    this.subscribe('platform:stop', () => this.stopPlatform());
    this.subscribe('pen:drop', () => this.dropPen());
    this.subscribe('pen:lift', () => this.liftPen());
  }

  /**
   * 启动模块
   */
  async start() {
    await super.start();
    console.log('[PhysicsModule] Started');
  }

  /**
   * 启动画台运动 (预览模式)
   */
  startPlatform() {
    if (this.isRunning) {
      console.log('[PhysicsModule] Platform already running');
      return;
    }
    
    this.isRunning = true;
    this.isPaused = false;
    this.platformState.isRunning = true;
    this.platformState.isDrawing = false; // 只运行，不绘画
    
    this.lastTime = performance.now();
    this.pendulumSystem.start();
    
    // 开始动画循环
    this.animate();
    
    this.emit('platform:started');
    console.log('[PhysicsModule] ✅ Platform started (preview mode)');
  }

  /**
   * 落笔开始绘画
   */
  dropPen() {
    if (!this.platformState.isRunning) {
      console.log('[PhysicsModule] Platform not running, cannot drop pen');
      return;
    }
    
    if (this.platformState.isDrawing) {
      console.log('[PhysicsModule] Pen already dropped');
      return;
    }
    
    this.platformState.isDrawing = true;
    this.emit('pen:dropped');
    console.log('[PhysicsModule] ✅ Pen dropped, started drawing');
  }

  /**
   * 抬笔停止绘画
   */
  liftPen() {
    if (!this.platformState.isDrawing) {
      console.log('[PhysicsModule] Pen not drawing');
      return;
    }
    
    this.platformState.isDrawing = false;
    this.emit('pen:lifted');
    console.log('[PhysicsModule] ✅ Pen lifted, stopped drawing');
  }

  /**
   * 停止画台
   */
  stopPlatform() {
    if (!this.isRunning) {
      return;
    }
    
    this.isRunning = false;
    this.isPaused = false;
    this.platformState.isRunning = false;
    this.platformState.isDrawing = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.pendulumSystem.stop();
    this.emit('platform:stopped');
    console.log('[PhysicsModule] ✅ Platform stopped');
  }

  /**
   * 启动物理模拟 (兼容旧接口)
   */
  startSimulation() {
    this.startPlatform();
    // 延迟一秒后自动落笔，用于兼容旧的工作流
    setTimeout(() => {
      if (this.platformState.isRunning) {
        this.dropPen();
      }
    }, 1000);
  }

  /**
   * 停止物理模拟
   */
  stopSimulation() {
    this.isRunning = false;
    this.isPaused = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    this.pendulumSystem.stop();
    this.emit(Events.PHYSICS.SIMULATION_STOP);
    console.log('[PhysicsModule] Simulation stopped');
  }

  /**
   * 暂停模拟
   */
  pauseSimulation() {
    if (!this.isRunning || this.isPaused) return;
    
    this.isPaused = true;
    this.pendulumSystem.stop();
    this.emit(Events.PHYSICS.SIMULATION_PAUSE);
  }

  /**
   * 恢复模拟
   */
  resumeSimulation() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.lastTime = performance.now();
    this.pendulumSystem.start();
    this.animate();
    this.emit(Events.PHYSICS.SIMULATION_RESUME);
  }

  /**
   * 动画循环
   */
  animate() {
    if (!this.isRunning || this.isPaused) return;
    
    this.animationId = requestAnimationFrame(() => this.animate());
    
    const currentTime = performance.now();
    const rawDeltaTime = currentTime - this.lastTime;
    
    // 自适应时间步长
    if (this.physicsConfig.adaptiveTimeStep) {
      this.deltaTime = Math.min(rawDeltaTime, this.targetFrameTime * 2) / 1000;
    } else {
      this.deltaTime = this.targetFrameTime / 1000;
    }
    
    // 应用时间缩放和绘画速度
    this.deltaTime *= this.physicsConfig.timeScale * this.physicsConfig.drawSpeed;
    
    // 更新物理系统
    const position = this.pendulumSystem.update(this.deltaTime);
    
    if (position) {
      // 发送位置更新事件 (包含平台状态信息)
      this.emit(Events.PHYSICS.UPDATE, {
        position,
        trajectory: this.pendulumSystem.getTrajectory(),
        state: this.pendulumSystem.getState(),
        platformState: this.platformState,
        fps: this.currentFps
      });
    }
    
    // 更新FPS计数器
    this.updateFps(currentTime);
    
    this.lastTime = currentTime;
    
    // 检查是否停止
    if (this.pendulumSystem.isStopped()) {
      console.log('[PhysicsModule] System energy depleted, stopping');
      this.stopSimulation();
    }
  }

  /**
   * 更新FPS
   */
  updateFps(currentTime) {
    this.frameCount++;
    
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      
      this.emit(Events.PERFORMANCE.FPS_UPDATE, { fps: this.currentFps });
    }
  }

  /**
   * 添加摆锤
   */
  addPendulum(params) {
    try {
      const id = this.pendulumSystem.addPendulum(params);
      this.emit(Events.PHYSICS.PENDULUM_ADDED, { id, params });
      return id;
    } catch (error) {
      this.handleError(error, 'addPendulum');
      return null;
    }
  }

  /**
   * 移除摆锤
   */
  removePendulum(id) {
    if (this.pendulumSystem.removePendulum(id)) {
      this.emit(Events.PHYSICS.PENDULUM_REMOVED, { id });
      return true;
    }
    return false;
  }

  /**
   * 更新摆锤参数
   */
  updatePendulum(data) {
    const pendulum = this.pendulumSystem.getPendulum(data.id);
    if (pendulum) {
      pendulum.setParams(data.params);
      this.emit(Events.PHYSICS.PENDULUM_UPDATED, data);
      return true;
    }
    return false;
  }

  /**
   * 获取所有摆锤
   */
  getPendulums() {
    return this.pendulumSystem.getAllPendulums();
  }

  /**
   * 获取系统状态
   */
  getSystemState() {
    return this.pendulumSystem.getState();
  }

  /**
   * 获取轨迹
   */
  getTrajectory() {
    return this.pendulumSystem.getTrajectory();
  }

  /**
   * 重置系统
   */
  reset() {
    this.stopSimulation();
    this.pendulumSystem.reset();
    this.emit(Events.PHYSICS.RESET);
    console.log('[PhysicsModule] System reset');
  }

  /**
   * 清除系统
   */
  clear() {
    this.stopSimulation();
    this.pendulumSystem.clear();
    this.setupDefaultPendulums();
    this.emit(Events.PHYSICS.RESET);
  }

  /**
   * 应用预设
   */
  applyPreset(preset) {
    this.pendulumSystem.applyPreset(preset);
    // 不在这里触发事件，避免无限循环
    // 事件应该只在UI层触发一次
  }

  /**
   * 设置物理配置
   */
  setPhysicsConfig(config) {
    this.physicsConfig = { ...this.physicsConfig, ...config };
    this.emit('physics:config:changed', this.physicsConfig);
  }

  /**
   * 设置绘画速度
   */
  setDrawSpeed(speed) {
    this.physicsConfig.drawSpeed = Math.max(0.1, Math.min(5.0, speed));
    console.log(`[PhysicsModule] Draw speed set to: ${this.physicsConfig.drawSpeed}x`);
  }

  /**
   * 设置轨迹密度
   */
  setTrailDensity(density) {
    this.physicsConfig.trailDensity = Math.max(1, Math.min(10, density));
    this.pendulumSystem.setTrailDensity?.(this.physicsConfig.trailDensity);
  }

  /**
   * 导出系统配置
   */
  exportSystem() {
    return this.pendulumSystem.export();
  }

  /**
   * 导入系统配置
   */
  importSystem(data) {
    this.pendulumSystem.import(data);
    this.emit('physics:system:imported', data);
  }

  /**
   * 停止模块
   */
  async stop() {
    this.stopSimulation();
    await super.stop();
  }

  /**
   * 销毁模块
   */
  async destroy() {
    this.stopSimulation();
    this.pendulumSystem = null;
    await super.destroy();
  }
}

export default PhysicsModule;