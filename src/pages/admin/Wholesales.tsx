import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, FileText, CheckCircle, XCircle, Clock, Loader2, Link as LinkIcon } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

import { WholesaleApplication, wholesaleApi } from '@/lib/api';

const statusOptions = [
    { value: 'new', label: 'Новая', icon: Clock },
    { value: 'processed', label: 'Обработана', icon: CheckCircle },
    { value: 'rejected', label: 'Отклонена', icon: XCircle },
];

import { PaginationState } from '@tanstack/react-table';

// ...

const Wholesales = () => {
    const [applications, setApplications] = useState<WholesaleApplication[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 20,
    });
    const [pageCount, setPageCount] = useState(0);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<WholesaleApplication | null>(null);
    const [newStatus, setNewStatus] = useState('');
    const { toast } = useToast();

    const loadApplications = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await wholesaleApi.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
            });
            setApplications(response.data || []);
            setPageCount(response.pages || 0);
        } catch (error) {
            toast({
                title: 'Ошибка',
                description: 'Не удалось загрузить заявки',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast, pagination]);

    useEffect(() => {
        loadApplications();
    }, [loadApplications]);

    const columns: ColumnDef<WholesaleApplication>[] = [
        {
            accessorKey: 'name',
            header: 'Имя',
            cell: ({ row }) => (
                <div className="font-medium">
                    {row.original.name} {row.original.surname}
                </div>
            ),
        },
        {
            accessorKey: 'contacts',
            header: 'Контакты',
            cell: ({ row }) => (
                <div>
                    <p className="text-sm">{row.original.email}</p>
                    <p className="text-xs text-muted-foreground">{row.original.phone}</p>
                </div>
            ),
        },
        {
            accessorKey: 'comment',
            header: 'Комментарий',
            cell: ({ row }) => (
                <div className="max-w-[200px] truncate text-sm text-muted-foreground" title={row.original.comment}>
                    {row.original.comment || '-'}
                </div>
            ),
        },
        {
            accessorKey: 'file',
            header: 'Файл',
            cell: ({ row }) => (
                row.original.file ? (
                    <a href={row.original.file} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline">
                        <LinkIcon className="h-3 w-3" />
                        <span className="text-xs">Открыть</span>
                    </a>
                ) : <span className="text-xs text-muted-foreground">-</span>
            )
        },
        {
            accessorKey: 'status',
            header: 'Статус',
            cell: ({ row }) => {
                const statusLabelMap: Record<string, string> = {
                    new: "Новая",
                    processed: "Обработана",
                    rejected: "Отклонена"
                }
                return <StatusBadge status={statusLabelMap[row.original.status] || row.original.status} />;
            },
        },
        {
            accessorKey: 'createdAt',
            header: 'Дата',
            cell: ({ row }) => (
                <span className="text-sm text-muted-foreground">
                    {new Date(row.original.createdAt).toLocaleDateString()}
                </span>
            ),
        },
        {
            id: 'actions',
            cell: ({ row }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewApplication(row.original)}>
                            <Eye className="mr-2 h-4 w-4" /> Детали
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    const handleViewApplication = (app: WholesaleApplication) => {
        setSelectedApplication(app);
        setNewStatus(app.status);
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        if (selectedApplication && newStatus) {
            try {
                setIsSubmitting(true);
                // @ts-ignore
                await wholesaleApi.updateStatus(selectedApplication._id, newStatus);
                toast({
                    title: 'Статус обновлен',
                    description: `Статус заявки изменен на ${newStatus}.`,
                });
                loadApplications();
                setIsDialogOpen(false);
            } catch (error) {
                toast({
                    title: 'Ошибка',
                    description: 'Не удалось обновить статус',
                    variant: 'destructive',
                });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div>
            <PageHeader
                title="Заявки оптовиков"
                description="Управление заявками на оптовое сотрудничество"
            />

            <DataTable
                columns={columns}
                data={applications}
                searchKey="name"
                searchPlaceholder="Поиск по имени..."
                isLoading={isLoading}
                pageCount={pageCount}
                pagination={pagination}
                onPaginationChange={setPagination}
            />

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            Детали заявки
                        </DialogTitle>
                    </DialogHeader>

                    {selectedApplication && (
                        <div className="space-y-6">
                            {/* Info */}
                            <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-muted-foreground">Имя</Label>
                                        <p className="font-medium">{selectedApplication.name}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Фамилия</Label>
                                        <p className="font-medium">{selectedApplication.surname}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Email</Label>
                                        <p className="font-medium">{selectedApplication.email}</p>
                                    </div>
                                    <div>
                                        <Label className="text-muted-foreground">Телефон</Label>
                                        <p className="font-medium">{selectedApplication.phone}</p>
                                    </div>
                                </div>

                                {selectedApplication.file && (
                                    <div className="pt-2">
                                        <Label className="text-muted-foreground block mb-1">Прикрепленный файл</Label>
                                        <a
                                            href={selectedApplication.file}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="inline-flex items-center gap-2 px-3 py-2 bg-background border rounded-md text-sm hover:bg-accent transition-colors"
                                        >
                                            <FileText className="h-4 w-4" />
                                            Скачать файл
                                        </a>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <Label className="text-muted-foreground">Комментарий</Label>
                                    <div className="mt-1 p-3 bg-background rounded border text-sm whitespace-pre-wrap">
                                        {selectedApplication.comment || "Нет комментария"}
                                    </div>
                                </div>
                            </div>

                            {/* Status Update */}
                            <div>
                                <Label>Изменить статус</Label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                    <SelectTrigger className="mt-2">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                <div className="flex items-center gap-2">
                                                    <option.icon className="h-4 w-4" />
                                                    {option.label}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex justify-end gap-3">
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                                    Закрыть
                                </Button>
                                <Button onClick={handleSubmit} disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Обновление...
                                        </>
                                    ) : (
                                        'Обновить статус'
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Wholesales;
