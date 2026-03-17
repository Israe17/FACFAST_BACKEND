import { Brackets, ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { PaginatedQueryDto } from '../dto/paginated-query.dto';
import { PaginatedResponseDto } from '../dto/paginated-response.dto';
import { CursorQueryDto } from '../dto/cursor-query.dto';
import { CursorResponseDto } from '../dto/cursor-response.dto';

/**
 * Apply ILIKE search across multiple columns.
 * Uses OR logic: a row matches if any column contains the search term.
 */
export function apply_search<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  search: string | undefined,
  columns: string[],
): SelectQueryBuilder<T> {
  if (!search?.trim() || columns.length === 0) {
    return qb;
  }

  const term = `%${search.trim()}%`;
  qb.andWhere(
    new Brackets((sub) => {
      columns.forEach((column, index) => {
        const param = `search_term_${index}`;
        if (index === 0) {
          sub.where(`${column} ILIKE :${param}`, { [param]: term });
        } else {
          sub.orWhere(`${column} ILIKE :${param}`, { [param]: term });
        }
      });
    }),
  );

  return qb;
}

/**
 * Apply ORDER BY with an allowed-columns whitelist.
 * Falls back to default_column / default_order when sort_by is not allowed.
 */
export function apply_sorting<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  sort_by: string | undefined,
  sort_order: 'ASC' | 'DESC' | undefined,
  allowed_columns: Record<string, string>,
  default_column: string,
  default_order: 'ASC' | 'DESC' = 'ASC',
): SelectQueryBuilder<T> {
  const resolved_column =
    sort_by && allowed_columns[sort_by]
      ? allowed_columns[sort_by]
      : default_column;
  const resolved_order = sort_order ?? default_order;

  qb.orderBy(resolved_column, resolved_order);

  return qb;
}

/**
 * Apply offset-based pagination and return a PaginatedResponseDto.
 */
export async function apply_pagination<T extends ObjectLiteral, R>(
  qb: SelectQueryBuilder<T>,
  query: PaginatedQueryDto,
  mapper: (entity: T) => R,
): Promise<PaginatedResponseDto<R>> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const [entities, total] = await qb
    .skip((page - 1) * limit)
    .take(limit)
    .getManyAndCount();

  return new PaginatedResponseDto(entities.map(mapper), total, page, limit);
}

/**
 * Apply cursor-based (keyset) pagination and return a CursorResponseDto.
 * Assumes the cursor is based on the entity's `id` column.
 */
export async function apply_cursor<T extends ObjectLiteral, R>(
  qb: SelectQueryBuilder<T>,
  query: CursorQueryDto,
  id_column: string,
  mapper: (entity: T) => R,
): Promise<CursorResponseDto<R>> {
  const limit = query.limit ?? 20;
  const sort_order = query.sort_order ?? 'DESC';

  if (query.cursor !== undefined) {
    if (sort_order === 'DESC') {
      qb.andWhere(`${id_column} < :cursor`, { cursor: query.cursor });
    } else {
      qb.andWhere(`${id_column} > :cursor`, { cursor: query.cursor });
    }
  }

  // Fetch one extra to determine has_more
  const entities = await qb.take(limit + 1).getMany();
  const has_more = entities.length > limit;
  const page_data = has_more ? entities.slice(0, limit) : entities;
  const next_cursor =
    page_data.length > 0
      ? ((page_data[page_data.length - 1] as Record<string, unknown>)[
          'id'
        ] as number)
      : null;

  return new CursorResponseDto(page_data.map(mapper), next_cursor, has_more);
}
