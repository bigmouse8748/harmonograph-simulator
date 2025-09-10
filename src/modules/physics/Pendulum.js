/**
 * Pendulum - 单摆物理模型
 * 实现阻尼谐振子的物理模拟
 */

export class Pendulum {
  constructor(params = {}) {
    // 物理参数
    this.frequency = params.frequency || 1.0;        // 频率 (Hz)
    this.amplitude = params.amplitude || 100;        // 振幅 (像素)
    this.phase = params.phase || 0;                  // 初始相位 (弧度)
    this.damping = params.damping || 0.995;          // 阻尼系数 (0-1)
    
    // 状态变量
    this.angle = params.angle || 0;                  // 当前角度
    this.angularVelocity = 0;                        // 角速度
    this.time = 0;                                   // 运行时间
    this.position = 0;                               // 当前位置
    
    // 配置
    this.id = params.id || this.generateId();
    this.axis = params.axis || 'x';                  // 运动轴 (x/y)
    this.enabled = params.enabled !== false;         // 是否启用
    
    // 缓存计算值
    this.omega = 2 * Math.PI * this.frequency;       // 角频率
    this.dampingFactor = 1;                          // 当前阻尼因子
  }

  /**
   * 生成唯一ID
   */
  generateId() {
    return `pendulum_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 更新摆锤位置
   * @param {number} deltaTime - 时间步长(秒)
   */
  update(deltaTime) {
    if (!this.enabled) return this.position;

    this.time += deltaTime;
    
    // 计算阻尼因子 (指数衰减)
    this.dampingFactor = Math.pow(this.damping, this.time * 60);
    
    // 计算位置：x(t) = A * e^(-λt) * sin(ωt + φ)
    // 其中 A = amplitude, λ = damping, ω = omega, φ = phase
    this.position = this.amplitude * 
                   this.dampingFactor * 
                   Math.sin(this.omega * this.time + this.phase);
    
    // 更新角度 (用于可视化)
    this.angle = this.omega * this.time + this.phase;
    
    return this.position;
  }

  /**
   * 使用改进的物理模型更新
   * 考虑重力和真实摆动
   */
  updateRealistic(deltaTime, gravity = 9.81) {
    if (!this.enabled) return this.position;

    // 摆长 (从振幅推算)
    const length = this.amplitude / 100;
    
    // 计算角加速度: α = -(g/L) * sin(θ) - damping * ω
    const angularAcceleration = -(gravity / length) * Math.sin(this.angle) 
                                - (1 - this.damping) * this.angularVelocity;
    
    // 更新角速度和角度
    this.angularVelocity += angularAcceleration * deltaTime;
    this.angle += this.angularVelocity * deltaTime;
    
    // 转换为笛卡尔坐标
    this.position = this.amplitude * Math.sin(this.angle);
    
    this.time += deltaTime;
    
    return this.position;
  }

  /**
   * 获取当前位置
   */
  getPosition() {
    return this.position;
  }

  /**
   * 获取速度
   */
  getVelocity() {
    if (!this.enabled) return 0;
    
    // v(t) = A * ω * e^(-λt) * cos(ωt + φ)
    return this.amplitude * 
           this.omega * 
           this.dampingFactor * 
           Math.cos(this.omega * this.time + this.phase);
  }

  /**
   * 获取能量
   */
  getEnergy() {
    if (!this.enabled) return 0;
    
    // E = 0.5 * m * v^2 (动能，假设质量为1)
    const velocity = this.getVelocity();
    return 0.5 * velocity * velocity;
  }

  /**
   * 重置摆锤
   */
  reset() {
    this.time = 0;
    this.angle = this.phase;
    this.angularVelocity = 0;
    this.position = 0;
    this.dampingFactor = 1;
  }

  /**
   * 设置参数
   */
  setParams(params) {
    if (params.frequency !== undefined) {
      this.frequency = params.frequency;
      this.omega = 2 * Math.PI * this.frequency;
    }
    if (params.amplitude !== undefined) {
      this.amplitude = params.amplitude;
    }
    if (params.phase !== undefined) {
      this.phase = params.phase;
      this.angle = this.phase;
    }
    if (params.damping !== undefined) {
      this.damping = params.damping;
    }
    if (params.enabled !== undefined) {
      this.enabled = params.enabled;
    }
  }

  /**
   * 获取参数
   */
  getParams() {
    return {
      id: this.id,
      frequency: this.frequency,
      amplitude: this.amplitude,
      phase: this.phase,
      damping: this.damping,
      axis: this.axis,
      enabled: this.enabled
    };
  }

  /**
   * 启用/禁用
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.position = 0;
    }
  }

  /**
   * 是否已经停止（能量耗尽）
   */
  isStopped(threshold = 0.001) {
    return this.getEnergy() < threshold;
  }

  /**
   * 克隆摆锤
   */
  clone() {
    return new Pendulum(this.getParams());
  }

  /**
   * 导出状态
   */
  exportState() {
    return {
      params: this.getParams(),
      state: {
        time: this.time,
        angle: this.angle,
        angularVelocity: this.angularVelocity,
        position: this.position,
        dampingFactor: this.dampingFactor
      }
    };
  }

  /**
   * 导入状态
   */
  importState(state) {
    this.setParams(state.params);
    this.time = state.state.time || 0;
    this.angle = state.state.angle || 0;
    this.angularVelocity = state.state.angularVelocity || 0;
    this.position = state.state.position || 0;
    this.dampingFactor = state.state.dampingFactor || 1;
  }
}