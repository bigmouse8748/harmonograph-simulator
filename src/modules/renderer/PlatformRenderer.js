/**
 * PlatformRenderer - 画板平台渲染器
 * 模拟harmonograph的物理画板运动
 */

import { BaseModule } from '../../core/BaseModule.js';
import { Events } from '../../core/Events.js';

export class PlatformRenderer extends BaseModule {
  constructor(dependencies) {
    super(dependencies);
    
    this.canvas = null;
    this.ctx = null;
    
    // 画板配置
    this.config = {
      platformWidth: 200,
      platformHeight: 150,
      platformThickness: 8,
      penSize: 4,
      scale: 0.8,
      perspective: 0.6,  // 透视强度
      shadowBlur: 15
    };
    
    // 画板状态
    this.platformState = {
      tiltX: 0,      // X轴倾斜角度
      tiltY: 0,      // Y轴倾斜角度
      rotation: 0,   // 旋转角度
      penX: 0,       // 笔的X位置
      penY: 0,       // 笔的Y位置
      isDrawing: false
    };
    
    // 空闲动画
    this.idleAnimation = {
      time: 0,
      amplitude: 0.1,    // 增加振幅
      frequency: 1.0,    // 增加频率
      animationId: null
    };
    
    this.isDestroyed = false;
    
    // 颜色和样式
    this.colors = {
      platform: '#E5E7EB',
      platformEdge: '#9CA3AF',
      platformShadow: 'rgba(0, 0, 0, 0.3)',
      pen: '#EF4444',
      penShadow: 'rgba(239, 68, 68, 0.5)',
      surface: '#F9FAFB',
      grid: '#E5E7EB'
    };
  }

  getName() {
    return 'PlatformRenderer';
  }

  /**
   * 初始化渲染器
   */
  async initialize(config = {}) {
    await super.initialize(config);
    
    this.canvas = document.getElementById('platformCanvas');
    if (!this.canvas) {
      console.error('[PlatformRenderer] Platform canvas element not found');
      return;
    }
    
    this.ctx = this.canvas.getContext('2d');
    this.setupCanvas();
    this.setupEventListeners();
    
    // 初始渲染
    this.render();
    
    // 开始空闲动画
    this.startIdleAnimation();
    
    console.log('[PlatformRenderer] Initialized');
  }

  /**
   * 设置画布
   */
  setupCanvas() {
    const container = this.canvas.parentElement;
    if (container) {
      this.canvas.width = container.clientWidth || 300;
      this.canvas.height = container.clientHeight || 200;
    } else {
      this.canvas.width = 300;
      this.canvas.height = 200;
    }
    
    // 设置画布中心
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height / 2;
  }

  /**
   * 设置事件监听
   */
  setupEventListeners() {
    // 监听物理引擎更新
    this.subscribe(Events.PHYSICS.UPDATE, (data) => {
      if (data.position) {
        // 更新画板状态，包括 platformState 中的 isDrawing 信息
        if (data.platformState) {
          this.platformState.isDrawing = data.platformState.isDrawing;
        }
        this.updatePlatform(data.position, data.state);
      }
    });
    
    // 监听绘制状态 (兼容旧接口)
    this.subscribe(Events.CANVAS.DRAWING_START, () => {
      this.platformState.isDrawing = true;
    });
    
    this.subscribe(Events.CANVAS.DRAWING_STOP, () => {
      this.platformState.isDrawing = false;
    });
    
    // 监听新的画台控制事件
    this.subscribe('platform:start', () => {
      console.log('[PlatformRenderer] Platform started');
    });
    
    this.subscribe('platform:stop', () => {
      this.platformState.isDrawing = false;
      console.log('[PlatformRenderer] Platform stopped');
    });
    
    this.subscribe('pen:drop', () => {
      this.platformState.isDrawing = true;
      this.createPenDropEffect();
      console.log('[PlatformRenderer] Pen dropped');
    });
    
    this.subscribe('pen:lift', () => {
      this.platformState.isDrawing = false;
      this.createPenLiftEffect();
      console.log('[PlatformRenderer] Pen lifted');
    });
  }

