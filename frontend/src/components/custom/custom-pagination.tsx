import { PaginationMetadata } from "@gw/shared"
import {
    Pagination,
    PaginationEllipsis,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
} from "@/components/ui/pagination";

interface CustomPaginationProps {
    paginationData: PaginationMetadata;
    onPageChange: (page: number) => void;
}

export default function CustomPagination({ paginationData, onPageChange }: CustomPaginationProps) {
    const { currentPage, isLastPage, isFirstPage, pageCount, nextPage, previousPage } = paginationData;
    return (
        <Pagination>
            <PaginationContent>
                <PaginationPrevious
                    aria-disabled={isFirstPage}
                    tabIndex={isFirstPage ? -1 : undefined}
                    className={
                        isFirstPage ? "pointer-events-none opacity-50" : undefined
                    }
                    onClick={() => !isFirstPage && previousPage && onPageChange(previousPage)}
                />
                {generatePageItems(currentPage, pageCount, onPageChange)}
                <PaginationNext
                    aria-disabled={isLastPage}
                    tabIndex={isLastPage ? -1 : undefined}
                    className={
                        isLastPage ? "pointer-events-none opacity-50" : undefined
                    }
                    onClick={() => !isLastPage && nextPage && onPageChange(nextPage)}
                />
            </PaginationContent>
        </Pagination>
    )
}

const generatePageItems = (currentPage: number, pageCount: number, onPageChange: (page: number) => void) => {
    const pageItems = [];
    for (let i = 1; i <= pageCount; i++) {
        if (i === 1 || i === pageCount || (i >= currentPage - 2 && i <= currentPage + 2)) {
            pageItems.push(
                <PaginationItem key={i}>
                    <PaginationLink
                        isActive={currentPage === i}
                        aria-current={currentPage === i ? "page" : undefined}
                        onClick={() => onPageChange(i)}
                    >
                        {i}
                    </PaginationLink>
                </PaginationItem>
            );
        } else if (
            (i === currentPage - 3 && currentPage > 4) || (i === currentPage + 3 && currentPage < pageCount - 3)
        ) {
            pageItems.push(<PaginationEllipsis key={`ellipsis-${i}`} />);
        }
    }
    return pageItems;
}