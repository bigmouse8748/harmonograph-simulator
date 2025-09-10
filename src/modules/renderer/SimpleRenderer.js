/**
 * SimpleRenderer - 简单的Canvas渲染器
 * 用于测试和显示物理引擎的输出
 */

import { BaseModule } from '../../core/BaseModule.js';
import { Events } from '../../core/Events.js';

export class SimpleRenderer extends BaseModule {
  constructor(dependencies) {
    super(dependencies);
    
    this.canvas = null;
    this.ctx = null;
    this.isDrawing = false;
    this.lastPosition = null;
    
    // 渲染配置
    this.config = {
      lineWidth: 2,
      strokeStyle: '#2563eb',
      globalAlpha: 0.8,
      lineCap: 'round',
      lineJoin: 'round',
      clearOnStart: true,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      smoothLines: true,
      trailDensity: 5
    };
    
    // 轨迹点
    this.points = [];           // 真实绘画点
    this.previewPoints = [];    // 预览点
    this.maxPoints = 50000;
    this.maxPreviewPoints = 500; // 预览点数量限制
  }

  getName() {
    return 'SimpleRenderer';
  }

  /**
   * 初始化渲染器
   */
  async initialize(config = {}) {
    await super.initialize(config);
    
    // 获取或创建canvas
    this.canvas = document.getElementById('mainCanvas');
    if (!this.canvas) {
      console.error('[SimpleRenderer] Canvas element not found');
      return;
    }
    
    console.log('[SimpleRenderer] Canvas element found:', this.canvas.width, 'x', this.canvas.height);
    
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.setupEventListeners();
    
    // 初始化画布背景
    this.clear();
    
    console.log('[SimpleRenderer] Initialized');
  }

  /**
   * 设置画布
   */
  setupCanvas() {
    // 设置固定的画布大小
    this.canvas.width = 800;
    this.canvas.height = 600;
    
    console.log('[SimpleRenderer] Canvas size set to:', this.canvas.width, 'x', this.canvas.height);
    
    // 设置默认样式
    this.applyRenderConfig();
    this.clear();
  }

  /**
   * 应用渲染配置
   */
  applyRenderConfig() {
    if (!this.ctx) return;
    
    this.ctx.lineWidth = this.config.lineWidth;
    this.ctx.strokeStyle = this.config.strokeStyle;
    this.ctx.globalAlpha = this.config.globalAlpha;
    this.ctx.lineCap = this.config.lineCap;
    this.ctx.lineJoin = this.config.lineJoin;
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听物理引擎更新
    this.subscribe(Events.PHYSICS.UPDATE, (data) => {
      if (data.position && data.platformState) {
        if (data.platformState.isDrawing) {
          // 真正绘画模式
          this.drawPoint(data.position);
        } else if (data.platformState.isRunning) {
          // 预览模式 - 显示轨迹预览
          this.showPreview(data.position);
        }
      }
    });
    
    // 监听绘制控制事件
    this.subscribe(Events.CANVAS.DRAWING_START, () => this.startDrawing());
    this.subscribe(Events.CANVAS.DRAWING_STOP, () => this.stopDrawing());
    this.subscribe(Events.CANVAS.CLEAR, () => this.clear());
    
    // 监听窗口大小变化
    this.subscribe(Events.CANVAS.RESIZE, () => this.handleResize());
  }

  /**
   * 开始绘制
   */
  startDrawing() {
    this.isDrawing = true;
    this.lastPosition = null;
    this.points = [];
    
    // 总是清除画布以确保背景正确
    this.clear();
    
    console.log('[SimpleRenderer] ✅ Drawing started, isDrawing:', this.isDrawing);
  }

  /**
   * 停止绘制
   */
  stopDrawing() {
    this.isDrawing = false;
    this.lastPosition = null;
    console.log('[SimpleRenderer] Drawing stopped');
  }

  /**
   * 绘制点
   */
  drawPoint(position) {
    if (!this.ctx) return;
    
    if (!this.isDrawing) {
      console.log('[SimpleRenderer] Not drawing, ignoring point');
      return;
    }
    
    // 转换坐标到画布中心
    const canvasX = this.canvas.width / 2 + position.x;
    const canvasY = this.canvas.height / 2 + position.y;
    
    const transformedPosition = { x: canvasX, y: canvasY };
    
    // 首次绘制时输出调试信息
    if (this.points.length === 0) {
      console.log('[SimpleRenderer] First draw point:', position, '→', transformedPosition);
    }
    
    // 添加到点集合
    this.points.push(transformedPosition);
    if (this.points.length > this.maxPoints) {
      this.points.shift();
    }
    
    // 平滑线条绘制
    if (this.config.smoothLines && this.points.length >= 3) {
      this.drawSmoothLine();
    } else if (this.lastPosition) {
      // 普通线条绘制
      this.ctx.beginPath();
      this.ctx.moveTo(this.lastPosition.x, this.lastPosition.y);
      this.ctx.lineTo(transformedPosition.x, transformedPosition.y);
      this.ctx.stroke();
    }
    
    this.lastPosition = { ...transformedPosition };
  }

  /**
   * 绘制平滑线条 (增强版)
   */
  drawSmoothLine() {
    const len = this.points.length;
    if (len < 4) return;
    
    // 保存上下文
    this.ctx.save();
    
    // 添加微妙的阴影效果
    this.ctx.shadowColor = this.config.strokeStyle + '30';
    this.ctx.shadowBlur = 2;
    this.ctx.shadowOffsetX = 0.5;
    this.ctx.shadowOffsetY = 0.5;
    
    this.ctx.beginPath();
    
    // 使用贝塞尔曲线平滑连接点
    const p0 = this.points[len - 4];
    const p1 = this.points[len - 3];
    const p2 = this.points[len - 2];
    const p3 = this.points[len - 1];
    
    // 计算控制点
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    
    this.ctx.moveTo(p1.x, p1.y);
    this.ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
    this.ctx.stroke();
    
    // 恢复上下文
    this.ctx.restore();
  }