  /**
   * 更新画板状态
   */
  updatePlatform(position, systemState) {
    // 根据摆锤运动计算画板倾斜
    const maxTilt = Math.PI / 12; // 最大倾斜角度 (15度)
    
    // 使用摆锤位置计算倾斜角度
    this.platformState.tiltX = (position.y / 200) * maxTilt;
    this.platformState.tiltY = (position.x / 200) * maxTilt;
    
    // 计算笔在画板上的相对位置 (缩放到画板尺寸)
    const scaleX = this.config.platformWidth / 400;  // 假设摆锤范围是±200
    const scaleY = this.config.platformHeight / 300; // 假设摆锤范围是±150
    
    this.platformState.penX = position.x * scaleX;
    this.platformState.penY = position.y * scaleY;
    
    // 限制笔的位置在画板范围内
    this.platformState.penX = Math.max(-this.config.platformWidth/2, 
      Math.min(this.config.platformWidth/2, this.platformState.penX));
    this.platformState.penY = Math.max(-this.config.platformHeight/2, 
      Math.min(this.config.platformHeight/2, this.platformState.penY));
    
    // 渲染画板
    this.render();
  }

  /**
   * 开始空闲动画 (增强版)
   */
  startIdleAnimation() {
    const animate = () => {
      if (this.isDestroyed) return;
      
      if (!this.platformState.isDrawing) {
        this.idleAnimation.time += 0.016; // 假设60fps
        
        // 多层次的呼吸动画
        const breathe1 = Math.sin(this.idleAnimation.time * this.idleAnimation.frequency) * this.idleAnimation.amplitude;
        const breathe2 = Math.sin(this.idleAnimation.time * this.idleAnimation.frequency * 0.7) * this.idleAnimation.amplitude * 0.5;
        const breathe3 = Math.cos(this.idleAnimation.time * this.idleAnimation.frequency * 1.3) * this.idleAnimation.amplitude * 0.3;
        
        this.platformState.tiltX = breathe1 + breathe3;
        this.platformState.tiltY = (breathe1 + breathe2) * 0.8; // 不同的组合
        
        // 添加微妙的颜色变化
        this.updateIdleColors();
        
        this.render();
      }
      
      this.idleAnimation.animationId = requestAnimationFrame(animate);
    };
    
    this.idleAnimation.animationId = requestAnimationFrame(animate);
  }

  /**
   * 更新空闲状态的颜色
   */
  updateIdleColors() {
    const intensity = Math.sin(this.idleAnimation.time * 2) * 0.1 + 0.9; // 0.8 到 1.0 之间
    
    // 微妙地调整颜色饱和度
    this.colors.platform = `hsl(210, ${Math.round(15 * intensity)}%, ${Math.round(95 * intensity)}%)`;
    this.colors.platformEdge = `hsl(210, ${Math.round(25 * intensity)}%, ${Math.round(80 * intensity)}%)`;
  }

