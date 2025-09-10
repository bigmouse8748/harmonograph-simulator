/**
 * 预设配置
 * 经典的Harmonograph图案参数
 */

export const HARMONOGRAPH_PRESETS = {
  // 经典图案
  classic: {
    name: '经典图案',
    description: '传统的harmonograph图案',
    pendulums: [
      { axis: 'x', frequency: 2.01, amplitude: 200, phase: 0, damping: 0.995 },
      { axis: 'x', frequency: 3, amplitude: 100, phase: Math.PI / 2, damping: 0.995 },
      { axis: 'y', frequency: 2, amplitude: 200, phase: 0, damping: 0.995 },
      { axis: 'y', frequency: 3.01, amplitude: 100, phase: 0, damping: 0.995 }
    ]
  },
  
  // 花朵图案
  flower: {
    name: '花朵',
    description: '花朵形状的图案',
    pendulums: [
      { axis: 'x', frequency: 3, amplitude: 200, phase: 0, damping: 0.998 },
      { axis: 'x', frequency: 1, amplitude: 50, phase: 0, damping: 0.998 },
      { axis: 'y', frequency: 3, amplitude: 200, phase: Math.PI / 2, damping: 0.998 },
      { axis: 'y', frequency: 1, amplitude: 50, phase: Math.PI / 2, damping: 0.998 }
    ]
  },
  
  // 蝴蝶图案
  butterfly: {
    name: '蝴蝶',
    description: '蝴蝶形状的图案',
    pendulums: [
      { axis: 'x', frequency: 2, amplitude: 200, phase: 0, damping: 0.996 },
      { axis: 'x', frequency: 4, amplitude: 80, phase: 0, damping: 0.996 },
      { axis: 'y', frequency: 2, amplitude: 200, phase: Math.PI / 2, damping: 0.996 },
      { axis: 'y', frequency: 4.01, amplitude: 80, phase: Math.PI / 2, damping: 0.996 }
    ]
  },
  
  // 螺旋图案
  spiral: {
    name: '螺旋',
    description: '螺旋形状的图案',
    pendulums: [
      { axis: 'x', frequency: 1, amplitude: 250, phase: 0, damping: 0.99 },
      { axis: 'x', frequency: 1.01, amplitude: 100, phase: 0, damping: 0.99 },
      { axis: 'y', frequency: 1, amplitude: 250, phase: Math.PI / 2, damping: 0.99 },
      { axis: 'y', frequency: 1.01, amplitude: 100, phase: Math.PI / 2, damping: 0.99 }
    ]
  },
  
  // 星形图案
  star: {
    name: '星形',
    description: '星形图案',
    pendulums: [
      { axis: 'x', frequency: 5, amplitude: 200, phase: 0, damping: 0.997 },
      { axis: 'x', frequency: 2, amplitude: 80, phase: 0, damping: 0.997 },
      { axis: 'y', frequency: 5, amplitude: 200, phase: Math.PI / 10, damping: 0.997 },
      { axis: 'y', frequency: 2, amplitude: 80, phase: Math.PI / 10, damping: 0.997 }
    ]
  },
  
  // 李萨如图形
  lissajous: {
    name: '李萨如图',
    description: '简单的李萨如图形',
    pendulums: [
      { axis: 'x', frequency: 3, amplitude: 250, phase: 0, damping: 0.999 },
      { axis: 'y', frequency: 2, amplitude: 250, phase: Math.PI / 2, damping: 0.999 }
    ]
  },
  
  // 复杂图案
  complex: {
    name: '复杂图案',
    description: '多重频率叠加的复杂图案',
    pendulums: [
      { axis: 'x', frequency: 2.11, amplitude: 180, phase: 0, damping: 0.994 },
      { axis: 'x', frequency: 3.17, amplitude: 120, phase: Math.PI / 3, damping: 0.994 },
      { axis: 'x', frequency: 5.23, amplitude: 60, phase: Math.PI / 5, damping: 0.994 },
      { axis: 'y', frequency: 2.13, amplitude: 180, phase: Math.PI / 4, damping: 0.994 },
      { axis: 'y', frequency: 3.19, amplitude: 120, phase: Math.PI / 6, damping: 0.994 },
      { axis: 'y', frequency: 5.29, amplitude: 60, phase: Math.PI / 7, damping: 0.994 }
    ]
  },
  
  // 心形图案
  heart: {
    name: '心形',
    description: '心形图案',
    pendulums: [
      { axis: 'x', frequency: 2, amplitude: 200, phase: 0, damping: 0.996 },
      { axis: 'x', frequency: 2, amplitude: 100, phase: Math.PI, damping: 0.996 },
      { axis: 'y', frequency: 1, amplitude: 200, phase: 0, damping: 0.996 },
      { axis: 'y', frequency: 3, amplitude: 80, phase: 0, damping: 0.996 }
    ]
  },
  
  // 无限符号
  infinity: {
    name: '无限',
    description: '无限符号形状',
    pendulums: [
      { axis: 'x', frequency: 2, amplitude: 250, phase: 0, damping: 0.998 },
      { axis: 'y', frequency: 1, amplitude: 180, phase: Math.PI / 2, damping: 0.998 }
    ]
  },
  
  // 混沌图案
  chaos: {
    name: '混沌',
    description: '接近混沌的复杂运动',
    pendulums: [
      { axis: 'x', frequency: Math.PI, amplitude: 200, phase: 0, damping: 0.993 },
      { axis: 'x', frequency: Math.E, amplitude: 150, phase: 1, damping: 0.993 },
      { axis: 'y', frequency: Math.sqrt(2), amplitude: 200, phase: 2, damping: 0.993 },
      { axis: 'y', frequency: Math.sqrt(3), amplitude: 150, phase: 3, damping: 0.993 }
    ]
  }
};

