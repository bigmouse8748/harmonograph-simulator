/**
 * SuspendedBoardPhysics - 新的物理引擎主模块
 * 使用四角悬挂画板系统替代原有的摆锤系统
 */

import { BaseModule } from '../../core/BaseModule.js';
import { SuspendedBoard } from './SuspendedBoard.js';
import { Events } from '../../core/Events.js';

export class SuspendedBoardPhysics extends BaseModule {
  constructor(dependencies) {
    super(dependencies);
    
    this.board = null;
    this.animationId = null;
    this.lastTime = 0;
    this.fps = 60;
    this.targetFrameTime = 1000 / this.fps;
    
    // 状态标志
    this.isRunning = false;
    this.isDrawing = false;  // 是否正在绘制轨迹
    this.isPaused = false;
    
    // 交互状态
    this.isDragging = false;
    this.dragStartPos = null;
    this.dragCurrentPos = null;
    
    // 性能监控
    this.frameCount = 0;
    this.currentFps = 0;
    this.lastFpsUpdate = 0;
    
    // 配置
    this.config = {
      timeScale: 1.0,
      gravity: 9.81,
      boardWidth: 400,
      boardHeight: 300,
      ropeLength: 500,
      ropeStiffness: 100,
      airDamping: 0.02,
      ropeDamping: 0.05,
      penOffset: { x: 0, y: 0 },
      suspensionSpread: 600,  // 悬挂点的间距
      drawingThreshold: 0.5,  // 开始绘制的速度阈值
      autoStop: true,         // 自动停止绘制
      stopThreshold: 0.01     // 停止阈值
    };
  }
  
  getName() {
    return 'SuspendedBoardPhysics';
  }
  
  /**
   * 初始化模块
   */
  async initialize(config = {}) {
    await super.initialize(config);
    
    // 合并配置
    this.config = { ...this.config, ...config };
    
    // 创建画板实例
    this.createBoard();
    
    // 注册事件监听
    this.setupEventListeners();
    
    this.logger.info('SuspendedBoardPhysics initialized');
  }
  
  /**
   * 创建画板
   */
  createBoard() {
    const spread = this.config.suspensionSpread / 2;
    
    this.board = new SuspendedBoard({
      width: this.config.boardWidth,
      height: this.config.boardHeight,
      mass: 1.0,
      ropeLength: this.config.ropeLength,
      ropeStiffness: this.config.ropeStiffness,
      gravity: this.config.gravity,
      airDamping: this.config.airDamping,
      ropeDamping: this.config.ropeDamping,
      penOffset: this.config.penOffset,
      suspensionPoints: [
        { x: -spread, y: -spread, z: this.config.ropeLength },
        { x: spread, y: -spread, z: this.config.ropeLength },
        { x: spread, y: spread, z: this.config.ropeLength },
        { x: -spread, y: spread, z: this.config.ropeLength }
      ]
    });
  }
  
  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听画布交互事件
    this.eventBus.on(Events.CANVAS_MOUSEDOWN, this.handleMouseDown.bind(this));
    this.eventBus.on(Events.CANVAS_MOUSEMOVE, this.handleMouseMove.bind(this));
    this.eventBus.on(Events.CANVAS_MOUSEUP, this.handleMouseUp.bind(this));
    
    // 触摸事件
    this.eventBus.on(Events.CANVAS_TOUCHSTART, this.handleTouchStart.bind(this));
    this.eventBus.on(Events.CANVAS_TOUCHMOVE, this.handleTouchMove.bind(this));
    this.eventBus.on(Events.CANVAS_TOUCHEND, this.handleTouchEnd.bind(this));
    
