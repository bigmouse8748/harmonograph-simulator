/**
 * PhysicsOptimizer - 物理计算优化器
 * 使用Web Worker进行离线计算和缓存优化
 */

export class PhysicsOptimizer {
  constructor() {
    this.cache = new Map();
    this.cacheSize = 1000;
    this.useWebWorker = typeof Worker !== 'undefined';
    this.worker = null;
    
    // 查找表优化
    this.sinTable = new Float32Array(360);
    this.cosTable = new Float32Array(360);
    this.initLookupTables();
  }

  /**
   * 初始化查找表
   */
  initLookupTables() {
    for (let i = 0; i < 360; i++) {
      const angle = (i * Math.PI) / 180;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }
  }

  /**
   * 快速正弦计算
   */
  fastSin(angle) {
    const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    const index = Math.floor(deg);
    const fraction = deg - index;
    
    if (index === 359) {
      return this.sinTable[359] * (1 - fraction) + this.sinTable[0] * fraction;
    }
    return this.sinTable[index] * (1 - fraction) + this.sinTable[index + 1] * fraction;
  }

  /**
   * 快速余弦计算
   */
  fastCos(angle) {
    const deg = ((angle * 180 / Math.PI) % 360 + 360) % 360;
    const index = Math.floor(deg);
    const fraction = deg - index;
    
    if (index === 359) {
      return this.cosTable[359] * (1 - fraction) + this.cosTable[0] * fraction;
    }
    return this.cosTable[index] * (1 - fraction) + this.cosTable[index + 1] * fraction;
  }

  /**
   * 批量计算位置
   */
  batchCalculatePositions(pendulums, timeSteps) {
    const positions = new Float32Array(timeSteps * 2); // x, y pairs
    
    for (let i = 0; i < timeSteps; i++) {
      let x = 0, y = 0;
      
      pendulums.forEach(pendulum => {
        const pos = this.calculatePendulumPosition(pendulum, i * 0.016); // 60fps
        if (pendulum.axis === 'x') x += pos;
        else y += pos;
      });
      
      positions[i * 2] = x;
      positions[i * 2 + 1] = y;
    }
    
    return positions;
  }

  /**
   * 计算单个摆锤位置（优化版）
   */
  calculatePendulumPosition(pendulum, time) {
    const cacheKey = `${pendulum.id}_${time.toFixed(3)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const dampingFactor = Math.pow(pendulum.damping, time * 60);
    const position = pendulum.amplitude * 
                    dampingFactor * 
                    this.fastSin(pendulum.omega * time + pendulum.phase);
    
    // 缓存结果
    if (this.cache.size >= this.cacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, position);
    
    return position;
  }

  /**
   * 预计算轨迹
   */
  precomputeTrajectory(pendulums, duration, fps = 60) {
    const steps = Math.floor(duration * fps);
    const trajectory = [];
    const deltaTime = 1 / fps;
    
    for (let i = 0; i < steps; i++) {
      const time = i * deltaTime;
      let x = 0, y = 0;
      
      pendulums.forEach(pendulum => {
        const pos = this.calculatePendulumPosition(pendulum, time);
        if (pendulum.axis === 'x') x += pos;
        else y += pos;
      });
      
      trajectory.push({ x, y, time });
    }
    
    return trajectory;
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheSize,
      hitRate: this.calculateHitRate()
    };
  }

  /**
   * 计算缓存命中率
   */
  calculateHitRate() {
    // 实际实现需要跟踪命中和未命中的次数
    return 0;
  }
}