  /**
   * 创建落笔特效
   */
  createPenDropEffect() {
    if (!this.ctx) return;
    
    const penX = this.centerX + this.platformState.penX;
    const penY = this.centerY + this.platformState.penY;
    
    // 创建涟漪效果
    let rippleRadius = 0;
    const maxRadius = 30;
    const animate = () => {
      if (rippleRadius >= maxRadius) return;
      
      this.ctx.save();
      this.ctx.strokeStyle = `rgba(74, 144, 226, ${1 - rippleRadius / maxRadius})`;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(penX, penY, rippleRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
      
      rippleRadius += 2;
      
      setTimeout(() => {
        requestAnimationFrame(animate);
      }, 50);
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 创建抬笔特效
   */
  createPenLiftEffect() {
    if (!this.ctx) return;
    
    const penX = this.centerX + this.platformState.penX;
    const penY = this.centerY + this.platformState.penY;
    
    // 创建向上扩散的光点
    const particles = [];
    for (let i = 0; i < 8; i++) {
      particles.push({
        x: penX,
        y: penY,
        vx: (Math.random() - 0.5) * 4,
        vy: -Math.random() * 3 - 1,
        life: 1,
        decay: 0.05
      });
    }
    
    const animate = () => {
      this.ctx.save();
      
      particles.forEach((particle, index) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= particle.decay;
        
        if (particle.life > 0) {
          this.ctx.fillStyle = `rgba(144, 202, 249, ${particle.life})`;
          this.ctx.beginPath();
          this.ctx.arc(particle.x, particle.y, 2 * particle.life, 0, Math.PI * 2);
          this.ctx.fill();
        } else {
          particles.splice(index, 1);
        }
      });
      
      this.ctx.restore();
      
      if (particles.length > 0) {
        setTimeout(() => {
          requestAnimationFrame(animate);
        }, 30);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * 渲染画板
   */
  render() {
    if (!this.ctx) return;
    
    // 清除画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 保存上下文
    this.ctx.save();
    
    // 移动到中心
    this.ctx.translate(this.centerX, this.centerY);
    
    // 绘制阴影
    this.drawShadow();
    
    // 绘制画板
    this.drawPlatform();
    
    // 绘制笔 (always show pen, but at different heights)
    this.drawPen();
    
    // 绘制支撑结构
    this.drawSupports();
    
    // 恢复上下文
    this.ctx.restore();
  }

  /**
   * 绘制阴影
   */
  drawShadow() {
    const shadowOffsetX = this.platformState.tiltY * 20;
    const shadowOffsetY = Math.abs(this.platformState.tiltX) * 10 + 15;
    
    this.ctx.save();
    this.ctx.translate(shadowOffsetX, shadowOffsetY);
    this.ctx.scale(1, 0.3); // 压扁阴影
    
    this.ctx.fillStyle = this.colors.platformShadow;
    this.ctx.filter = `blur(${this.config.shadowBlur}px)`;
    
    this.drawPlatformShape();
    
    this.ctx.restore();
  }

  /**
   * 绘制画板
   */
  drawPlatform() {
    this.ctx.save();
    
    // 应用3D变换
    this.apply3DTransform();
    
    // 绘制画板表面
    this.ctx.fillStyle = this.colors.platform;
    this.ctx.strokeStyle = this.colors.platformEdge;
    this.ctx.lineWidth = 2;
    
    this.drawPlatformShape();
    this.ctx.fill();
    this.ctx.stroke();
    
    // 绘制网格
    this.drawGrid();
    
    this.ctx.restore();
  }

  /**
   * 绘制画板形状
   */
  drawPlatformShape() {
    const w = this.config.platformWidth;
    const h = this.config.platformHeight;
    const radius = 8;
    
    this.ctx.beginPath();
    
    // 手动绘制圆角矩形
    const x = -w/2;
    const y = -h/2;
    
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + w - radius, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    this.ctx.lineTo(x + w, y + h - radius);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    this.ctx.lineTo(x + radius, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();
  }

  /**
   * 应用3D变换
   */
  apply3DTransform() {
    // 简单的伪3D变换
    const scaleX = Math.cos(this.platformState.tiltY) * this.config.scale;
    const scaleY = Math.cos(this.platformState.tiltX) * this.config.scale;
    const skewX = Math.sin(this.platformState.tiltY) * this.config.perspective;
    const skewY = Math.sin(this.platformState.tiltX) * this.config.perspective;
    
    this.ctx.transform(scaleX, skewY, skewX, scaleY, 0, 0);
  }

  /**
   * 绘制网格
   */
  drawGrid() {
    const w = this.config.platformWidth;
    const h = this.config.platformHeight;
    const gridSize = 20;
    
    this.ctx.strokeStyle = this.colors.grid;
    this.ctx.lineWidth = 0.5;
    this.ctx.globalAlpha = 0.5;
    
    // 竖直线
    for (let x = -w/2; x <= w/2; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, -h/2);
      this.ctx.lineTo(x, h/2);
      this.ctx.stroke();
    }
    
    // 水平线
    for (let y = -h/2; y <= h/2; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(-w/2, y);
      this.ctx.lineTo(w/2, y);
      this.ctx.stroke();
    }
    
    this.ctx.globalAlpha = 1;
  }

  /**
   * 绘制笔
   */
  drawPen() {
    const penX = this.platformState.penX;
    const penY = this.platformState.penY;
    
    // 笔的高度偏移 - 绘画时贴近画板，悬停时升高
    const penHeightOffset = this.platformState.isDrawing ? 0 : -15;
    const shadowOffset = this.platformState.isDrawing ? 2 : 8;
    const shadowBlur = this.platformState.isDrawing ? 3 : 6;
    const shadowOpacity = this.platformState.isDrawing ? 0.6 : 0.3;
    
    // 笔的阴影 (根据高度调整)
    this.ctx.save();
    this.ctx.translate(penX + shadowOffset, penY + shadowOffset);
    this.ctx.fillStyle = this.colors.penShadow.replace('0.6', shadowOpacity.toString());
    this.ctx.filter = `blur(${shadowBlur}px)`;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.config.penSize + 1, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
    
    // 笔本体 (根据状态调整颜色和大小)
    this.ctx.save();
    this.ctx.translate(penX, penY + penHeightOffset);
    
    // 笔的主体 - 绘画时深色，悬停时稍浅
    const penColor = this.platformState.isDrawing ? this.colors.pen : '#4A90E2';
    const penSize = this.platformState.isDrawing ? this.config.penSize : this.config.penSize * 0.8;
    
    this.ctx.fillStyle = penColor;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, penSize, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 笔尖高光
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(-1, -1, penSize * 0.3, 0, Math.PI * 2);
    this.ctx.fill();
    
    // 如果是悬停状态，添加发光效果
    if (!this.platformState.isDrawing) {
      this.ctx.shadowColor = '#4A90E2';
      this.ctx.shadowBlur = 10;
      this.ctx.fillStyle = 'rgba(74, 144, 226, 0.2)';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, penSize * 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    
    this.ctx.restore();
  }

  /**
   * 绘制支撑结构
   */
  drawSupports() {
    const supportHeight = 40;
    const supportWidth = 6;
    
    this.ctx.strokeStyle = '#6B7280';
    this.ctx.lineWidth = supportWidth;
    this.ctx.lineCap = 'round';
    
    // 绘制支撑杆
    const corners = [
      [-this.config.platformWidth/3, -this.config.platformHeight/3],
      [this.config.platformWidth/3, -this.config.platformHeight/3],
      [-this.config.platformWidth/3, this.config.platformHeight/3],
      [this.config.platformWidth/3, this.config.platformHeight/3]
    ];
    
    corners.forEach(([x, y]) => {
      this.ctx.save();
      
      // 简单的透视变换
      const perspective = this.config.perspective;
      const tiltOffset = this.platformState.tiltX * perspective * 20;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + tiltOffset, y + supportHeight);
      this.ctx.stroke();
      
      this.ctx.restore();
    });
  }

  /**
   * 设置画板配置
   */
  setPlatformConfig(config) {
    this.config = { ...this.config, ...config };
  }

  /**
   * 销毁渲染器
   */
  async destroy() {
    this.isDestroyed = true;
    
    // 停止动画
    if (this.idleAnimation.animationId) {
      cancelAnimationFrame(this.idleAnimation.animationId);
      this.idleAnimation.animationId = null;
    }
    
    this.canvas = null;
    this.ctx = null;
    await super.destroy();
  }
}

export default PlatformRenderer;