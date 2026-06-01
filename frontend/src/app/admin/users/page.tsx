'use client'

import {Download, Plus} from "lucide-react";
import useSWR from 'swr';
import {Button} from "@/components/ui/button";
import {UserWithProfiles, PaginatedResponse} from "@/types/types";
import {FormDialog} from "@/components/custom/form-dialog";
import UserForm from "@/app/admin/users/_components/users-form";
import CustomPagination from "@/components/custom/custom-pagination";
import {useEffect, useState} from "react";
import {toast} from "sonner";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import UsersList from "@/app/admin/users/_components/users-list";
import writeExcelFile from "write-excel-file/browser";
import { apiRequest } from "@/lib/api-client";

const fetcher = <T,>(url: string) => apiRequest<T>(url);

interface ExportUser {
    id: string;
    name: string;
    email: string;
    role: string;
    phoneNumber: string | null;
    address: string | null;
    studentId: string | null;
    studentClass: string | null;
    parentId: string | null;
    licenseNumber: string | null;
    createdAt: string;
    updatedAt: string;
}

interface ExportUsersResponse {
    data: ExportUser[];
    metadata: {
        total: number;
        exportedAt: string;
    };
}

type UserFormPayload = {
    id?: string;
    [key: string]: unknown;
};

const sanitizeExcelValue = (value: string | null | undefined) => {
    if (!value) {
        return '';
    }
    if (['=', '+', '-', '@'].includes(value[0])) {
        return `'${value}`;
    }
    return value;
};

