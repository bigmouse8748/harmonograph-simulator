/**
 * PendulumSystem - 多摆系统管理器
 * 管理多个摆锤的协同运动和轨迹计算
 */

import { Pendulum } from './Pendulum.js';

export class PendulumSystem {
  constructor(config = {}) {
    this.pendulums = new Map();
    this.xPendulums = [];  // X轴摆锤
    this.yPendulums = [];  // Y轴摆锤
    
    // 系统配置
    this.config = {
      maxPendulums: config.maxPendulums || 8,
      coordinateSystem: config.coordinateSystem || 'cartesian', // cartesian/polar
      centerX: config.centerX || 0,
      centerY: config.centerY || 0,
      scale: config.scale || 1,
      rotation: config.rotation || 0  // 系统旋转角度
    };
    
    // 轨迹历史
    this.trajectory = [];
    this.maxTrajectoryPoints = config.maxTrajectoryPoints || 10000;
    
    // 状态
    this.isRunning = false;
    this.currentPosition = { x: 0, y: 0 };
    this.previousPosition = null;
    this.totalDistance = 0;
    this.pointCount = 0;
  }

  /**
   * 添加摆锤
   */
  addPendulum(params) {
    if (this.pendulums.size >= this.config.maxPendulums) {
      throw new Error(`Maximum number of pendulums (${this.config.maxPendulums}) reached`);
    }

    const pendulum = new Pendulum(params);
    this.pendulums.set(pendulum.id, pendulum);
    
    // 分类到对应轴
    if (pendulum.axis === 'x') {
      this.xPendulums.push(pendulum);
    } else if (pendulum.axis === 'y') {
      this.yPendulums.push(pendulum);
    }
    
    return pendulum.id;
  }

  /**
   * 移除摆锤
   */
  removePendulum(id) {
    const pendulum = this.pendulums.get(id);
    if (!pendulum) return false;
    
    // 从轴数组中移除
    if (pendulum.axis === 'x') {
      const index = this.xPendulums.indexOf(pendulum);
      if (index > -1) this.xPendulums.splice(index, 1);
    } else if (pendulum.axis === 'y') {
      const index = this.yPendulums.indexOf(pendulum);
      if (index > -1) this.yPendulums.splice(index, 1);
    }
    
    this.pendulums.delete(id);
    return true;
  }

  /**
   * 获取摆锤
   */
  getPendulum(id) {
    return this.pendulums.get(id);
  }

  /**
   * 获取所有摆锤
   */
  getAllPendulums() {
    return Array.from(this.pendulums.values());
  }

  /**
   * 更新系统
   * @param {number} deltaTime - 时间步长(秒)
   */
  update(deltaTime) {
    if (!this.isRunning) return null;
    
    // 更新所有摆锤
    this.pendulums.forEach(pendulum => {
      pendulum.update(deltaTime);
    });
    
    // 计算合成位置
    const position = this.calculatePosition();
    
    // 记录轨迹
    this.recordTrajectory(position);
    
    // 更新统计
    this.updateStatistics(position);
    
    this.currentPosition = position;
    return position;
  }

  /**
   * 计算合成位置
   */
  calculatePosition() {
    let x = this.config.centerX;
    let y = this.config.centerY;
    
    // X轴摆锤叠加
    this.xPendulums.forEach(pendulum => {
      if (pendulum.enabled) {
        x += pendulum.getPosition() * this.config.scale;
      }
    });
    
    // Y轴摆锤叠加
    this.yPendulums.forEach(pendulum => {
      if (pendulum.enabled) {
        y += pendulum.getPosition() * this.config.scale;
      }
    });
    
    // 应用系统旋转
    if (this.config.rotation !== 0) {
      const cos = Math.cos(this.config.rotation);
      const sin = Math.sin(this.config.rotation);
      const dx = x - this.config.centerX;
      const dy = y - this.config.centerY;
      x = this.config.centerX + dx * cos - dy * sin;
      y = this.config.centerY + dx * sin + dy * cos;
    }
    
    return { x, y };
  }

