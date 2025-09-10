/**
 * EventBus - 中央事件总线
 * 负责模块间的通信和解耦
 */
export class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.debug = false;
  }

  /**
   * 订阅事件
   */
  on(event, handler, context = null) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event).push({
      handler,
      context,
      id: Symbol('event-handler')
    });

    if (this.debug) {
      console.log(`[EventBus] Subscribed to: ${event}`);
    }

    return () => this.off(event, handler);
  }

  /**
   * 订阅一次性事件
   */
  once(event, handler, context = null) {
    const wrappedHandler = (...args) => {
      handler.apply(context, args);
      this.off(event, wrappedHandler);
    };

    return this.on(event, wrappedHandler, context);
  }

  /**
   * 取消订阅
   */
  off(event, handler) {
    if (!this.events.has(event)) return;

    const handlers = this.events.get(event);
    const index = handlers.findIndex(h => h.handler === handler);
    
    if (index !== -1) {
      handlers.splice(index, 1);
      if (this.debug) {
        console.log(`[EventBus] Unsubscribed from: ${event}`);
      }
    }

    if (handlers.length === 0) {
      this.events.delete(event);
    }
  }

  /**
   * 发布事件
   */
  emit(event, data = null) {
    if (this.debug) {
      console.log(`[EventBus] Emitting: ${event}`, data);
    }

    this.addToHistory(event, data);

    if (!this.events.has(event)) return;

    const handlers = this.events.get(event);
    handlers.forEach(({ handler, context }) => {
      try {
        handler.call(context, data);
      } catch (error) {
        console.error(`[EventBus] Error in handler for ${event}:`, error);
      }
    });
  }

  /**
   * 异步发布事件
   */
  async emitAsync(event, data = null) {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.emit(event, data);
        resolve();
      }, 0);
    });
  }

  /**
   * 清除所有事件监听器
   */
  clear(event = null) {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }

  /**
   * 添加到历史记录
   */
  addToHistory(event, data) {
    this.eventHistory.push({
      event,
      data,
      timestamp: Date.now()
    });

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * 获取事件历史
   */
  getHistory(event = null) {
    if (event) {
      return this.eventHistory.filter(h => h.event === event);
    }
    return [...this.eventHistory];
  }

  /**
   * 启用/禁用调试模式
   */
  setDebug(enabled) {
    this.debug = enabled;
  }
}

// 创建单例
export default new EventBus();