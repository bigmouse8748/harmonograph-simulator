/**
 * SuspendedBoard - 四角悬挂画板物理模型
 * 模拟一个由四根绳索吊起的矩形画板的物理运动
 */

export class SuspendedBoard {
  constructor(params = {}) {
    // 画板尺寸和质量
    this.width = params.width || 400;              // 画板宽度 (像素)
    this.height = params.height || 300;            // 画板高度 (像素)
    this.mass = params.mass || 1.0;                // 画板质量 (kg)
    
    // 悬挂点位置 (四个角的固定点)
    this.suspensionPoints = params.suspensionPoints || [
      { x: -300, y: -300, z: 400 },  // 左上
      { x: 300, y: -300, z: 400 },   // 右上
      { x: 300, y: 300, z: 400 },    // 右下
      { x: -300, y: 300, z: 400 }    // 左下
    ];
    
    // 绳索长度 (自然长度，未拉伸时)
    this.ropeLength = params.ropeLength || 500;    // 绳索长度 (像素)
    this.ropeStiffness = params.ropeStiffness || 100; // 绳索刚度
    
    // 计算静止平衡位置
    this.equilibriumPosition = this.calculateEquilibriumPosition();
    
    // 画板状态 (中心点位置)
    this.position = {
      x: params.initialX || this.equilibriumPosition.x,
      y: params.initialY || this.equilibriumPosition.y,
      z: params.initialZ || this.equilibriumPosition.z
    };
    
    // 画板速度
    this.velocity = {
      x: params.initialVx || 0,
      y: params.initialVy || 0,
      z: params.initialVz || 0
    };
    
    // 画板旋转 (欧拉角)
    this.rotation = {
      roll: params.initialRoll || 0,    // 横滚角
      pitch: params.initialPitch || 0,   // 俯仰角
      yaw: params.initialYaw || 0        // 偏航角
    };
    
    // 角速度
    this.angularVelocity = {
      roll: 0,
      pitch: 0,
      yaw: 0
    };
    
    // 物理参数
    this.gravity = params.gravity || 9.81;         // 重力加速度
    this.airDamping = params.airDamping || 0.02;  // 空气阻尼
    this.ropeDamping = params.ropeDamping || 0.05; // 绳索阻尼
    
    // 画板的惯性矩
    this.inertia = this.calculateInertia();
    
    // 时间和状态
    this.time = 0;
    this.isInteracting = false;  // 用户是否正在交互
    this.interactionForce = { x: 0, y: 0, z: 0 };
    
    // 轨迹记录（用于绘画）
    this.trail = [];
    this.maxTrailLength = params.maxTrailLength || 10000;
    
    // 画笔位置（相对于画板中心的偏移）
    this.penOffset = params.penOffset || { x: 0, y: 0 };
  }
  
  /**
   * 计算画板的惯性矩
   */
  calculateInertia() {
    // 矩形板的惯性矩
    const Ixx = (this.mass * (this.height * this.height)) / 12;
    const Iyy = (this.mass * (this.width * this.width)) / 12;
    const Izz = (this.mass * (this.width * this.width + this.height * this.height)) / 12;
    
    return { Ixx, Iyy, Izz };
  }
  
  /**
   * 计算静止平衡位置
   * 在平衡状态下，画板会下沉到一个位置，使得四根绳索的向上分力平衡重力
   */
  calculateEquilibriumPosition() {
    // 计算悬挂点的平均位置（几何中心）
    let centerX = 0, centerY = 0, centerZ = 0;
    for (const point of this.suspensionPoints) {
      centerX += point.x / 4;
      centerY += point.y / 4;
      centerZ += point.z / 4;
    }
    
    // 估算平衡时的下沉量
    // 简化计算：假设画板水平，四根绳索对称
    // 实际下沉量取决于绳索角度和重力
    
    // 画板角点到悬挂点的水平距离
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    // 计算一根典型绳索的水平投影长度
    const horizontalDistance = Math.sqrt(
      Math.pow(this.suspensionPoints[0].x - centerX + halfWidth, 2) +
      Math.pow(this.suspensionPoints[0].y - centerY + halfHeight, 2)
    );
    
    // 使用几何关系计算平衡高度
    // 绳索长度^2 = 水平距离^2 + 垂直距离^2
    // 考虑到绳索会被拉伸，实际长度会略大于自然长度
    const verticalDistance = Math.sqrt(
      Math.max(0, this.ropeLength * this.ropeLength - horizontalDistance * horizontalDistance)
    );
    
    // 平衡位置：悬挂点下方的垂直距离处
    return {
      x: centerX,
      y: centerY,
      z: centerZ - verticalDistance
    };
  }
  
