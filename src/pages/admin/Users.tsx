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
import { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreHorizontal, UserX, Shield, CheckCircle, XCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { AdminUser, usersAdminApi } from '@/lib/api';

const Users = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const { toast } = useToast();

  const loadUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await usersAdminApi.getAll();
      setUsers(data.users || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить пользователей',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const columns: ColumnDef<AdminUser>[] = [
    {
      accessorKey: 'name',
      header: 'User',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {(row.original.name || row.original.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{row.original.name || 'Без имени'}</p>
            <p className="text-xs text-muted-foreground">{row.original.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Роль',
      cell: ({ row }) => (
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${row.original.role === 'admin'
            ? 'bg-primary/10 text-primary'
            : 'bg-muted text-muted-foreground'
            }`}
        >
          {row.original.role === 'admin' && <Shield className="h-3 w-3" />}
          {row.original.role.charAt(0).toUpperCase() + row.original.role.slice(1)}
        </span>
      ),
    },
    {
      accessorKey: 'isVerified',
      header: 'Подтвержден',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          {row.original.isVerified ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-red-500" />
          )}
          <span className="text-sm text-muted-foreground">
            {row.original.isVerified ? 'Да' : 'Нет'}
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Дата регистрации',
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
            <DropdownMenuItem onClick={() => handleViewUser(row.original)}>
              <Eye className="mr-2 h-4 w-4" /> Детали
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleVerification(row.original)}>
              <Shield className="mr-2 h-4 w-4" />
              {row.original.isVerified ? 'Снять подтверждение' : 'Подтвердить'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteUser(row.original._id)}
            >
              <UserX className="mr-2 h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewUser = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleToggleVerification = async (user: AdminUser) => {
    try {
      setIsLoading(true);
      await usersAdminApi.update(user._id, { isVerified: !user.isVerified });
      toast({
        title: 'Пользователь обновлен',
        description: `Статус верификации обновлен.`,
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить пользователя',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этого пользователя?')) return;
    try {
      setIsLoading(true);
      await usersAdminApi.delete(id);
      toast({
        title: 'Пользователь удален',
        description: 'Пользователь успешно удален.',
      });
      loadUsers();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить пользователя',
        variant: 'destructive',
      });
    }
  };

  return (
    <div>
      <PageHeader
        title="Пользователи"
        description="Управление пользователями"
      />

      <DataTable
        columns={columns}
        data={users}
        searchKey="name"
        searchPlaceholder="Поиск пользователей..."
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Детали пользователя</DialogTitle>
          </DialogHeader>

          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
                  {selectedUser.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Роль</p>
                  <p className="font-semibold capitalize">{selectedUser.role}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <div className="flex items-center gap-2 mt-1">
                    {selectedUser.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">
                      {selectedUser.isVerified ? 'Подтвержден' : 'Не подтвержден'}
                    </span>
                  </div>
                </div>
                {selectedUser.phone && (
                  <div className="p-4 bg-muted/50 rounded-lg col-span-2">
                    <p className="text-sm text-muted-foreground">Телефон</p>
                    <p className="font-semibold">{selectedUser.phone}</p>
                  </div>
                )}
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Дата регистрации</p>
                <p className="font-semibold">
                  {new Date(selectedUser.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Закрыть
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
