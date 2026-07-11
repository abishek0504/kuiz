export const appVersion = "1.0.0";

export function compareVersions(left: string, right: string): number | undefined {
  const parse = (value: string) => {
    const match = value.match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/u);
    return match ? match.slice(1, 4).map(Number) : undefined;
  };
  const leftParts = parse(left);
  const rightParts = parse(right);
  if (!leftParts || !rightParts) return undefined;
  for (let index = 0; index < 3; index += 1) {
    if (leftParts[index] !== rightParts[index]) return leftParts[index] - rightParts[index];
  }
  return 0;
}
