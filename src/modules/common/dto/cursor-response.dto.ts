export class CursorResponseDto<T> {
  data: T[];
  next_cursor: number | null;
  has_more: boolean;
  total: number;

  constructor(
    data: T[],
    next_cursor: number | null,
    has_more: boolean,
    total: number = 0,
  ) {
    this.data = data;
    this.next_cursor = next_cursor;
    this.has_more = has_more;
    this.total = total;
  }
}
