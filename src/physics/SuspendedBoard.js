/**
 * SuspendedBoard - 四角悬挂画板物理模拟
 * 
 * 正确的物理原理：
 * - 大画板由四根绳索悬挂，形成6自由度刚体系统
 * - 画笔固定在世界坐标原点(0,0,0)
 * - 纸张贴在画板上，随画板一起运动
 * - 绘制发生在画笔与纸张相交时
 */

export class SuspendedBoard {
  constructor(params = {}) {
    // === 画板物理属性 ===
    this.width = params.width || 2.0;              // 画板宽度 (m)
    this.height = params.height || 1.5;            // 画板高度 (m) 
    this.thickness = params.thickness || 0.02;     // 画板厚度 (m)
    this.mass = params.mass || 50.0;               // 画板质量 (kg)
    
    // === 悬挂系统 ===
    this.suspensionPoints = params.suspensionPoints || this.createDefaultSuspensionPoints();
    this.ropeLength = params.ropeLength || 3.0;    // 绳索自然长度 (m)
    this.ropeStiffness = params.ropeStiffness || 800; // 绳索刚度 (N/m) - 降低以获得更大振幅
    
    // === 环境参数 ===
    this.gravity = params.gravity || 9.81;         // 重力加速度 (m/s²)
    this.airDamping = params.airDamping || 0.5;    // 空气阻尼系数 - 增加以获得稳定性
    this.ropeDamping = params.ropeDamping || 0.3;  // 绳索阻尼系数 - 增加以获得稳定性
    
    // === 模态系统 ===
    this.vibrationalModes = null;                  // 将在第一次update时初始化
    
    // === 画板状态（6自由度） ===
    // 位置（质心）
    this.position = {
      x: params.initialX || 0,
      y: params.initialY || 0,
      z: params.initialZ || 0
    };
    
    // 速度（质心）
    this.velocity = {
      x: params.initialVx || 0,
      y: params.initialVy || 0,
      z: params.initialVz || 0
    };
    
    // 旋转（欧拉角：ZYX顺序）
    this.rotation = {
      roll: params.initialRoll || 0,    // 绕X轴旋转 (rad)
      pitch: params.initialPitch || 0,   // 绕Y轴旋转 (rad)
      yaw: params.initialYaw || 0        // 绕Z轴旋转 (rad)
    };
    
    // 角速度
    this.angularVelocity = {
      roll: 0,
      pitch: 0,
      yaw: 0
    };
    
    // === 物理属性计算 ===
    this.momentOfInertia = this.calculateMomentOfInertia();
    this.equilibriumPosition = null; // 将在初始化时计算
    
    // === 模拟状态 ===
    this.time = 0;
    this.isInitialized = false;
    
    // 初始化
    this.initialize();
  }
  
  /**
   * 创建默认悬挂点配置
   * 四个悬挂点应该与画板尺寸相关，而不是固定值
   */
  createDefaultSuspensionPoints() {
    // 悬挂点应该稍微超出画板边界，但不要太远
    const spreadX = Math.max(this.width * 0.6, 1.5); // 至少1.5m，或画板宽度的60%
    const spreadY = Math.max(this.height * 0.6, 1.2); // 至少1.2m，或画板高度的60%
    const height = this.ropeLength + 1.0; // 悬挂点高度应该基于绳长
    
    return [
      { x: -spreadX, y: -spreadY, z: height }, // 左上
      { x: spreadX, y: -spreadY, z: height },  // 右上
      { x: spreadX, y: spreadY, z: height },   // 右下
      { x: -spreadX, y: spreadY, z: height }   // 左下
    ];
  }
  
  /**
   * 计算矩形板的转动惯量
   * 使用标准公式计算绕质心的主轴转动惯量
   */
  calculateMomentOfInertia() {
    const w = this.width;
    const h = this.height;
    const m = this.mass;
    
    return {
      Ixx: (m * (h * h + this.thickness * this.thickness)) / 12, // 绕X轴
      Iyy: (m * (w * w + this.thickness * this.thickness)) / 12, // 绕Y轴  
      Izz: (m * (w * w + h * h)) / 12                            // 绕Z轴
    };
  }
  
