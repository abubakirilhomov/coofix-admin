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
import { Eye, MoreHorizontal, Truck, Package, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

import { Order, ordersApi } from '@/lib/api';

const statusOptions = [
  { value: 'pending', label: 'Ожидает', icon: Package },
  { value: 'confirmed', label: 'Подтвержден', icon: CheckCircle },
  { value: 'shipped', label: 'Отправлен', icon: Truck },
  { value: 'delivered', label: 'Доставлен', icon: CheckCircle },
  { value: 'cancelled', label: 'Отменен', icon: XCircle },
];

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const { toast } = useToast();

  const loadOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await ordersApi.getAll();
      setOrders(data.orders || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить заказы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const columns: ColumnDef<Order>[] = [
    {
      accessorKey: 'orderNumber',
      header: 'Заказ',
      cell: ({ row }) => (
        <span className="font-mono font-medium">{row.original._id.substring(0, 6)}</span>
      ),
    },
    {
      accessorKey: 'user',
      header: 'Клиент',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.user.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
        </div>
      ),
    },
    {
      accessorKey: 'items',
      header: 'Товары',
      cell: ({ row }) => (
        <span>{row.original.items.length} шт.</span>
      ),
    },
    {
      accessorKey: 'total',
      header: 'Сумма',
      cell: ({ row }) => (
        <span className="font-semibold">₽{row.original.total.toFixed(2)}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Статус',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
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
            <DropdownMenuItem onClick={() => handleViewOrder(row.original)}>
              <Eye className="mr-2 h-4 w-4" /> Детали
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleUpdateStatus(row.original)}>
              <Truck className="mr-2 h-4 w-4" /> Изменить статус
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (selectedOrder && newStatus) {
      try {
        setIsSubmitting(true);
        await ordersApi.updateStatus(selectedOrder._id, newStatus);
        toast({
          title: 'Заказ обновлен',
          description: `Статус заказа ${selectedOrder._id.substring(0, 6)} изменен на ${newStatus}.`,
        });
        loadOrders();
        setIsDialogOpen(false);
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось обновить статус заказа',
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
        title="Заказы"
        description="Управление заказами и доставкой"
      />

      <DataTable
        columns={columns}
        data={orders}
        searchKey="orderNumber"
        searchPlaceholder="Поиск заказов..."
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Детали заказа
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">Информация о клиенте</h4>
                <p className="text-sm">{selectedOrder.user.name}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.user.email}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.phone}</p>
                <p className="text-sm text-muted-foreground mt-2">{selectedOrder.address}</p>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-semibold mb-2">Товары</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{item?.product?.name || 'Название товара'}</p>
                        <p className="text-xs text-muted-foreground">Кол-во: {item.quantity}</p>
                      </div>
                      <p className="font-semibold">₽{(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <span className="font-semibold">Итого</span>
                  <span className="font-bold text-lg">${selectedOrder.total.toFixed(2)}</span>
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

export default Orders;
