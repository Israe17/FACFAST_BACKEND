const duration_pattern = /^(\d+)([smhd])$/i;

export function duration_to_milliseconds(value: string): number {
  const match = duration_pattern.exec(value);
  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  const amount = Number(match[1]);
  const unit = match[2].toLowerCase();
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  return amount * multipliers[unit];
}
