interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map();

  start(name: string, metadata?: Record<string, any>): void {
    console.log(`Performance: Starting ${name}`, metadata);
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata
    });
  }

  end(name: string): number | null {
    const metric = this.metrics.get(name);
    if (!metric) {
      console.warn(`Performance: No metric found for ${name}`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    console.log(`Performance: ${name} completed in ${duration.toFixed(2)}ms`, metric.metadata);

    // Log performance warnings for slow operations
    if (duration > 1000) {
      console.warn(`Performance: ${name} took ${duration.toFixed(2)}ms (>1s)`, metric.metadata);
    }

    return duration;
  }

  getMetric(name: string): PerformanceMetric | undefined {
    return this.metrics.get(name);
  }

  getAllMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values());
  }

  clear(): void {
    this.metrics.clear();
  }

  // Monitor memory usage
  logMemoryUsage(context: string): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      console.log(`Memory usage (${context}):`, {
        used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
        limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)}MB`
      });
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();