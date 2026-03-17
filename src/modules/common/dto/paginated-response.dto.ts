export class PaginatedResponseDto<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.total_pages = Math.ceil(total / limit);
  }
}