  /**
   * 计算李萨如图形式的位置
   * 用于创建更复杂的图案
   */
  calculateLissajousPosition() {
    let x = this.config.centerX;
    let y = this.config.centerY;
    
    // 使用第一个X摆和第一个Y摆创建李萨如图
    if (this.xPendulums.length > 0 && this.yPendulums.length > 0) {
      const xPend = this.xPendulums[0];
      const yPend = this.yPendulums[0];
      
      if (xPend.enabled && yPend.enabled) {
        x += xPend.amplitude * Math.sin(xPend.omega * xPend.time + xPend.phase);
        y += yPend.amplitude * Math.sin(yPend.omega * yPend.time + yPend.phase);
      }
    }
    
    // 添加额外的摆锤调制
    for (let i = 1; i < this.xPendulums.length; i++) {
      const pendulum = this.xPendulums[i];
      if (pendulum.enabled) {
        x += pendulum.getPosition() * 0.5; // 减小额外摆锤的影响
      }
    }
    
    for (let i = 1; i < this.yPendulums.length; i++) {
      const pendulum = this.yPendulums[i];
      if (pendulum.enabled) {
        y += pendulum.getPosition() * 0.5;
      }
    }
    
    return { x, y };
  }

  /**
   * 记录轨迹
   */
  recordTrajectory(position) {
    this.trajectory.push({
      x: position.x,
      y: position.y,
      timestamp: Date.now()
    });
    
    // 限制轨迹点数
    if (this.trajectory.length > this.maxTrajectoryPoints) {
      this.trajectory.shift();
    }
    
    this.pointCount++;
  }

  /**
   * 更新统计信息
   */
  updateStatistics(position) {
    if (this.previousPosition) {
      const dx = position.x - this.previousPosition.x;
      const dy = position.y - this.previousPosition.y;
      this.totalDistance += Math.sqrt(dx * dx + dy * dy);
    }
    this.previousPosition = { ...position };
  }

  /**
   * 启动系统
   */
  start() {
    this.isRunning = true;
    this.resetTrajectory();
  }

  /**
   * 停止系统
   */
  stop() {
    this.isRunning = false;
  }

  /**
   * 暂停/恢复
   */
  togglePause() {
    this.isRunning = !this.isRunning;
  }

  /**
   * 重置系统
   */
  reset() {
    this.pendulums.forEach(pendulum => pendulum.reset());
    this.resetTrajectory();
    this.currentPosition = { x: this.config.centerX, y: this.config.centerY };
    this.previousPosition = null;
    this.totalDistance = 0;
    this.pointCount = 0;
  }

  /**
   * 重置轨迹
   */
  resetTrajectory() {
    this.trajectory = [];
    this.pointCount = 0;
  }

  /**
   * 获取轨迹
   */
  getTrajectory() {
    return [...this.trajectory];
  }

  /**
   * 获取系统能量
   */
  getTotalEnergy() {
    let totalEnergy = 0;
    this.pendulums.forEach(pendulum => {
      totalEnergy += pendulum.getEnergy();
    });
    return totalEnergy;
  }

  /**
   * 检查系统是否停止
   */
  isStopped(threshold = 0.001) {
    return this.getTotalEnergy() < threshold;
  }

  /**
   * 获取系统状态
   */
  getState() {
    return {
      isRunning: this.isRunning,
      pendulumCount: this.pendulums.size,
      xPendulums: this.xPendulums.length,
      yPendulums: this.yPendulums.length,
      currentPosition: this.currentPosition,
      trajectoryLength: this.trajectory.length,
      totalDistance: this.totalDistance,
      pointCount: this.pointCount,
      totalEnergy: this.getTotalEnergy()
    };
  }

  /**
   * 创建预设配置
   */
  static createPreset(name, pendulumConfigs) {
    return {
      name,
      pendulums: pendulumConfigs,
      timestamp: Date.now()
    };
  }

  /**
   * 应用预设
   */
  applyPreset(preset) {
    // 清除现有摆锤
    this.clear();
    
    // 添加预设中的摆锤
    preset.pendulums.forEach(config => {
      this.addPendulum(config);
    });
  }

  /**
   * 清除所有摆锤
   */
  clear() {
    this.pendulums.clear();
    this.xPendulums = [];
    this.yPendulums = [];
    this.reset();
  }

  /**
   * 导出系统配置
   */
  export() {
    const pendulums = [];
    this.pendulums.forEach(pendulum => {
      pendulums.push(pendulum.exportState());
    });
    
    return {
      config: this.config,
      pendulums,
      state: this.getState()
    };
  }

  /**
   * 导入系统配置
   */
  import(data) {
    this.clear();
    this.config = { ...this.config, ...data.config };
    
    data.pendulums.forEach(pendulumData => {
      const pendulum = new Pendulum(pendulumData.params);
      pendulum.importState(pendulumData);
      this.pendulums.set(pendulum.id, pendulum);
      
      if (pendulum.axis === 'x') {
        this.xPendulums.push(pendulum);
      } else if (pendulum.axis === 'y') {
        this.yPendulums.push(pendulum);
      }
    });
  }
}