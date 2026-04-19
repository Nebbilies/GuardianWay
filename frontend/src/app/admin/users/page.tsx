'use client'

import {Plus} from "lucide-react";
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

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        throw new Error('Failed to fetch: ' + res.statusText)
    }
    return res.json()
});

export default function UsersPage() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserWithProfiles | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [selectedRole, setSelectedRole] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<string>('createdAt');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

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
    } = useSWR<PaginatedResponse<UserWithProfiles>>(`${process.env.NEXT_PUBLIC_API_URL}/users?${params.toString()}`, fetcher);

    if (error) {
        return <div className={'p-8 bg-white'}>Lỗi khi tải dữ liệu: {error.message}</div>
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setSelectedUser(undefined);
    }

    const handleSubmit = async (data: any) => {
        setIsSubmitting(true);
        try {
            const url = data.id ? `${process.env.NEXT_PUBLIC_API_URL}/users/${data.id}` : `${process.env.NEXT_PUBLIC_API_URL}/users`;
            const method = data.id ? 'PUT' : 'POST';
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({message: res.statusText}));
                throw new Error(errorData.message || 'Đã xảy ra lỗi');
            }

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/${id}`, {
                method: 'DELETE',
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({message: res.statusText}));
                throw new Error(errorData.message || 'Đã xảy ra lỗi');
            }

            await mutate();
            toast.success('Người dùng đã được xóa thành công!');
        } catch (error) {
            console.error('Có lỗi khi xóa người dùng:', error);
            toast.error(error instanceof Error ? error.message : 'Đã xảy ra lỗi');
        } finally {
            setIsDeleting(false);
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
                    <Input
                        placeholder={'Tìm kiếm...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={'mr-4'}
                    />
                    <Button className={'gap-2'} onClick={handleAddUser}>
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
                        onSortChange={handleSortChange}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        isDeleting={isDeleting}
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
