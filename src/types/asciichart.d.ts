declare module "asciichart" {
  interface PlotOptions {
    height?: number;
    min?: number;
    max?: number;
    offset?: number;
    padding?: string;
    format?: (x: number) => string;
    colors?: number[];
  }

  function plot(data: number[], options?: PlotOptions): string;

  export { plot };
  export default { plot };
}
