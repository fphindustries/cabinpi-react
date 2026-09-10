import { useEffect, useRef } from 'react';
import { init, use as register, type EChartsType } from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, PolarComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';

register([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, MarkAreaComponent, PolarComponent, CanvasRenderer]);

export function EChart({ option, height = 400 }: { option: EChartsOption; height?: number }) {
  const element = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);
  useEffect(() => {
    if (!element.current) return;
    const instance = init(element.current);
    chart.current = instance;
    const observer = new ResizeObserver(() => instance.resize());
    observer.observe(element.current);
    return () => { observer.disconnect(); instance.dispose(); chart.current = null; };
  }, []);
  useEffect(() => { chart.current?.setOption(option, { notMerge: true }); }, [option]);
  return <div ref={element} style={{ height, width: '100%' }} role="img" aria-label="Sensor data chart" />;
}
