# Harmonograph Generator - 模块化架构设计

## 架构概览

项目采用模块化、事件驱动的架构设计，各模块之间通过明确的接口和事件系统进行通信。

```
┌─────────────────────────────────────────────────────────┐
│                      Application Core                     │
│                    (Event Bus & DI Container)            │
└─────────────────────────────────────────────────────────┘
                              │
     ┌────────────────────────┼────────────────────────┐
     │                        │                        │
┌────▼─────┐          ┌───────▼────────┐      ┌───────▼────────┐
│  Physics │          │    Renderer    │      │       UI       │
│  Module  │◄─────────┤    Module      │◄─────┤    Module      │
└──────────┘          └────────────────┘      └────────────────┘
     │                        │                        │
     │                  ┌─────▼─────┐                 │
     │                  │   State   │                 │
     └─────────────────►│  Manager  │◄────────────────┘
                        └───────────┘
```

## 核心模块

### 1. Core (核心层)
**职责**: 提供基础设施和模块管理
- `EventBus`: 事件总线，处理模块间通信
- `ModuleManager`: 模块生命周期管理
- `ServiceContainer`: 依赖注入容器
- `Logger`: 统一日志系统

### 2. Physics Module (物理引擎)
**职责**: 处理所有物理计算和模拟
- `Pendulum`: 单摆物理模型
- `PendulumSystem`: 多摆系统管理
- `PhysicsEngine`: 物理计算引擎
- `Equations`: 物理公式和算法

**接口**:
```javascript
interface IPhysicsModule {
  initialize(config: PhysicsConfig): void;
  update(deltaTime: number): void;
  getPendulumPosition(id: string): Point;
  updatePendulumParams(id: string, params: PendulumParams): void;
  reset(): void;
}
```

### 3. Renderer Module (渲染器)
**职责**: 处理所有绘图和渲染逻辑
- `CanvasRenderer`: Canvas 2D渲染器
- `WebGLRenderer`: WebGL 3D渲染器 (可选)
- `RenderPipeline`: 渲染管线
- `Effects`: 特效和滤镜

**接口**:
```javascript
interface IRendererModule {
  initialize(canvas: HTMLCanvasElement): void;
  render(points: Point[]): void;
  clear(): void;
  setStyle(style: DrawingStyle): void;
  getSnapshot(): ImageData;
}
```

### 4. UI Module (用户界面)
**职责**: 管理所有UI组件和布局
- `ControlPanel`: 控制面板组件
- `Canvas`: 画布组件
- `Toolbar`: 工具栏组件
- `PresetManager`: 预设管理器
- `ThemeManager`: 主题管理

**接口**:
```javascript
interface IUIModule {
  initialize(container: HTMLElement): void;
  updateControls(state: AppState): void;
  showNotification(message: string): void;
  toggleFullscreen(): void;
}
```

### 5. Input Module (输入处理)
**职责**: 统一处理用户输入
- `MouseHandler`: 鼠标事件处理
- `KeyboardHandler`: 键盘事件处理
- `TouchHandler`: 触摸事件处理
- `GestureRecognizer`: 手势识别

**接口**:
```javascript
interface IInputModule {
  initialize(): void;
  registerHandler(type: string, handler: Function): void;
  unregisterHandler(type: string, handler: Function): void;
  setInputMode(mode: InputMode): void;
}
```

### 6. State Module (状态管理)
**职责**: 集中管理应用状态
- `StateManager`: 状态管理器
- `StateStore`: 状态存储
- `History`: 撤销/重做管理
- `Persistence`: 状态持久化

**接口**:
```javascript
interface IStateModule {
  getState(): AppState;
  setState(state: Partial<AppState>): void;
  subscribe(callback: StateChangeCallback): void;
  undo(): void;
  redo(): void;
  saveToStorage(): void;
  loadFromStorage(): void;
}
```

### 7. Export Module (导出功能)
**职责**: 处理各种格式的导出
- `ImageExporter`: 图片导出 (PNG, JPEG)
- `VectorExporter`: 矢量导出 (SVG)
- `PDFExporter`: PDF导出
- `AnimationExporter`: 动画导出 (GIF, MP4)

**接口**:
```javascript
interface IExportModule {
  exportImage(format: ImageFormat, options: ExportOptions): Promise<Blob>;
  exportVector(format: VectorFormat): Promise<string>;
  exportAnimation(frames: Frame[], format: AnimationFormat): Promise<Blob>;
}
```

## 模块通信

### 事件系统
模块之间通过事件总线进行松耦合通信：

```javascript
// 事件定义
const Events = {
  PHYSICS_UPDATE: 'physics:update',
  RENDER_FRAME: 'render:frame',
  STATE_CHANGE: 'state:change',
  USER_INPUT: 'user:input',
  EXPORT_REQUEST: 'export:request'
};

// 发布事件
eventBus.emit(Events.PHYSICS_UPDATE, { positions: [...] });

// 订阅事件
eventBus.on(Events.STATE_CHANGE, (data) => {
  // Handle state change
});
```

### 依赖注入
使用服务容器管理模块依赖：

```javascript
// 注册服务
container.register('physics', PhysicsModule);
container.register('renderer', RendererModule);

// 获取服务
const physics = container.get('physics');
```

## 数据流

```
User Input → Input Module → Event Bus → State Manager
                                ↓
                          Physics Module
                                ↓
                          Renderer Module
                                ↓
                            Canvas Display
```

## 配置管理

每个模块都有独立的配置：

```javascript
// config/modules.config.js
export default {
  physics: {
    fps: 60,
    gravity: 9.81,
    damping: 0.995
  },
  renderer: {
    antialias: true,
    backgroundColor: '#ffffff',
    lineWidth: 1
  },
  ui: {
    theme: 'light',
    layout: 'default'
  }
};
```

## 错误处理

统一的错误处理机制：

```javascript
class ModuleError extends Error {
  constructor(module, message, code) {
    super(message);
    this.module = module;
    this.code = code;
  }
}

// 全局错误处理
errorHandler.catch(ModuleError, (error) => {
  logger.error(`Module ${error.module} error:`, error);
  // Graceful degradation
});
```

## 性能优化

1. **懒加载**: 按需加载模块
2. **Web Workers**: 物理计算在 Worker 中执行
3. **虚拟化**: UI 组件虚拟化渲染
4. **缓存**: 计算结果缓存
5. **批处理**: 批量更新DOM和Canvas

## 测试策略

每个模块独立测试：

```javascript
// tests/modules/physics.test.js
describe('PhysicsModule', () => {
  test('should calculate pendulum position correctly', () => {
    // Test implementation
  });
});
```

## 扩展性

新功能通过插件形式添加：

```javascript
class CustomEffectPlugin {
  install(renderer) {
    renderer.addEffect('custom', this.renderEffect);
  }
  
  renderEffect(context, params) {
    // Custom effect implementation
  }
}
```