export default function UsersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithProfiles | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [accountStatusFilter, setAccountStatusFilter] = useState<'ACTIVE' | 'DELETED_ONLY'>('ACTIVE');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);
    const [isRestoring, setIsRestoring] = useState(false);

    // debounce search term
    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, 500);

        return () => clearTimeout(delayDebounce);
    }, [searchTerm]);

    // Build URL params
    const params = new URLSearchParams();
    if (debouncedSearchTerm) {
        params.set('search', debouncedSearchTerm);
    }
    if (selectedRole && selectedRole !== 'ALL') {
        params.set('role', selectedRole);
    }
    if (sortBy) {
        params.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
    }
    if (accountStatusFilter === 'DELETED_ONLY') {
        params.set('deleted', 'only');
    }
    if (currentPage > 1) {
        params.set('page', currentPage.toString());
    }

    // sort change from children list
    const handleSortChange = (key: string) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(key);
            setSortOrder('asc');
        }
        setCurrentPage(1);
    }

    // page change from pagination
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    }

    // fetch users
    const {
        data: users,
        error,
        isLoading,
        mutate,
    } = useSWR<PaginatedResponse<UserWithProfiles>>(`/users?${params.toString()}`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedUser(undefined);
    }

    const handleSubmit = async (data: UserFormPayload) => {
        setIsSubmitting(true);
        try {
            // id is path param, not in body field
            const {id, ...payload} = data;
            const url = id ? `/users/${id}` : `/users`;
            const method = id ? 'PUT' : 'POST';
            await apiRequest(url, {
                method,
                body: JSON.stringify(payload),
            });

            await mutate();
            toast.success(`Người dùng đã được ${data.id ? 'cập nhật' : 'thêm'} thành công!`);
            handleCloseDialog();
        } catch (error) {
            console.error('Có lỗi khi lưu người dùng:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleAddUser = () => {
        setSelectedUser(undefined);
        setIsDialogOpen(true);
    }

    const handleEditUser = (user: UserWithProfiles) => {
        setSelectedUser(user);
        setIsDialogOpen(true);
    }

    const handleDeleteUser = async (id: string) => {
        setIsDeleting(true);
        try {
            await apiRequest(`/users/${id}`, {
                method: 'DELETE',
            });

            await mutate();
            toast.success('Người dùng đã được xóa thành công!');
        } catch (error) {
            console.error('Có lỗi khi xóa người dùng:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsDeleting(false);
        }
    }

    const handleRestoreUser = async (id: string) => {
        setIsRestoring(true);
        try {
            await apiRequest(`/users/${id}/restore`, {
                method: 'PATCH',
            });

            await mutate();
            toast.success('Người dùng đã được khôi phục thành công!');
        } catch (error) {
            console.error('Có lỗi khi khôi phục người dùng:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsRestoring(false);
        }
    }

    // export users
    const handleExportUsers = async () => {
        setIsExporting(true);
        try {
            const exportParams = new URLSearchParams();
            if (debouncedSearchTerm) {
                exportParams.set('search', debouncedSearchTerm);
            }
            if (selectedRole && selectedRole !== 'ALL') {
                exportParams.set('role', selectedRole);
            }
            if (sortBy) {
                exportParams.set('sort', sortOrder === 'desc' ? `-${sortBy}` : sortBy);
            }

            const result: ExportUsersResponse = await apiRequest(`/users/export?${exportParams.toString()}`);

            const objects = result.data.map((user) => (
                {
                    id: sanitizeExcelValue(user.id),
                    name: sanitizeExcelValue(user.name),
                    email: sanitizeExcelValue(user.email),
                    role: sanitizeExcelValue(user.role),
                    phoneNumber: sanitizeExcelValue(user.phoneNumber),
                    address: sanitizeExcelValue(user.address),
                    studentId: sanitizeExcelValue(user.studentId),
                    studentClass: sanitizeExcelValue(user.studentClass),
                    parentId: sanitizeExcelValue(user.parentId),
                    licenseNumber: sanitizeExcelValue(user.licenseNumber),
                    createdAt: new Date(user.createdAt),
                    updatedAt: new Date(user.updatedAt),
                }
            ));
            console.log('Objects to export:', objects);

            await writeExcelFile(objects
                ,
                {
                    schema: [
                        {column: 'ID', width: 20, type: String, value: (row) => row.id},
                        {column: 'Họ tên', width: 20, type: String, value: (row) => row.name},
                        {column: 'Email', width: 20, type: String, value: (row) => row.email},
                        {column: 'Vai trò', type: String, value: (row) => row.role},
                        {column: 'Số điện thoại', type: String, value: (row) => row.phoneNumber},
                        {column: 'Địa chỉ', width: 25, type: String, value: (row) => row.address},
                        {column: 'Mã học sinh', type: String, value: (row) => row.studentId},
                        {column: 'Lớp', type: String, value: (row) => row.studentClass},
                        {column: 'ID phụ huynh', type: String, value: (row) => row.parentId},
                        {column: 'Số GPLX', type: String, value: (row) => row.licenseNumber},
                        {column: 'Ngày tạo', type: Date, format: 'dd/mm/yyyy', value: (row) => row.createdAt},
                        {column: 'Ngày cập nhật', type: Date, format: 'dd/mm/yyyy', value: (row) => row.updatedAt},
                    ],
                    fileName: `gw-users-export-${new Date().toISOString().split('T')[0]}.xlsx`,
                }
            );

            toast.success(`Xuất ${result.metadata.total} người dùng thành công!`);
        } catch (error) {
            console.error('Có lỗi khi xuất danh sách người dùng:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div className={'p-8 bg-white'}>
            <div className={'flex justify-between mb-8 items-center'}>
                <div>
                    <h1 className={'text-4xl font-bold text-foreground'}>Danh sách người dùng</h1>
                    <p className={'text-muted-foreground mt-2 mb-4'}>
                        Quản lý tất cả người dùng trong hệ thống
                    </p>
                </div>
                <div className={'flex'}>
                    <Select value={selectedRole} onValueChange={(val) => {
                        setSelectedRole(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className={'mr-4 w-48'}>
                            <SelectValue placeholder={'Vai trò'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'ALL'}>Tất cả</SelectItem>
                            <SelectItem value={'ADMIN'}>Quản trị viên</SelectItem>
                            <SelectItem value={'STAFF'}>Nhân viên</SelectItem>
                            <SelectItem value={'DRIVER'}>Tài xế</SelectItem>
                            <SelectItem value={'STUDENT'}>Học sinh</SelectItem>
                            <SelectItem value={'PARENT'}>Phụ huynh</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={accountStatusFilter} onValueChange={(val: 'ACTIVE' | 'DELETED_ONLY') => {
                        setAccountStatusFilter(val);
                        setCurrentPage(1);
                    }}>
                        <SelectTrigger className={'mr-4 w-48'}>
                            <SelectValue placeholder={'Trạng thái'}/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={'ACTIVE'}>Đang hoạt động</SelectItem>
                            <SelectItem value={'DELETED_ONLY'}>Đã xóa</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2 mr-4'} onClick={handleExportUsers}
                            disabled={isExporting || accountStatusFilter === 'DELETED_ONLY'}>
                        <Download className={'w-4 h-4'}/>
                        {isExporting ? 'Đang xuất...' : 'Xuất Excel'}
                    </Button>
                    <Button className={'gap-2'} onClick={handleAddUser}
                            disabled={accountStatusFilter === 'DELETED_ONLY'}>
                        <Plus className={'w-4 h-4'}/>
                        Thêm người dùng
                    </Button>
                </div>
            </div>
            {isLoading || !users ? (
                <div className="bg-card border border-border rounded-lg p-8 text-center">
                    <p className="text-muted-foreground">Đang tải dữ liệu</p>
                </div>
            ) : (
                <>
                    <UsersList
                        users={users}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onRestore={handleRestoreUser}
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
                        isRestoring={isRestoring}
                        isDeletedMode={accountStatusFilter === 'DELETED_ONLY'}
                    />
                    <div className={'mt-4 flex justify-end'}>
                        <CustomPagination
                            paginationData={users.metadata}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </>
            )}
            <FormDialog
                isOpen={isDialogOpen}
                onClose={handleCloseDialog}
                title={selectedUser?.id ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
                description={selectedUser?.id ? 'Chỉnh sửa thông tin người dùng' : 'Nhập thông tin để thêm người dùng mới.'}
            >
                <UserForm
                    initialData={selectedUser}
                    onSubmit={handleSubmit}
                    onCancel={handleCloseDialog}
                    isLoading={isSubmitting}
                />
            </FormDialog>
        </div>
    )
}
