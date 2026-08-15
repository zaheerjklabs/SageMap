export function createBezierPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  direction: 'vertical' | 'horizontal' = 'vertical'
): string {
  if (direction === 'vertical') {
    const deltaY = endY - startY;
    const cpY1 = startY + deltaY * 0.45;
    const cpY2 = endY - deltaY * 0.45;
    return `M ${startX} ${startY} C ${startX} ${cpY1}, ${endX} ${cpY2}, ${endX} ${endY}`;
  } else {
    const deltaX = endX - startX;
    const cpX1 = startX + deltaX * 0.5;
    const cpX2 = endX - deltaX * 0.5;
    return `M ${startX} ${startY} C ${cpX1} ${startY}, ${cpX2} ${endY}, ${endX} ${endY}`;
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}