/**
 * 生成随机预设
 */
export function generateRandomPreset() {
  const pendulumCount = 2 + Math.floor(Math.random() * 5); // 2-6个摆锤
  const pendulums = [];
  
  // 生成X轴摆锤
  const xCount = Math.ceil(pendulumCount / 2);
  for (let i = 0; i < xCount; i++) {
    pendulums.push({
      axis: 'x',
      frequency: 1 + Math.random() * 4,
      amplitude: 50 + Math.random() * 200,
      phase: Math.random() * Math.PI * 2,
      damping: 0.99 + Math.random() * 0.009
    });
  }
  
  // 生成Y轴摆锤
  const yCount = pendulumCount - xCount;
  for (let i = 0; i < yCount; i++) {
    pendulums.push({
      axis: 'y',
      frequency: 1 + Math.random() * 4,
      amplitude: 50 + Math.random() * 200,
      phase: Math.random() * Math.PI * 2,
      damping: 0.99 + Math.random() * 0.009
    });
  }
  
  return {
    name: '随机图案',
    description: '随机生成的参数',
    pendulums
  };
}

/**
 * 验证预设参数
 */
export function validatePreset(preset) {
  if (!preset || !preset.pendulums || !Array.isArray(preset.pendulums)) {
    return false;
  }
  
  return preset.pendulums.every(p => {
    return p.axis && (p.axis === 'x' || p.axis === 'y') &&
           typeof p.frequency === 'number' && p.frequency > 0 &&
           typeof p.amplitude === 'number' && p.amplitude > 0 &&
           typeof p.phase === 'number' &&
           typeof p.damping === 'number' && p.damping > 0 && p.damping <= 1;
  });
}

/**
 * 获取预设列表
 */
export function getPresetList() {
  return Object.keys(HARMONOGRAPH_PRESETS).map(key => ({
    id: key,
    ...HARMONOGRAPH_PRESETS[key]
  }));
}

/**
 * 获取预设
 */
export function getPreset(id) {
  return HARMONOGRAPH_PRESETS[id] || null;
}