  /**
   * 初始化系统
   */
  initialize() {
    this.equilibriumPosition = this.calculateEquilibriumPosition();
    
    // 如果没有指定初始位置，则使用平衡位置
    if (this.position.x === 0 && this.position.y === 0 && this.position.z === 0) {
      this.position = { ...this.equilibriumPosition };
    }
    
    this.isInitialized = true;
  }
  
  /**
   * 计算静态平衡位置
   * 简化为重力作用下的自然悬挂位置
   */
  calculateEquilibriumPosition() {
    // 悬挂点的几何中心
    let centerX = 0, centerY = 0, centerZ = 0;
    for (const point of this.suspensionPoints) {
      centerX += point.x / 4;
      centerY += point.y / 4;
      centerZ += point.z / 4;
    }
    
    // 简化的平衡位置计算
    // 画板在重力作用下会自然下垂到绳长允许的最低位置
    const equilibriumZ = centerZ - this.ropeLength * 0.95; // 预留5%的弹性空间
    
    return {
      x: centerX,
      y: centerY,
      z: equilibriumZ
    };
  }
  
  /**
   * 获取画板四个角点的世界坐标
   * 考虑画板的位置和旋转
   */
  getCornerPositions() {
    const corners = [];
    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    
    // 画板局部坐标系的四个角点
    const localCorners = [
      { x: -halfWidth, y: -halfHeight, z: 0 },
      { x: halfWidth, y: -halfHeight, z: 0 },
      { x: halfWidth, y: halfHeight, z: 0 },
      { x: -halfWidth, y: halfHeight, z: 0 }
    ];
    
    // 应用旋转和平移变换
    for (const corner of localCorners) {
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
   * 旋转点（使用欧拉角ZYX顺序）
   * 先绕Z轴，再绕Y轴，最后绕X轴
   */
  rotatePoint(point) {
    const { roll, pitch, yaw } = this.rotation;
    
    // 旋转矩阵计算（ZYX欧拉角）
    const cx = Math.cos(roll), sx = Math.sin(roll);
    const cy = Math.cos(pitch), sy = Math.sin(pitch);
    const cz = Math.cos(yaw), sz = Math.sin(yaw);
    
    // 组合旋转矩阵 R = Rz(yaw) * Ry(pitch) * Rx(roll)
    const x = point.x * (cy * cz) + 
              point.y * (sx * sy * cz - cx * sz) + 
              point.z * (cx * sy * cz + sx * sz);
              
    const y = point.x * (cy * sz) + 
              point.y * (sx * sy * sz + cx * cz) + 
              point.z * (cx * sy * sz - sx * cz);
              
    const z = point.x * (-sy) + 
              point.y * (sx * cy) + 
              point.z * (cx * cy);
    
    return { x, y, z };
  }
  
  /**
   * 计算每根绳索的张力
   * 基于胡克定律和几何约束
   */
  calculateRopeTensions() {
    const corners = this.getCornerPositions();
    const tensions = [];
    
    for (let i = 0; i < 4; i++) {
      const corner = corners[i];
      const suspension = this.suspensionPoints[i];
      
      // 绳索向量（从角点指向悬挂点）
      const ropeVector = {
        x: suspension.x - corner.x,
        y: suspension.y - corner.y,
        z: suspension.z - corner.z
      };
      
      // 当前绳索长度
      const currentLength = Math.sqrt(
        ropeVector.x * ropeVector.x + 
        ropeVector.y * ropeVector.y + 
        ropeVector.z * ropeVector.z
      );
      
      // 绳索拉伸量
      const extension = Math.max(0, currentLength - this.ropeLength);
      
      // 更物理合理的张力计算
      let tensionMagnitude = 0;
      
      if (currentLength > 0) {
        // 1. 弹性张力：胡克定律
        const elasticTension = extension * this.ropeStiffness;
        
        // 2. 重力支撑张力：考虑绳索角度
        const verticalComponent = Math.abs(ropeVector.z) / currentLength;
        const requiredTensionForWeight = (this.mass * this.gravity / 4) / Math.max(verticalComponent, 0.1);
        
        // 3. 总张力：两者之和，但限制在合理范围内
        tensionMagnitude = Math.max(elasticTension, requiredTensionForWeight);
        
        // 4. 安全限制：避免过大张力
        const maxTension = this.mass * this.gravity * 2; // 最大不超过重量的2倍
        tensionMagnitude = Math.min(tensionMagnitude, maxTension);
      }
      
      // 张力方向（单位向量）
      const direction = currentLength > 0 ? {
        x: ropeVector.x / currentLength,
        y: ropeVector.y / currentLength,
        z: ropeVector.z / currentLength
      } : { x: 0, y: 0, z: 1 };
      
      tensions.push({
        magnitude: tensionMagnitude,
        direction: direction,
        currentLength: currentLength,
        extension: extension,
        suspensionPoint: suspension,
        attachmentPoint: corner
      });
    }
    
    return tensions;
  }
  
  /**
   * 计算作用在画板上的总力和总力矩
   */
  calculateForcesAndTorques() {
    const tensions = this.calculateRopeTensions();
    
    // 初始化力和力矩
    const totalForce = { x: 0, y: 0, z: 0 };
    const totalTorque = { x: 0, y: 0, z: 0 };
    
    // 重力（作用于质心）
    totalForce.z -= this.mass * this.gravity;
    
    // 绳索张力
    for (let i = 0; i < tensions.length; i++) {
      const tension = tensions[i];
      const corner = tension.attachmentPoint;
      
      // 张力对质心的作用力
      const force = {
        x: tension.magnitude * tension.direction.x,
        y: tension.magnitude * tension.direction.y,
        z: tension.magnitude * tension.direction.z
      };
      
      totalForce.x += force.x;
      totalForce.y += force.y;
      totalForce.z += force.z;
      
      // 力矩计算：τ = r × F（从质心到作用点的向量叉乘力）
      const leverArm = {
        x: corner.x - this.position.x,
        y: corner.y - this.position.y,
        z: corner.z - this.position.z
      };
      
      totalTorque.x += leverArm.y * force.z - leverArm.z * force.y;
      totalTorque.y += leverArm.z * force.x - leverArm.x * force.z;
      totalTorque.z += leverArm.x * force.y - leverArm.y * force.x;
    }
    
    // 空气阻尼（线性和角阻尼）
    totalForce.x -= this.airDamping * this.velocity.x;
    totalForce.y -= this.airDamping * this.velocity.y;
    totalForce.z -= this.airDamping * this.velocity.z;
    
    totalTorque.x -= this.ropeDamping * this.angularVelocity.roll;
    totalTorque.y -= this.ropeDamping * this.angularVelocity.pitch;
    totalTorque.z -= this.ropeDamping * this.angularVelocity.yaw;
    
    return { force: totalForce, torque: totalTorque };
  }
  
  /**
   * 更新物理状态（真实的悬挂板谐振物理）
   * 基于四绳悬挂系统的耦合振动模态，产生自然谐振
   */
  update(deltaTime) {
    if (!this.isInitialized || deltaTime <= 0) return;
    
    // 限制时间步长以保持稳定性
    deltaTime = Math.min(deltaTime, 0.002);
    
    // 初始化振动模态系统（首次调用）
    if (!this.vibrationalModes) {
      this.initializeVibrationalModes();
    }
    
    const eq = this.equilibriumPosition;
    
    // ========== 计算相对于平衡位置的偏移 ==========
    const displacement = {
      x: this.position.x - eq.x,
      y: this.position.y - eq.y,
      z: this.position.z - eq.z,
      roll: this.rotation.roll,
      pitch: this.rotation.pitch,
      yaw: this.rotation.yaw
    };
    
    // ========== 计算耦合恢复力和力矩 ==========
    // 基于悬挂系统的自然模态
    const modes = this.vibrationalModes;
    const forces = { x: 0, y: 0, z: 0 };
    const torques = { x: 0, y: 0, z: 0 };
    
    // 模态1：平移振动（左右和前后摆动）
    const freq1 = modes.translational.frequency;
    const stiffness1 = this.mass * (freq1 * freq1);
    forces.x -= stiffness1 * displacement.x;
    forces.y -= stiffness1 * displacement.y;
    
    // 模态2：垂直振动（上下弹跳）
    const freq2 = modes.vertical.frequency;
    const stiffness2 = this.mass * (freq2 * freq2);
    forces.z -= stiffness2 * displacement.z;
    
    // 模态3：旋转振动（绕各轴摆动）
    const freqRoll = modes.rotational.roll.frequency;
    const freqPitch = modes.rotational.pitch.frequency;
    const freqYaw = modes.rotational.yaw.frequency;
    
    const rollStiffness = this.momentOfInertia.Ixx * (freqRoll * freqRoll);
    const pitchStiffness = this.momentOfInertia.Iyy * (freqPitch * freqPitch);
    const yawStiffness = this.momentOfInertia.Izz * (freqYaw * freqYaw);
    
    torques.x -= rollStiffness * displacement.roll;
    torques.y -= pitchStiffness * displacement.pitch;
    torques.z -= yawStiffness * displacement.yaw;
    
    // ========== 模态耦合项 ==========
    // X-Y平移耦合（产生椭圆运动）
    const couplingXY = modes.coupling.xy * this.mass;
    forces.x -= couplingXY * displacement.y * Math.sin(this.time * freq1);
    forces.y -= couplingXY * displacement.x * Math.cos(this.time * freq1);
    
    // 平移-旋转耦合（产生复杂轨迹）
    const couplingTR = modes.coupling.translationRotation;
    forces.x += couplingTR * displacement.roll * 0.1;
    forces.y += couplingTR * displacement.pitch * 0.1;
    torques.x += couplingTR * displacement.y * 0.01;
    torques.y -= couplingTR * displacement.x * 0.01;
    
    // 非线性项（大振幅时的硬弹簧效应）
    const amplitude = Math.sqrt(displacement.x*displacement.x + displacement.y*displacement.y);
    if (amplitude > 0.05) {
      const nonlinearFactor = 50 * amplitude * amplitude;
      forces.x -= nonlinearFactor * displacement.x;
      forces.y -= nonlinearFactor * displacement.y;
    }
    
    // ========== 重力 ==========
    forces.z -= this.mass * this.gravity;
    
    // ========== 模态阻尼 ==========
    // 不同模态有不同的阻尼系数
    forces.x -= modes.translational.damping * this.velocity.x * this.mass;
    forces.y -= modes.translational.damping * this.velocity.y * this.mass;
    forces.z -= modes.vertical.damping * this.velocity.z * this.mass;
    
    torques.x -= modes.rotational.roll.damping * this.angularVelocity.roll * this.momentOfInertia.Ixx;
    torques.y -= modes.rotational.pitch.damping * this.angularVelocity.pitch * this.momentOfInertia.Iyy;
    torques.z -= modes.rotational.yaw.damping * this.angularVelocity.yaw * this.momentOfInertia.Izz;
    
    // 非线性阻尼（大速度时增强阻尼）
    const speed = Math.sqrt(this.velocity.x**2 + this.velocity.y**2 + this.velocity.z**2);
    if (speed > 0.1) {
      const nlDamp = 2.0 * speed;
      forces.x -= nlDamp * this.velocity.x;
      forces.y -= nlDamp * this.velocity.y;
      forces.z -= nlDamp * this.velocity.z;
    }
    
    // ========== 数值积分 ==========
    // 线性加速度
    const ax = forces.x / this.mass;
    const ay = forces.y / this.mass;
    const az = forces.z / this.mass;
    
    // 角加速度
    const alphax = torques.x / this.momentOfInertia.Ixx;
    const alphay = torques.y / this.momentOfInertia.Iyy;
    const alphaz = torques.z / this.momentOfInertia.Izz;
    
    // Velocity Verlet积分法（更稳定）
    this.velocity.x += ax * deltaTime;
    this.velocity.y += ay * deltaTime;
    this.velocity.z += az * deltaTime;
    
    this.angularVelocity.roll += alphax * deltaTime;
    this.angularVelocity.pitch += alphay * deltaTime;
    this.angularVelocity.yaw += alphaz * deltaTime;
    
    // 更新位置
    this.position.x += this.velocity.x * deltaTime;
    this.position.y += this.velocity.y * deltaTime;
    this.position.z += this.velocity.z * deltaTime;
    
    this.rotation.roll += this.angularVelocity.roll * deltaTime;
    this.rotation.pitch += this.angularVelocity.pitch * deltaTime;
    this.rotation.yaw += this.angularVelocity.yaw * deltaTime;
    
    // 限制旋转角度（物理约束）
    this.rotation.roll = Math.max(-0.4, Math.min(0.4, this.rotation.roll));
    this.rotation.pitch = Math.max(-0.4, Math.min(0.4, this.rotation.pitch));
    this.rotation.yaw = Math.max(-0.3, Math.min(0.3, this.rotation.yaw));
    
    // 更新时间
    this.time += deltaTime;
  }
  
  /**
   * 初始化振动模态系统
   * 基于四绳悬挂系统的理论模态分析
   */
  initializeVibrationalModes() {
    // 基础频率计算（基于绳长和重力）
    const baseFreq = Math.sqrt(this.gravity / this.ropeLength); // rad/s
    
    // 系统不对称性（产生频率分离）
    const asymmetry = {
      lengthVariation: 0.02,    // 2% 绳长差异
      stiffnessVariation: 0.03, // 3% 刚度差异
      geometryVariation: 0.01   // 1% 几何差异
    };
    
    this.vibrationalModes = {
      // 平移模态（摆动）
      translational: {
        frequency: baseFreq * (1.0 + asymmetry.lengthVariation),
        damping: 0.02,
        // X和Y方向的频率略有不同
        freqRatio: 1.0 + asymmetry.geometryVariation * 2
      },
      
      // 垂直模态（弹跳）
      vertical: {
        frequency: baseFreq * Math.sqrt(4) * (1.0 + asymmetry.stiffnessVariation), // 更高频
        damping: 0.05
      },
      
      // 旋转模态
      rotational: {
        roll: {
          frequency: baseFreq * 0.8 * (1.0 - asymmetry.geometryVariation),
          damping: 0.03
        },
        pitch: {
          frequency: baseFreq * 0.8 * (1.0 + asymmetry.geometryVariation),
          damping: 0.03
        },
        yaw: {
          frequency: baseFreq * 0.6, // 扭转模态频率更低
          damping: 0.04
        }
      },
      
      // 模态耦合强度
      coupling: {
        xy: 0.1,                    // X-Y平移耦合
        translationRotation: 0.05,  // 平移-旋转耦合
        verticalTorsion: 0.02       // 垂直-扭转耦合
      }
    };
    
    // 添加随机扰动（模拟实际系统的不完美性）
    this.addModalPerturbations(0.1);
  }
  
  /**
   * 添加模态扰动
   * 模拟实际系统的不完美性和随机性
   */
  addModalPerturbations(intensity = 0.1) {
    const rand = () => (Math.random() - 0.5) * 2 * intensity;
    
    // 对各个模态频率添加小的随机变化
    this.vibrationalModes.translational.frequency *= (1 + rand() * 0.5);
    this.vibrationalModes.vertical.frequency *= (1 + rand() * 0.3);
    
    this.vibrationalModes.rotational.roll.frequency *= (1 + rand() * 0.4);
    this.vibrationalModes.rotational.pitch.frequency *= (1 + rand() * 0.4);
    this.vibrationalModes.rotational.yaw.frequency *= (1 + rand() * 0.6);
    
    // 对耦合强度添加变化
    this.vibrationalModes.coupling.xy *= (1 + rand());
    this.vibrationalModes.coupling.translationRotation *= (1 + rand());
    this.vibrationalModes.coupling.verticalTorsion *= (1 + rand());
  }
  
  /**
   * 初始化振动模式
   * 创建多个不同频率和相位的振动
   */
  initializeOscillationModes() {
    // 基础频率（Hz）
    const baseFreq = 2 * Math.PI * 0.5; // 0.5 Hz
    
    // 使用预设或默认的频率比例
    const freqRatios = this.nextFreqRatios || {
      x: [1.0, 2.1],  // X方向：基频和略高于2倍频
      y: [1.0, 1.9]   // Y方向：基频和略低于2倍频
    };
    
    // 清除nextFreqRatios
    this.nextFreqRatios = null;
    
    // 创建振动模式
    this.oscillationModes = {
      x: [
        {
          frequency: baseFreq * freqRatios.x[0],
          amplitude: Math.abs(this.velocity.x) * 0.5 || 0.1,
          phase: Math.random() * 2 * Math.PI,
          damping: this.airDamping * 0.1
        },
        {
          frequency: baseFreq * freqRatios.x[1],
          amplitude: Math.abs(this.velocity.x) * 0.3 || 0.05,
          phase: Math.random() * 2 * Math.PI,
          damping: this.airDamping * 0.15
        }
      ],
      y: [
        {
          frequency: baseFreq * freqRatios.y[0],
          amplitude: Math.abs(this.velocity.y) * 0.5 || 0.1,
          phase: Math.random() * 2 * Math.PI,
          damping: this.airDamping * 0.1
        },
        {
          frequency: baseFreq * freqRatios.y[1],
          amplitude: Math.abs(this.velocity.y) * 0.3 || 0.05,
          phase: Math.random() * 2 * Math.PI,
          damping: this.airDamping * 0.15
        }
      ],
      z: {
        frequency: baseFreq * 2,
        amplitude: 0.02,
        phase: 0,
        damping: this.airDamping * 0.2
      },
      rotation: {
        frequency: baseFreq * 0.7,
        amplitude: 0.05,
        phase: Math.random() * 2 * Math.PI,
        damping: this.airDamping * 0.1
      }
    };
  }
  
  /**
   * 获取系统总能量
   */
  getTotalEnergy() {
    // 动能：线性 + 旋转
    const linearKE = 0.5 * this.mass * (
      this.velocity.x * this.velocity.x + 
      this.velocity.y * this.velocity.y + 
      this.velocity.z * this.velocity.z
    );
    
    const rotationalKE = 0.5 * (
      this.momentOfInertia.Ixx * this.angularVelocity.roll * this.angularVelocity.roll +
      this.momentOfInertia.Iyy * this.angularVelocity.pitch * this.angularVelocity.pitch +
      this.momentOfInertia.Izz * this.angularVelocity.yaw * this.angularVelocity.yaw
    );
    
    // 重力势能
    const gravitationalPE = this.mass * this.gravity * this.position.z;
    
    // 弹性势能（绳索拉伸）
    const tensions = this.calculateRopeTensions();
    let elasticPE = 0;
    for (const tension of tensions) {
      if (tension.extension > 0) {
        elasticPE += 0.5 * this.ropeStiffness * tension.extension * tension.extension;
      }
    }
    
    return {
      kinetic: linearKE + rotationalKE,
      potential: gravitationalPE + elasticPE,
      total: linearKE + rotationalKE + gravitationalPE + elasticPE
    };
  }
  
  /**
   * 检查系统是否基本静止
   */
  isAtRest(threshold = 0.001) {
    const speed = Math.sqrt(
      this.velocity.x * this.velocity.x + 
      this.velocity.y * this.velocity.y + 
      this.velocity.z * this.velocity.z
    );
    
    const angularSpeed = Math.sqrt(
      this.angularVelocity.roll * this.angularVelocity.roll +
      this.angularVelocity.pitch * this.angularVelocity.pitch +
      this.angularVelocity.yaw * this.angularVelocity.yaw
    );
    
    return speed < threshold && angularSpeed < threshold;
  }
  
  /**
   * 重置到初始状态
   */
  reset() {
    this.position = { ...this.equilibriumPosition };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.rotation = { roll: 0, pitch: 0, yaw: 0 };
    this.angularVelocity = { roll: 0, pitch: 0, yaw: 0 };
    this.time = 0;
  }
  
  /**
   * 应用外部扰动（用户拖拽设置初始条件）
   */
  applyDisplacement(dx, dy, dz = 0) {
    this.position.x += dx;
    this.position.y += dy;
    this.position.z += dz;
  }
  
  /**
   * 应用外部推力（模拟人手推动画板）
   * @param {Object} forceParams - 推力参数
   *   - direction: 推力方向角度（弧度），0为+X方向
   *   - magnitude: 推力大小（牛顿）
   *   - duration: 推力持续时间（秒）
   *   - applicationPoint: 推力作用点在画板上的相对位置 {x, y}，范围[-1,1]
   *   - verticalComponent: 垂直方向的推力分量（向上为正）
   */
  applyExternalForce(forceParams = {}) {
    // 重置模态系统和状态
    this.vibrationalModes = null;
    this.reset(); // 重置到平衡位置
    
    // 默认参数
    const params = {
      direction: forceParams.direction || 0, // 推力方向（弧度）
      magnitude: forceParams.magnitude || 100, // 推力大小（N）
      duration: forceParams.duration || 0.1, // 推力持续时间（s）
      applicationPoint: forceParams.applicationPoint || { x: 0, y: 0 }, // 作用点
      verticalComponent: forceParams.verticalComponent || 0, // 垂直分量（N）
      ...forceParams
    };
    
    console.log('应用外部推力:', params);
    
    // 计算推力的各个分量
    const forceX = params.magnitude * Math.cos(params.direction);
    const forceY = params.magnitude * Math.sin(params.direction);
    const forceZ = params.verticalComponent;
    
    // 计算冲量（推力 × 持续时间）
    const impulseX = forceX * params.duration;
    const impulseY = forceY * params.duration;
    const impulseZ = forceZ * params.duration;
    
    // 应用线性冲量（改变质心速度）
    this.velocity.x += impulseX / this.mass;
    this.velocity.y += impulseY / this.mass;
    this.velocity.z += impulseZ / this.mass;
    
    // 计算推力作用点的世界坐标
    const applicationWorldPoint = {
      x: this.position.x + params.applicationPoint.x * this.width / 2,
      y: this.position.y + params.applicationPoint.y * this.height / 2,
      z: this.position.z
    };
    
    // 计算力矩臂（从质心到作用点的向量）
    const leverArm = {
      x: applicationWorldPoint.x - this.position.x,
      y: applicationWorldPoint.y - this.position.y,
      z: applicationWorldPoint.z - this.position.z
    };
    
    // 计算力矩（τ = r × F）
    const torqueX = leverArm.y * forceZ - leverArm.z * forceY;
    const torqueY = leverArm.z * forceX - leverArm.x * forceZ;
    const torqueZ = leverArm.x * forceY - leverArm.y * forceX;
    
    // 计算角冲量（力矩 × 持续时间）
    const angularImpulseX = torqueX * params.duration;
    const angularImpulseY = torqueY * params.duration;
    const angularImpulseZ = torqueZ * params.duration;
    
    // 应用角冲量（改变角速度）
    this.angularVelocity.roll += angularImpulseX / this.momentOfInertia.Ixx;
    this.angularVelocity.pitch += angularImpulseY / this.momentOfInertia.Iyy;
    this.angularVelocity.yaw += angularImpulseZ / this.momentOfInertia.Izz;
    
    // 添加一些随机性（模拟手动推动的不精确性）
    const randomFactor = 0.1;
    this.velocity.x += (Math.random() - 0.5) * randomFactor * Math.abs(this.velocity.x);
    this.velocity.y += (Math.random() - 0.5) * randomFactor * Math.abs(this.velocity.y);
    this.angularVelocity.roll += (Math.random() - 0.5) * randomFactor * Math.abs(this.angularVelocity.roll);
    this.angularVelocity.pitch += (Math.random() - 0.5) * randomFactor * Math.abs(this.angularVelocity.pitch);
    
    // 重置时间
    this.time = 0;
    
    // 记录推力信息（用于调试）
    this.lastAppliedForce = {
      ...params,
      resultingVelocity: { ...this.velocity },
      resultingAngularVelocity: { ...this.angularVelocity },
      impulse: { x: impulseX, y: impulseY, z: impulseZ },
      torque: { x: torqueX, y: torqueY, z: torqueZ }
    };
    
    return this.lastAppliedForce;
  }
  
  /**
   * 应用随机推力扰动
   * 模拟人手随机推动画板的多种方式
   */
  applyRandomPerturbation(intensity = 1.0) {
    // 随机生成推力参数（进一步减小推力保持在视野内）
    const forceParams = {
      direction: Math.random() * 2 * Math.PI, // 随机方向
      magnitude: (10 + Math.random() * 30) * intensity, // 10-40N (进一步减小)
      duration: (0.06 + Math.random() * 0.08) * intensity, // 0.06-0.14s (缩短时间)
      applicationPoint: {
        x: (Math.random() - 0.5) * 0.8, // -0.4到+0.4 (进一步减小范围)
        y: (Math.random() - 0.5) * 0.8  // -0.4到+0.4
      },
      verticalComponent: (Math.random() - 0.5) * 10 * intensity // ±5N垂直力 (进一步减小)
    };
    
    return this.applyExternalForce(forceParams);
  }
  
  /**
   * 预设的推力模式
   * 模拟不同的推动方式
   */
  applyForcePattern(patternName, intensity = 1.0) {
    const patterns = {
      // 水平推动（左右摆动）
      horizontal: {
        direction: 0,
        magnitude: 40 * intensity,  // 减小推力
        duration: 0.1,
        applicationPoint: { x: 0, y: 0 },
        verticalComponent: 0
      },
      
      // 垂直推动（上下弹跳）
      vertical: {
        direction: 0,
        magnitude: 0,
        duration: 0.08,
        applicationPoint: { x: 0, y: 0 },
        verticalComponent: 60 * intensity  // 减小推力
      },
      
      // 对角推动（复合运动）
      diagonal: {
        direction: Math.PI / 4,
        magnitude: 50 * intensity,  // 减小推力
        duration: 0.12,
        applicationPoint: { x: 0.2, y: 0.2 },  // 减小作用点偏移
        verticalComponent: 15 * intensity  // 减小推力
      },
      
      // 旋转推动（边缘推动产生转动）
      rotational: {
        direction: Math.PI / 2,
        magnitude: 30 * intensity,  // 减小推力
        duration: 0.15,
        applicationPoint: { x: 0.6, y: 0.4 },  // 减小作用点偏移
        verticalComponent: 0
      },
      
      // 中心推动（纯平移）
      central: {
        direction: Math.random() * 2 * Math.PI,
        magnitude: 45 * intensity,  // 减小推力
        duration: 0.1,
        applicationPoint: { x: 0, y: 0 },
        verticalComponent: 5 * intensity  // 减小推力
      },
      
      // 复合推动（同时产生平移和旋转）
      complex: {
        direction: Math.PI / 3,
        magnitude: 60 * intensity,  // 减小推力
        duration: 0.13,
        applicationPoint: { x: 0.3, y: -0.2 },  // 减小作用点偏移
        verticalComponent: 20 * intensity  // 减小推力
      }
    };
    
    const pattern = patterns[patternName] || patterns['complex'];
    return this.applyExternalForce(pattern);
  }
  
  /**
   * 设置特定的频率比例模式
   * 用于创建特定类型的李萨如图案
   */
  setFrequencyPattern(patternName) {
    // 清除现有模式
    this.oscillationModes = null;
    
    // 预设的频率模式
    const patterns = {
      'simple': { x: [1.0, 2.0], y: [1.0, 3.0] },
      'complex': { x: [1.0, 2.1], y: [1.0, 1.9] },
      'flower': { x: [3.0, 5.0], y: [2.0, 4.0] },
      'star': { x: [5.0, 7.0], y: [4.0, 6.0] },
      'spiral': { x: [1.0, 1.1], y: [1.0, 0.9] },
      'random': { 
        x: [1.0, 1.0 + Math.random() * 3], 
        y: [1.0, 1.0 + Math.random() * 3] 
      }
    };
    
    const pattern = patterns[patternName] || patterns['complex'];
    
    // 在下次update时将使用新的频率比例
    this.nextFreqRatios = pattern;
  }
  
  /**
   * 开始用户交互（拖拽）
   */
  startInteraction(x, y) {
    this.interactionStart = { x, y };
    this.initialPosition = { ...this.position };
  }
  
  /**
   * 更新用户交互位置
   */
  updateInteraction(x, y) {
    if (!this.interactionStart) return;
    
    const dx = x - this.interactionStart.x;
    const dy = y - this.interactionStart.y;
    
    this.position.x = this.initialPosition.x + dx;
    this.position.y = this.initialPosition.y + dy;
  }
  
  /**
   * 结束用户交互
   */
  endInteraction() {
    this.interactionStart = null;
    this.initialPosition = null;
  }
  
  /**
   * 设置初始速度
   */
  setInitialVelocity(vx, vy, vz = 0) {
    this.velocity.x = vx;
    this.velocity.y = vy;
    this.velocity.z = vz;
  }
  
  /**
   * 获取当前状态摘要
   */
  getState() {
    return {
      position: { ...this.position },
      velocity: { ...this.velocity },
      rotation: { ...this.rotation },
      angularVelocity: { ...this.angularVelocity },
      time: this.time,
      energy: this.getTotalEnergy(),
      isAtRest: this.isAtRest(),
      corners: this.getCornerPositions(),
      tensions: this.calculateRopeTensions()
    };
  }
}