export function shouldShowJobsPagination(total: number, pageSize: number) {
  return pageSize > 0 && total > pageSize;
}

export function hasNextJobsPage(page: number, pageSize: number, total: number) {
  if (page < 1 || pageSize <= 0) {
    return false;
  }
  return page * pageSize < total;
}
