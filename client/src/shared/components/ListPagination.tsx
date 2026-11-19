import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

type ListPaginationProps = {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
};

export function ListPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: ListPaginationProps) {
  const { t } = useTranslation();
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <p className="text-muted-foreground" aria-live="polite">
        {t("shop.paginationShowing", { first: firstItem, last: lastItem, total })}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label={t("shop.previousPage")}
        >
          {t("shop.previousPage")}
        </Button>
        <span className="text-muted-foreground">{t("shop.pageNumber", { page })}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page * pageSize >= total}
          onClick={() => onPageChange(page + 1)}
          aria-label={t("shop.nextPage")}
        >
          {t("shop.nextPage")}
        </Button>
      </div>
    </div>
  );
}
