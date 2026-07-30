'use client'

import { Plus } from "lucide-react";
import useSWR from 'swr';
import { School, PaginatedResponse } from "@/types/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormDialog } from "@/components/custom/form-dialog";
import CustomPagination from "@/components/custom/custom-pagination";
import TableSkeleton from "@/components/custom/table-skeleton";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { apiRequest } from "@/lib/api-client";
import SchoolsList from "@/app/platform/schools/_components/schools-list";
import SchoolForm, { SchoolFormValues } from "@/app/platform/schools/_components/school-form";
import SchoolAdminsDialog from "@/app/platform/schools/_components/school-admins-dialog";

const fetcher = <T,>(url: string) => apiRequest<T>(url);

export default function SchoolsPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | undefined>();
    const [adminsSchool, setAdminsSchool] = useState<School | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'DELETED_ONLY'>('ACTIVE');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearchTerm(searchTerm), 500);
        return () => clearTimeout(t);
    }, [searchTerm]);

    const params = new URLSearchParams();
    if (debouncedSearchTerm) params.set('search', debouncedSearchTerm);
    if (sortBy) params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
    if (statusFilter === 'DELETED_ONLY') params.set('deleted', 'only');
    if (currentPage > 1) params.set('page', currentPage.toString());

    const { data: schools, error, isLoading, mutate } = useSWR<PaginatedResponse<School>>(
        `/schools?${params.toString()}`, fetcher,
    );

    const handleSortChange = (key: string) => {
        if (sortBy === key) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortBy(key); setSortOrder('asc'); }
        setCurrentPage(1);
    };

    if (error) {
        return <div className={'p-8 bg-background'}>Lỗi khi tải dữ liệu: {error.message}</div>;
    }

    const handleCloseDialog = () => { setIsDialogOpen(false); setSelectedSchool(undefined); };

    const handleSubmit = async (data: SchoolFormValues & { id?: string }) => {
        setIsSubmitting(true);
        try {
            const { id, ...payload } = data;
            const url = id ? `/schools/${id}` : `/schools`;
            const method = id ? 'PUT' : 'POST';
            await apiRequest(url, { method, body: JSON.stringify(payload) });
            await mutate();
            toast.success(`Trường học đã được ${id ? 'cập nhật' : 'tạo'} thành công!`);
            handleCloseDialog();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsDeleting(true);
        try {
            await apiRequest(`/schools/${id}`, { method: 'DELETE' });
            await mutate();
            toast.success('Đã xóa trường học!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleRestore = async (id: string) => {
        setIsRestoring(true);
        try {
            await apiRequest(`/schools/${id}/restore`, { method: 'PATCH' });
            await mutate();
            toast.success('Đã khôi phục trường học!');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Đã xảy ra lỗi');
        } finally {
            setIsRestoring(false);
        }
    };

    return (
        <div className={'p-8 bg-background'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Trường học</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>Quản lý các trường học trên hệ thống</p>
                </div>
                <div className={'flex'}>
                    <Select value={statusFilter} onValueChange={(val: 'ACTIVE' | 'DELETED_ONLY') => { setStatusFilter(val); setCurrentPage(1); }}>
                        <SelectTrigger className={'mr-4 w-48'}>
                            <SelectValue placeholder={'Trạng thái'} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'ACTIVE'}>Đang hoạt động</SelectItem>
                            <SelectItem value={'DELETED_ONLY'}>Đã xóa</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input placeholder={'Tìm kiếm...'} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={'mr-4'} />
                    <Button className={'gap-2'} onClick={() => { setSelectedSchool(undefined); setIsDialogOpen(true); }} disabled={statusFilter === 'DELETED_ONLY'}>
                        <Plus className={'w-4 h-4'} />
                        Thêm trường học
                    </Button>
                </div>
            </div>
            {isLoading || !schools ? (
                <TableSkeleton columns={6} />
            ) : (
                <>
                    <SchoolsList
                        schools={schools}
                        onEdit={(school) => { setSelectedSchool(school); setIsDialogOpen(true); }}
                        onManageAdmins={(school) => setAdminsSchool(school)}
                        onDelete={handleDelete}
                        onRestore={handleRestore}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                        isRestoring={isRestoring}
                        isDeletedMode={statusFilter === 'DELETED_ONLY'}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination paginationData={schools.metadata} onPageChange={setCurrentPage} />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedSchool?.id ? 'Chỉnh sửa trường học' : 'Thêm trường học'}
                description={selectedSchool?.id ? 'Cập nhật thông tin trường học.' : 'Nhập thông tin để tạo trường học mới.'}
            >
                <SchoolForm initialData={selectedSchool} onSubmit={handleSubmit} onCancel={handleCloseDialog} isLoading={isSubmitting} />
            </FormDialog>
            <SchoolAdminsDialog
                key={adminsSchool?.id ?? 'none'}
                school={adminsSchool}
                onClose={() => setAdminsSchool(null)}
            />
        </div>
    );
}
