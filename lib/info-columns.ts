/** Container-query grid-column class for a Details block's column count (1–4).
 *  Static literals so the Tailwind scanner keeps them. Always 1 column on
 *  narrow containers; the chosen count once wide enough. */
export function infoColsClass(columns: number | undefined): string {
  switch (columns ?? 2) {
    case 1:
      return "@lg:grid-cols-1";
    case 3:
      return "@lg:grid-cols-3";
    case 4:
      return "@lg:grid-cols-4";
    default:
      return "@lg:grid-cols-2";
  }
}

export const INFO_MAX_COLUMNS = 4;
