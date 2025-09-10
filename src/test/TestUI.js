/**
 * TestUI - 简单的测试界面控制
 * 用于测试物理引擎和渲染器
 */

import eventBus from '../core/EventBus.js';
import { Events } from '../core/Events.js';
import { getPresetList, getPreset } from '../modules/physics/presets.js';

export class TestUI {
  constructor() {
    this.isDrawing = false;
    this.currentPreset = 'classic';
  }

  /**
   * 初始化UI
   */
  initialize() {
    // 确保DOM已经加载完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.doInitialize();
      });
    } else {
      this.doInitialize();
    }
  }

  /**
   * 执行实际的初始化
   */
  doInitialize() {
    this.setupButtons();
    this.setupPresets();
    this.setupControls();
    
    console.log('[TestUI] Initialized');
  }

  /**
   * 设置按钮事件
   */
  setupButtons() {
    // 启动画台按钮
    const startPlatformBtn = document.getElementById('startPlatformBtn');
    if (startPlatformBtn) {
      startPlatformBtn.addEventListener('click', () => this.startPlatform());
    }

    // 落笔按钮
    const dropPenBtn = document.getElementById('dropPenBtn');
    if (dropPenBtn) {
      dropPenBtn.addEventListener('click', () => this.dropPen());
    }

    // 抬笔按钮
    const liftPenBtn = document.getElementById('liftPenBtn');
    if (liftPenBtn) {
      liftPenBtn.addEventListener('click', () => this.liftPen());
    }

    // 开始按钮 (兼容旧接口)
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.addEventListener('click', () => this.toggleDrawing());
    }

    // 停止按钮
    const stopBtn = document.getElementById('stopBtn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.stopDrawing());
    }

    // 清除按钮
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearCanvas());
    }

    // 导出按钮
    const exportBtn = document.getElementById('exportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportImage());
    }
  }

  /**
   * 设置预设选择
   */
  setupPresets() {
    const presetGrid = document.getElementById('presetGrid');
    if (!presetGrid) return;

    const presets = getPresetList();
    presetGrid.innerHTML = '';

    presets.forEach(preset => {
      const presetItem = document.createElement('div');
      presetItem.className = 'preset-item';
      presetItem.dataset.presetId = preset.id;
      presetItem.title = preset.description;
      
      // 创建预设缩略图（使用CSS渐变模拟）
      const gradient = this.generatePresetGradient(preset);
      presetItem.style.background = gradient;
      
      // 添加名称标签
      const label = document.createElement('div');
      label.textContent = preset.name;
      label.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: rgba(0,0,0,0.7);
        color: white;
        font-size: 10px;
        text-align: center;
        padding: 2px;
      `;
      presetItem.appendChild(label);

      presetItem.addEventListener('click', () => this.selectPreset(preset.id));
      presetGrid.appendChild(presetItem);
    });

    // 默认选择第一个预设
    this.selectPreset(presets[0]?.id);
  }

  /**
   * 生成预设的渐变背景
   */
  generatePresetGradient(preset) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57'];
    const color1 = colors[Math.abs(preset.id.charCodeAt(0)) % colors.length];
    const color2 = colors[Math.abs(preset.id.charCodeAt(1) || 0) % colors.length];
    return `linear-gradient(45deg, ${color1}, ${color2})`;
  }

  /**
   * 设置控件
   */
  setupControls() {
    // 颜色选择器
    const colorPicker = document.getElementById('colorPicker');
    if (colorPicker) {
      colorPicker.addEventListener('change', (e) => {
        eventBus.emit(Events.TOOL.COLOR_CHANGE, { color: e.target.value });
      });
    }

    // 线宽控制
    const lineWidth = document.getElementById('lineWidth');
    const lineWidthDisplay = lineWidth?.nextElementSibling;
    if (lineWidth) {
      lineWidth.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (lineWidthDisplay) {
          lineWidthDisplay.textContent = value.toFixed(1);
        }
        eventBus.emit(Events.TOOL.SIZE_CHANGE, { lineWidth: value });
      });
    }

    // 透明度控制
    const opacity = document.getElementById('opacity');
    const opacityDisplay = opacity?.nextElementSibling;
    if (opacity) {
      opacity.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (opacityDisplay) {
          opacityDisplay.textContent = `${Math.round(value * 100)}%`;
        }
        eventBus.emit(Events.TOOL.SETTINGS_CHANGE, { opacity: value });
      });
    }

    // 绘画速度控制
    const drawSpeed = document.getElementById('drawSpeed');
    const drawSpeedDisplay = drawSpeed?.nextElementSibling;
    if (drawSpeed) {
      drawSpeed.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (drawSpeedDisplay) {
          drawSpeedDisplay.textContent = `${value}x`;
        }
        eventBus.emit('physics:speed:change', { speed: value });
      });
    }

    // 轨迹密度控制
    const trailLength = document.getElementById('trailLength');
    const trailLengthDisplay = trailLength?.nextElementSibling;
    if (trailLength) {
      trailLength.addEventListener('input', (e) => {
        const value = parseInt(e.target.value);
        if (trailLengthDisplay) {
          trailLengthDisplay.textContent = value;
        }
        eventBus.emit('physics:trail:change', { density: value });
      });
    }

    // 平滑线条开关
    const smoothLines = document.getElementById('smoothLines');
    if (smoothLines) {
      smoothLines.addEventListener('change', (e) => {
        eventBus.emit('renderer:smooth:change', { smooth: e.target.checked });
      });
    }
  }

  /**
   * 选择预设
   */
  selectPreset(presetId) {
    // 移除之前的选中状态
    document.querySelectorAll('.preset-item').forEach(item => {
      item.classList.remove('active');
    });

    // 添加新的选中状态
    const presetItem = document.querySelector(`[data-preset-id="${presetId}"]`);
    if (presetItem) {
      presetItem.classList.add('active');
    }

    // 应用预设
    const preset = getPreset(presetId);
    if (preset) {
      this.currentPreset = presetId;
      eventBus.emit(Events.PRESET.APPLIED, preset);
      console.log(`[TestUI] Applied preset: ${preset.name}`);
    }
  }

  /**
   * 切换绘制状态
   */
  toggleDrawing() {
    if (this.isDrawing) {
      this.pauseDrawing();
    } else {
      this.startDrawing();
    }
  }

  /**
   * 开始绘制
   */
  startDrawing() {
    this.isDrawing = true;
    
    // 更新按钮状态
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.innerHTML = '<span class="icon">⏸</span> 暂停';
      startBtn.className = 'btn btn-secondary';
    }

    // 更新状态指示器
    this.updateStatus('绘制中...', 'drawing');

    eventBus.emit(Events.CANVAS.DRAWING_START);
    console.log('[TestUI] Drawing started');
  }

  /**
   * 暂停绘制
   */
  pauseDrawing() {
    this.isDrawing = false;
    
    // 更新按钮状态
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.innerHTML = '<span class="icon">▶</span> 继续';
      startBtn.className = 'btn btn-primary';
    }

    // 更新状态指示器
    this.updateStatus('已暂停', 'paused');

    eventBus.emit(Events.CANVAS.DRAWING_PAUSE);
    console.log('[TestUI] Drawing paused');
  }

  /**
   * 停止绘制
   */
  stopDrawing() {
    this.isDrawing = false;
    
    // 更新按钮状态
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.innerHTML = '<span class="icon">▶</span> 开始';
      startBtn.className = 'btn btn-primary';
    }

    // 重置画台控制按钮状态
    this.updatePlatformButtons(false, false);
    
    // 更新画台状态显示
    this.updatePlatformStatus('停止', false);

    // 更新状态指示器
    this.updateStatus('已停止', 'stopped');

    // 触发停止事件
    eventBus.emit(Events.CANVAS.DRAWING_STOP);
    eventBus.emit('platform:stop');
    console.log('[TestUI] Drawing stopped');
  }

  /**
   * 清除画布
   */
  clearCanvas() {
    this.stopDrawing();
    eventBus.emit(Events.CANVAS.CLEAR);
    
    // 更新状态指示器
    this.updateStatus('已清除', 'cleared');
    
    console.log('[TestUI] Canvas cleared');
  }

  /**
   * 导出图像
   */
  exportImage() {
    eventBus.emit(Events.EXPORT.START, {
      format: 'png',
      quality: 0.95
    });
    console.log('[TestUI] Export requested');
  }

  /**
   * 启动画台 (预览模式)
   */
  startPlatform() {
    // 触发画台启动事件
    eventBus.emit('platform:start');
    
    // 更新按钮状态
    this.updatePlatformButtons(true, false);
    
    // 更新状态显示
    this.updatePlatformStatus('运行', false);
    
    console.log('[TestUI] Platform started');
  }

  /**
   * 落笔开始绘画
   */
  dropPen() {
    // 触发落笔事件
    eventBus.emit('pen:drop');
    
    // 更新按钮状态
    this.updatePlatformButtons(true, true);
    
    // 更新状态显示
    this.updatePlatformStatus('运行', true);
    
    console.log('[TestUI] Pen dropped');
  }

  /**
   * 抬笔停止绘画
   */
  liftPen() {
    // 触发抬笔事件
    eventBus.emit('pen:lift');
    
    // 更新按钮状态
    this.updatePlatformButtons(true, false);
    
    // 更新状态显示  
    this.updatePlatformStatus('运行', false);
    
    console.log('[TestUI] Pen lifted');
  }

  /**
   * 更新画台控制按钮状态
   */
  updatePlatformButtons(platformRunning, penDrawing) {
    const startPlatformBtn = document.getElementById('startPlatformBtn');
    const dropPenBtn = document.getElementById('dropPenBtn');
    const liftPenBtn = document.getElementById('liftPenBtn');
    const stopBtn = document.getElementById('stopBtn');

    if (startPlatformBtn) {
      startPlatformBtn.disabled = platformRunning;
    }

    if (dropPenBtn) {
      dropPenBtn.disabled = !platformRunning || penDrawing;
    }

    if (liftPenBtn) {
      liftPenBtn.disabled = !platformRunning || !penDrawing;
    }

    if (stopBtn) {
      stopBtn.disabled = !platformRunning;
    }
  }

  /**
   * 更新画台状态显示
   */
  updatePlatformStatus(platformStatus, penDrawing) {
    const platformStatusElement = document.getElementById('platformStatus');
    const penStatusElement = document.getElementById('penStatus');

    if (platformStatusElement) {
      platformStatusElement.textContent = platformStatus;
      platformStatusElement.className = platformStatus === '运行' ? 'platform-status running' : 'platform-status stopped';
    }

    if (penStatusElement) {
      penStatusElement.textContent = penDrawing ? '绘画' : '悬停';
      penStatusElement.className = penDrawing ? 'pen-status drawing' : 'pen-status hovering';
    }

    // 更新整个状态指示器的样式
    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator';
      if (platformStatus === '运行') {
        statusIndicator.classList.add('platform-running');
      }
      if (penDrawing) {
        statusIndicator.classList.add('pen-drawing');
      }
    }
  }

  /**
   * 更新状态指示器
   */
  updateStatus(text, status = 'ready') {
    const statusText = document.querySelector('.status-text');
    if (statusText) {
      statusText.textContent = text;
    }

    const statusIndicator = document.getElementById('statusIndicator');
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${status}`;
    }
  }

  /**
   * 更新FPS显示
   */
  updateFPS(fps) {
    const fpsCounter = document.getElementById('fpsCounter');
    if (fpsCounter) {
      fpsCounter.textContent = `FPS: ${Math.round(fps)}`;
    }
  }

  /**
   * 更新统计信息
   */
  updateStats(data) {
    const pointCount = document.getElementById('pointCount');
    if (pointCount) {
      pointCount.textContent = data.pointCount || 0;
    }

    const runTime = document.getElementById('runTime');
    if (runTime && data.runTime) {
      runTime.textContent = `${data.runTime.toFixed(1)}s`;
    }

    const pendulumCount = document.getElementById('pendulumCount');
    if (pendulumCount) {
      pendulumCount.textContent = data.pendulumCount || 0;
    }
  }

  /**
   * 更新摆锤状态显示
   */
  updatePendulumStatus(pendulums) {
    const xPendulums = document.getElementById('xPendulums');
    const yPendulums = document.getElementById('yPendulums');
    
    if (!xPendulums || !yPendulums) return;
    
    // 清空现有内容
    xPendulums.innerHTML = '';
    yPendulums.innerHTML = '';
    
    pendulums.forEach(pendulum => {
      const item = this.createPendulumStatusItem(pendulum);
      
      if (pendulum.axis === 'x') {
        xPendulums.appendChild(item);
      } else if (pendulum.axis === 'y') {
        yPendulums.appendChild(item);
      }
    });
  }

  /**
   * 创建摆锤状态项
   */
  createPendulumStatusItem(pendulum) {
    const item = document.createElement('div');
    item.className = 'pendulum-item';
    
    const info = document.createElement('div');
    info.className = 'pendulum-info';
    
    const freq = document.createElement('div');
    freq.className = 'pendulum-freq';
    freq.textContent = `${pendulum.frequency.toFixed(1)} Hz`;
    
    const amp = document.createElement('div');
    amp.className = 'pendulum-amp';
    amp.textContent = `幅度: ${Math.round(pendulum.amplitude)}px`;
    
    const indicator = document.createElement('div');
    indicator.className = 'pendulum-indicator';
    indicator.style.animationDuration = `${2 / pendulum.frequency}s`;
    
    info.appendChild(freq);
    info.appendChild(amp);
    item.appendChild(info);
    item.appendChild(indicator);
    
    return item;
  }
}

// 导出单例
export default new TestUI();