  /**
   * 绘制整个轨迹
   */
  drawTrajectory(points) {
    if (!this.ctx || points.length < 2) return;
    
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    
    this.ctx.stroke();
  }

  /**
   * 显示轨迹预览 (预览模式)
   */
  showPreview(position) {
    if (!this.ctx) return;
    
    // 转换坐标到画布中心
    const canvasX = this.canvas.width / 2 + position.x;
    const canvasY = this.canvas.height / 2 + position.y;
    
    const transformedPosition = { x: canvasX, y: canvasY };
    
    // 添加到预览点集合
    this.previewPoints.push(transformedPosition);
    
    // 限制预览点数量，保持流畅性能
    if (this.previewPoints.length > this.maxPreviewPoints) {
      this.previewPoints.shift();
    }
    
    // 每隔几个点重绘预览轨迹
    if (this.previewPoints.length % this.config.trailDensity === 0) {
      this.redrawPreview();
    }
  }

  /**
   * 重绘预览轨迹
   */
  redrawPreview() {
    if (!this.ctx || this.previewPoints.length < 2) return;
    
    // 清除画布并重绘背景
    this.clear();
    
    // 保存当前样式
    this.ctx.save();
    
    // 设置预览样式 - 渐变效果显示
    const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    gradient.addColorStop(0, this.config.strokeStyle + '40'); // 淡开始
    gradient.addColorStop(0.5, this.config.strokeStyle + '80'); // 中间稍强
    gradient.addColorStop(1, this.config.strokeStyle + '20'); // 淡结束
    
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = this.config.lineWidth * 0.8; // 稍细一些
    this.ctx.globalAlpha = 0.6; // 半透明但可见
    this.ctx.lineCap = this.config.lineCap;
    this.ctx.lineJoin = this.config.lineJoin;
    this.ctx.shadowColor = this.config.strokeStyle;
    this.ctx.shadowBlur = 3;
    
    // 绘制预览轨迹
    this.ctx.beginPath();
    this.ctx.moveTo(this.previewPoints[0].x, this.previewPoints[0].y);
    
    for (let i = 1; i < this.previewPoints.length; i++) {
      this.ctx.lineTo(this.previewPoints[i].x, this.previewPoints[i].y);
    }
    
    this.ctx.stroke();
    
    // 恢复样式
    this.ctx.restore();
  }

  /**
   * 清除画布
   */
  clear() {
    if (!this.ctx) {
      console.error('[SimpleRenderer] No canvas context for clear()');
      return;
    }
    
    console.log('[SimpleRenderer] Clearing canvas with size:', this.canvas.width, 'x', this.canvas.height);
    console.log('[SimpleRenderer] Background color:', this.config.backgroundColor);
    
    // 先清除整个画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 然后填充增强背景
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'source-over';
    
    // 基础背景色
    this.ctx.fillStyle = this.config.backgroundColor;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 添加微妙的放射渐变效果
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / 2, this.canvas.height / 2, 0,
      this.canvas.width / 2, this.canvas.height / 2, Math.max(this.canvas.width, this.canvas.height) / 2
    );
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(200, 200, 200, 0.05)');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 添加细微的纹理图案
    this.drawCanvasTexture();
    
    this.ctx.restore();
    
    this.points = [];
    this.previewPoints = [];
    this.lastPosition = null;
    
    console.log('[SimpleRenderer] Canvas cleared successfully');
  }

  /**
   * 绘制画布纹理
   */
  drawCanvasTexture() {
    if (!this.ctx) return;
    
    this.ctx.save();
    
    // 创建细微的网格图案
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    this.ctx.lineWidth = 0.5;
    this.ctx.globalCompositeOperation = 'multiply';
    
    const gridSize = 20;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // 绘制细微的网格线
    this.ctx.beginPath();
    for (let x = 0; x <= width; x += gridSize) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    for (let y = 0; y <= height; y += gridSize) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();
    
    // 添加中心十字线 (更明显一些)
    this.ctx.strokeStyle = 'rgba(100, 100, 100, 0.15)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    
    this.ctx.beginPath();
    // 垂直中心线
    this.ctx.moveTo(width / 2, 0);
    this.ctx.lineTo(width / 2, height);
    // 水平中心线
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();
    
    // 重置虚线样式
    this.ctx.setLineDash([]);
    
    this.ctx.restore();
  }

  /**
   * 处理窗口大小变化
   */
  handleResize() {
    const oldPoints = [...this.points];
    this.setupCanvas();
    
    // 重绘轨迹
    if (oldPoints.length > 0) {
      this.drawTrajectory(oldPoints);
    }
  }

  /**
   * 设置画笔样式
   */
  setStyle(style) {
    this.config = { ...this.config, ...style };
    this.applyRenderConfig();
    
    this.emit(Events.RENDERER.STYLE_CHANGE, this.config);
  }

  /**
   * 获取画布快照
   */
  getSnapshot() {
    return this.canvas.toDataURL('image/png');
  }

  /**
   * 导出为Blob
   */
  async exportAsBlob(format = 'image/png', quality = 0.95) {
    return new Promise((resolve) => {
      this.canvas.toBlob(resolve, format, quality);
    });
  }

  /**
   * 销毁渲染器
   */
  async destroy() {
    this.isDrawing = false;
    this.points = [];
    this.lastPosition = null;
    this.canvas = null;
    this.ctx = null;
    
    await super.destroy();
  }
}

export default SimpleRenderer;