    // 控制事件
    this.eventBus.on(Events.PHYSICS_START, this.start.bind(this));
    this.eventBus.on(Events.PHYSICS_STOP, this.stop.bind(this));
    this.eventBus.on(Events.PHYSICS_RESET, this.reset.bind(this));
    this.eventBus.on(Events.PHYSICS_PAUSE, this.pause.bind(this));
    this.eventBus.on(Events.PHYSICS_RESUME, this.resume.bind(this));
  }
  
  /**
   * 处理鼠标按下
   */
  handleMouseDown(event) {
    const { x, y } = event.detail;
    this.startDrag(x, y);
  }
  
  /**
   * 处理鼠标移动
   */
  handleMouseMove(event) {
    if (!this.isDragging) return;
    const { x, y } = event.detail;
    this.updateDrag(x, y);
  }
  
  /**
   * 处理鼠标释放
   */
  handleMouseUp(event) {
    if (!this.isDragging) return;
    this.endDrag();
  }
  
  /**
   * 处理触摸开始
   */
  handleTouchStart(event) {
    const touch = event.detail.touches[0];
    this.startDrag(touch.clientX, touch.clientY);
  }
  
  /**
   * 处理触摸移动
   */
  handleTouchMove(event) {
    if (!this.isDragging) return;
    const touch = event.detail.touches[0];
    this.updateDrag(touch.clientX, touch.clientY);
  }
  
  /**
   * 处理触摸结束
   */
  handleTouchEnd(event) {
    if (!this.isDragging) return;
    this.endDrag();
  }
  
  /**
   * 开始拖拽
   */
  startDrag(x, y) {
    this.isDragging = true;
    this.dragStartPos = { x, y };
    this.dragCurrentPos = { x, y };
    
    // 停止物理模拟
    if (this.isRunning) {
      this.pause();
    }
    
    // 通知画板开始交互
    this.board.startInteraction(x, y);
    
    // 发送事件
    this.eventBus.emit(Events.INTERACTION_START, {
      position: { x, y }
    });
  }
  
  /**
   * 更新拖拽
   */
  updateDrag(x, y) {
    if (!this.isDragging) return;
    
    this.dragCurrentPos = { x, y };
    
    // 更新画板位置
    this.board.updateInteraction(x, y);
    
    // 获取画板当前状态用于预览
    const penPosition = this.board.getPenPosition();
    
    // 发送位置更新事件
    this.eventBus.emit(Events.PHYSICS_UPDATE, {
      position: penPosition,
      velocity: this.board.velocity,
      isDrawing: false,  // 拖拽时不绘制
      energy: this.board.getEnergy()
    });
  }
  
  /**
   * 结束拖拽
   */
  endDrag() {
    if (!this.isDragging) return;
    
    this.isDragging = false;
    
    // 结束画板交互
    this.board.endInteraction();
    
    // 清空轨迹，准备新的绘制
    this.board.trail = [];
    
    // 开始物理模拟和绘制
    this.start();
    
    // 发送事件
    this.eventBus.emit(Events.INTERACTION_END, {
      position: this.dragCurrentPos,
      velocity: this.board.velocity
    });
  }
  
  /**
   * 开始物理模拟
   */
  start() {
    if (this.isRunning && !this.isPaused) return;
    
    this.isRunning = true;
    this.isPaused = false;
    this.isDrawing = true;
    this.lastTime = performance.now();
    
    // 发送开始事件
    this.eventBus.emit(Events.DRAWING_START);
    
    // 开始动画循环
    this.animate();
  }
  
  /**
   * 停止物理模拟
   */
  stop() {
    this.isRunning = false;
    this.isDrawing = false;
    
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // 发送停止事件
    this.eventBus.emit(Events.DRAWING_STOP);
  }
  
  /**
   * 暂停
   */
  pause() {
    this.isPaused = true;
    this.eventBus.emit(Events.DRAWING_PAUSE);
  }
  
  /**
   * 恢复
   */
  resume() {
    if (!this.isRunning || !this.isPaused) return;
    
    this.isPaused = false;
    this.lastTime = performance.now();
    this.animate();
    
    this.eventBus.emit(Events.DRAWING_RESUME);
  }
  
  /**
   * 重置
   */
  reset() {
    this.stop();
    this.board.reset();
    
    // 发送重置事件
    this.eventBus.emit(Events.PHYSICS_RESET_COMPLETE);
    this.eventBus.emit(Events.RENDER_CLEAR);
  }
  
  /**
   * 动画循环
   */
  animate() {
    if (!this.isRunning || this.isPaused) return;
    
    const currentTime = performance.now();
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1); // 限制最大时间步
    
    // 应用时间缩放
    const scaledDeltaTime = deltaTime * this.config.timeScale;
    
    // 更新物理
    this.board.update(scaledDeltaTime);
    
    // 获取画笔位置
    const penPosition = this.board.getPenPosition();
    const speed = Math.sqrt(
      this.board.velocity.x * this.board.velocity.x +
      this.board.velocity.y * this.board.velocity.y
    );
    
    // 判断是否应该绘制（速度超过阈值）
    const shouldDraw = this.isDrawing && speed > this.config.drawingThreshold;
    
    // 发送更新事件
    this.eventBus.emit(Events.PHYSICS_UPDATE, {
      position: penPosition,
      velocity: this.board.velocity,
      rotation: this.board.rotation,
      isDrawing: shouldDraw,
      trail: this.board.trail,
      energy: this.board.getEnergy(),
      time: this.board.time
    });
    
    // 如果需要绘制，发送绘制点
    if (shouldDraw) {
      this.eventBus.emit(Events.RENDER_POINT, {
        x: penPosition.x,
        y: penPosition.y,
        velocity: speed,
        time: this.board.time
      });
    }
    
    // 自动停止检测
    if (this.config.autoStop && this.board.isStopped(this.config.stopThreshold)) {
      this.stop();
      this.eventBus.emit(Events.DRAWING_COMPLETE, {
        duration: this.board.time,
        trailLength: this.board.trail.length
      });
      return;
    }
    
    // 更新FPS
    this.updateFps(currentTime);
    
    this.lastTime = currentTime;
    
    // 继续动画
    this.animationId = requestAnimationFrame(() => this.animate());
  }
  
  /**
   * 更新FPS计数
   */
  updateFps(currentTime) {
    this.frameCount++;
    
    if (currentTime - this.lastFpsUpdate >= 1000) {
      this.currentFps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
      
      // 发送FPS更新
      this.eventBus.emit(Events.FPS_UPDATE, {
        fps: this.currentFps
      });
    }
  }
  
  /**
   * 获取当前状态
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isDrawing: this.isDrawing,
      isDragging: this.isDragging,
      boardState: this.board.exportState(),
      config: { ...this.config },
      currentFps: this.currentFps
    };
  }
  
  /**
   * 更新配置
   */
  updateConfig(config) {
    this.config = { ...this.config, ...config };
    
    // 更新画板参数
    if (this.board) {
      this.board.gravity = this.config.gravity;
      this.board.airDamping = this.config.airDamping;
      this.board.ropeDamping = this.config.ropeDamping;
      this.board.ropeStiffness = this.config.ropeStiffness;
      this.board.penOffset = this.config.penOffset;
    }
  }
  
  /**
   * 设置画笔偏移
   */
  setPenOffset(x, y) {
    this.config.penOffset = { x, y };
    if (this.board) {
      this.board.penOffset = { x, y };
    }
  }
  
  /**
   * 获取轨迹数据
   */
  getTrail() {
    return this.board ? this.board.trail : [];
  }
  
  /**
   * 清理模块
   */
  async cleanup() {
    this.stop();
    
    // 移除事件监听
    this.eventBus.off(Events.CANVAS_MOUSEDOWN);
    this.eventBus.off(Events.CANVAS_MOUSEMOVE);
    this.eventBus.off(Events.CANVAS_MOUSEUP);
    this.eventBus.off(Events.CANVAS_TOUCHSTART);
    this.eventBus.off(Events.CANVAS_TOUCHMOVE);
    this.eventBus.off(Events.CANVAS_TOUCHEND);
    
    await super.cleanup();
  }
}