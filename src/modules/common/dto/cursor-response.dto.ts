export class CursorResponseDto<T> {
  data: T[];
  next_cursor: number | null;
  has_more: boolean;

  constructor(data: T[], next_cursor: number | null, has_more: boolean) {
    this.data = data;
    this.next_cursor = next_cursor;
    this.has_more = has_more;
  }
}
