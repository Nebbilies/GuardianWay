export interface PaginationMetadata {
  currentPage: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  previousPage: number | null;
  nextPage: number | null;
  pageCount: number;
  totalCount: number;
}

export interface PaginatedResult<T> {
  data: T[];
  metadata: PaginationMetadata;
}