  /**
   * 计算画板四个角的世界坐标
   */
  getCornerPositions() {
    const corners = [];
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    // 画板局部坐标系的四个角
    const localCorners = [
      { x: -halfWidth, y: -halfHeight, z: 0 },
      { x: halfWidth, y: -halfHeight, z: 0 },
      { x: halfWidth, y: halfHeight, z: 0 },
      { x: -halfWidth, y: halfHeight, z: 0 }
    ];
    
    // 应用旋转和平移变换
    for (const corner of localCorners) {
      // 简化版本：只考虑小角度近似
      const rotated = this.rotatePoint(corner);
      corners.push({
        x: this.position.x + rotated.x,
        y: this.position.y + rotated.y,
        z: this.position.z + rotated.z
      });
    }
    
    return corners;
  }
  
  /**
   * 旋转点（使用欧拉角）
   */
  rotatePoint(point) {
    // 小角度近似，适用于小幅摆动
    const { roll, pitch, yaw } = this.rotation;
    
    return {
      x: point.x * Math.cos(yaw) - point.y * Math.sin(yaw) + point.z * pitch,
      y: point.x * Math.sin(yaw) + point.y * Math.cos(yaw) - point.z * roll,
      z: point.z - point.x * pitch + point.y * roll
    };
  }
  
  /**
   * 计算绳索张力
   */
  calculateRopeTensions() {
    const corners = this.getCornerPositions();
    const tensions = [];
    
    for (let i = 0; i < 4; i++) {
      const corner = corners[i];
      const suspension = this.suspensionPoints[i];
      
      // 计算绳索向量（从画板角点指向悬挂点）
      const ropeVector = {
        x: suspension.x - corner.x,
        y: suspension.y - corner.y,
        z: suspension.z - corner.z
      };
      
      // 计算绳索当前长度
      const currentLength = Math.sqrt(
        ropeVector.x * ropeVector.x +
        ropeVector.y * ropeVector.y +
        ropeVector.z * ropeVector.z
      );
      
      // 计算拉伸量（正值表示绳索被拉伸）
      const extension = currentLength - this.ropeLength;
      
      // 胡克定律计算张力大小
      // 注意：绳索只能拉不能压，所以张力不能为负
      const tensionMagnitude = Math.max(0, this.ropeStiffness * extension);
      
      // 添加基础张力以支撑重量（即使在平衡位置）
      // 这确保了即使绳索未被拉伸，也会有张力来支撑画板
      const gravityComponent = this.mass * this.gravity / 4; // 每根绳索承担1/4重力
      const totalTension = tensionMagnitude + gravityComponent * (ropeVector.z / currentLength);
      
      // 张力方向（单位向量，指向悬挂点）
      const direction = {
        x: ropeVector.x / currentLength,
        y: ropeVector.y / currentLength,
        z: ropeVector.z / currentLength
      };
      
      tensions.push({
        magnitude: Math.max(0, totalTension),
        direction: direction,
        point: corner,
        ropeLength: currentLength,
        extension: extension
      });
    }
    
    return tensions;
  }
  
  /**
   * 计算合力和合力矩
   */
  calculateForces() {
    // 重力
    const gravityForce = {
      x: 0,
      y: 0,
      z: -this.mass * this.gravity
    };
    
    // 绳索张力
    const tensions = this.calculateRopeTensions();
    let totalForce = { ...gravityForce };
    let totalTorque = { x: 0, y: 0, z: 0 };
    
    for (const tension of tensions) {
      // 张力对质心的力
      const force = {
        x: tension.magnitude * tension.direction.x,
        y: tension.magnitude * tension.direction.y,
        z: tension.magnitude * tension.direction.z
      };
      
      totalForce.x += force.x;
      totalForce.y += force.y;
      totalForce.z += force.z;
      
      // 计算力矩 (r × F)
      const r = {
        x: tension.point.x - this.position.x,
        y: tension.point.y - this.position.y,
        z: tension.point.z - this.position.z
      };
      
      totalTorque.x += r.y * force.z - r.z * force.y;
      totalTorque.y += r.z * force.x - r.x * force.z;
      totalTorque.z += r.x * force.y - r.y * force.x;
    }
    
    // 空气阻尼
    totalForce.x -= this.airDamping * this.velocity.x;
    totalForce.y -= this.airDamping * this.velocity.y;
    totalForce.z -= this.airDamping * this.velocity.z;
    
    // 角阻尼
    totalTorque.x -= this.ropeDamping * this.angularVelocity.roll;
    totalTorque.y -= this.ropeDamping * this.angularVelocity.pitch;
    totalTorque.z -= this.ropeDamping * this.angularVelocity.yaw;
    
    // 用户交互力
    if (this.isInteracting) {
      totalForce.x += this.interactionForce.x;
      totalForce.y += this.interactionForce.y;
      totalForce.z += this.interactionForce.z;
    }
    
    return { force: totalForce, torque: totalTorque };
  }
  
