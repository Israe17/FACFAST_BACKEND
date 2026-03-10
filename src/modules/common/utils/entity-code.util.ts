export function build_entity_code(prefix: string, id: number): string {
  const numeric = id.toString().padStart(4, '0');
  return `${prefix}-${numeric}`;
}

export function build_entity_code_pattern(prefix: string): RegExp {
  return new RegExp(`^${prefix}-\\d{4,}$`);
}