  /**
   * 更新物理状态
   */
  update(deltaTime) {
    if (this.isInteracting) {
      // 用户控制期间，直接更新位置
      return;
    }
    
    // 计算合力和力矩
    const { force, torque } = this.calculateForces();
    
    // 线性加速度 (F = ma)
    const acceleration = {
      x: force.x / this.mass,
      y: force.y / this.mass,
      z: force.z / this.mass
    };
    
    // 角加速度 (τ = Iα)
    const angularAcceleration = {
      roll: torque.x / this.inertia.Ixx,
      pitch: torque.y / this.inertia.Iyy,
      yaw: torque.z / this.inertia.Izz
    };
    
    // 更新速度
    this.velocity.x += acceleration.x * deltaTime;
    this.velocity.y += acceleration.y * deltaTime;
    this.velocity.z += acceleration.z * deltaTime;
    
    this.angularVelocity.roll += angularAcceleration.roll * deltaTime;
    this.angularVelocity.pitch += angularAcceleration.pitch * deltaTime;
    this.angularVelocity.yaw += angularAcceleration.yaw * deltaTime;
    
    // 更新位置
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    this.rotation.roll += this.angularVelocity.roll * deltaTime;
    this.rotation.pitch += this.angularVelocity.pitch * deltaTime;
    this.rotation.yaw += this.angularVelocity.yaw * deltaTime;
    
    // 更新时间
    this.time += deltaTime;
    
    // 记录轨迹
    this.recordTrail();
  }
  
  /**
   * 记录画笔轨迹
   */
  recordTrail() {
    const penPosition = this.getPenPosition();
    
    this.trail.push({
      x: penPosition.x,
      y: penPosition.y,
      time: this.time,
      velocity: Math.sqrt(
        this.velocity.x * this.velocity.x +
        this.velocity.y * this.velocity.y
      )
    });
    
    // 限制轨迹长度
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }
  
  /**
   * 获取画笔位置（考虑画板旋转）
   */
  getPenPosition() {
    const rotatedOffset = this.rotatePoint(this.penOffset);
    
    return {
      x: this.position.x + rotatedOffset.x,
      y: this.position.y + rotatedOffset.y
    };
  }
  
  /**
   * 开始用户交互（拖拽）
   */
  startInteraction(x, y) {
    this.isInteracting = true;
    this.interactionStartPos = { x, y };
    this.interactionCurrentPos = { x, y };
  }
  
  /**
   * 更新用户交互（拖拽中）
   */
  updateInteraction(x, y) {
    if (!this.isInteracting) return;
    
    const prevPos = { ...this.position };
    
    // 更新画板位置
    this.position.x = x - this.penOffset.x;
    this.position.y = y - this.penOffset.y;
    
    // 计算速度（用于释放时的初速度）
    this.velocity.x = (this.position.x - prevPos.x) * 60; // 假设60fps
    this.velocity.y = (this.position.y - prevPos.y) * 60;
    
    this.interactionCurrentPos = { x, y };
  }
  
  /**
   * 结束用户交互（释放）
   */
  endInteraction() {
    this.isInteracting = false;
    // 速度已在 updateInteraction 中计算
  }
  
  /**
   * 重置画板状态
   */
  reset() {
    this.position = { x: 0, y: 0, z: 0 };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { roll: 0, pitch: 0, yaw: 0 };
    this.angularVelocity = { roll: 0, pitch: 0, yaw: 0 };
    this.time = 0;
    this.trail = [];
    this.isInteracting = false;
  }
  
  /**
   * 获取能量
   */
  getEnergy() {
    // 动能 = 0.5 * m * v^2
    const kineticEnergy = 0.5 * this.mass * (
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
    
    // 势能 = m * g * h
    const potentialEnergy = this.mass * this.gravity * this.position.z;
    
    return kineticEnergy + potentialEnergy;
  }
  
  /**
   * 是否已停止运动
   */
  isStopped(threshold = 0.01) {
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x +
      this.velocity.y * this.velocity.y +
      this.velocity.z * this.velocity.z
    );
    
    return speed < threshold;
  }
  
  /**
   * 导出状态
   */
  exportState() {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      rotation: { ...this.rotation },
      angularVelocity: { ...this.angularVelocity },
      time: this.time,
      trail: [...this.trail]
    };
  }
  
  /**
   * 导入状态
   */
  importState(state) {
    this.position = { ...state.position };
    this.velocity = { ...state.velocity };
    this.rotation = { ...state.rotation };
    this.angularVelocity = { ...state.angularVelocity };
    this.time = state.time;
    this.trail = [...state.trail];
  }
}