// src/pages/admin/products/index.tsx
import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Edit, Trash2, MoreHorizontal, Loader2, Image as ImageIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  productsApi,
  categoriesApi,
  brandsApi,
  Product,
  ProductInput,
} from '@/lib/api';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { KeyValueEditor } from '@/components/admin/KeyValueEditor';

const DEFAULT_FORM = {
  name: '',
  description: '',
  price: '',
  oldPrice: '',
  category: '',
  brand: '',
  images: [] as string[],
  quantity: '',
  isNew: false,
  isSale: false,
  characteristics: '',
};

const Products = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState(DEFAULT_FORM);

  // Сброс формы при открытии/закрытии диалога
  useEffect(() => {
    if (!isDialogOpen) {
      setEditingProduct(null);
      setFormData(DEFAULT_FORM);
    }
  }, [isDialogOpen]);

  const { data: productsResponse, isLoading: productsLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: () => productsApi.getAll(),
  });

  // Исправлено: скорее всего API возвращает просто массив, а не { categories: [...] }
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getAll,
    select: (data) => (Array.isArray(data) ? data : data.categories || []),
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: brandsApi.getAll,
    select: (data) => (Array.isArray(data) ? data : data.brands || []),
  });

  const products = productsResponse?.products || [];

  const createMutation = useMutation({
    mutationFn: (data: ProductInput) => productsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Готово', description: 'Товар создан' });
      setIsDialogOpen(false);
    },
    onError: (err: any) =>
      toast({
        title: 'Ошибка',
        description: err.message || 'Не удалось создать товар',
        variant: 'destructive',
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Готово', description: 'Товар обновлён' });
      setIsDialogOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast({ title: 'Удалено', description: 'Товар удалён' });
    },
  });

  const columns: ColumnDef<Product>[] = [
    // ... (колонки без изменений, они у тебя идеальны)
    {
      accessorKey: 'images',
      header: 'Фото',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {row.original.images?.[0] ? (
            <img
              src={row.original.images[0]}
              alt={row.original.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Название',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    { accessorKey: 'category.name', header: 'Категория' },
    { accessorKey: 'brand.name', header: 'Бренд' },
    {
      accessorKey: 'price',
      header: 'Цена',
      cell: ({ row }) => (
        <div>
          <p className="font-semibold">${row.original.price.toFixed(2)}</p>
          {row.original.oldPrice && (
            <p className="text-xs text-muted-foreground line-through">
              ${row.original.oldPrice.toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'quantity',
      header: 'Остаток',
      cell: ({ row }) => (
        <span className={row.original.quantity < 20 ? 'text-destructive font-medium' : ''}>
          {row.original.quantity}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Статус',
      cell: ({ row }) => (
        <div className="flex gap-2">
          {row.original.isNew && <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">New</span>}
          {row.original.isSale && <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">Sale</span>}
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => deleteMutation.mutate(row.original._id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price.toString(),
      oldPrice: product.oldPrice?.toString() ?? '',
      category: product.category._id,
      brand: product.brand._id,
      images: product.images || [],
      quantity: product.quantity.toString(),
      isNew: product.isNew || false,
      isSale: product.isSale || false,
      characteristics: product.characteristics
        ? JSON.stringify(product.characteristics, null, 2)
        : '',
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(DEFAULT_FORM);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Валидация JSON - больше не нужна, так как KeyValueEditor гарантирует валидный JSON
    let characteristics = {};
    if (formData.characteristics) {
      try {
        characteristics = JSON.parse(formData.characteristics);
      } catch (err) {
        // Fallback or ignore
      }
    }

    const price = parseFloat(formData.price);
    const oldPrice = formData.oldPrice ? parseFloat(formData.oldPrice) : undefined;
    const quantity = parseInt(formData.quantity) || 0;

    if (isNaN(price) || price <= 0) {
      toast({ title: 'Ошибка', description: 'Укажите корректную цену', variant: 'destructive' });
      return;
    }

    const data: Partial<ProductInput> = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price,
      oldPrice: oldPrice && !isNaN(oldPrice) ? oldPrice : undefined,
      category: formData.category,
      brand: formData.brand,
      images: formData.images,
      quantity,
      isNew: formData.isNew,
      isSale: formData.isSale,
      characteristics: Object.keys(characteristics).length > 0 ? characteristics : undefined,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, data });
    } else {
      createMutation.mutate(data as ProductInput);
    }
  };

  return (
    <div>
      <PageHeader
        title="Товары"
        description="Управление товарами в каталоге"
        action={{ label: 'Добавить товар', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={products}
        searchKey="name"
        searchPlaceholder="Поиск товаров..."
        isLoading={productsLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Редактировать товар' : 'Новый товар'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2">
                <Label>Название</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="col-span-2">
                <Label>Описание</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div>
                <Label>Цена</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Старая цена (опционально)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.oldPrice}
                  onChange={(e) => setFormData({ ...formData, oldPrice: e.target.value })}
                  placeholder="Оставьте пустым, если нет скидки"
                />
              </div>

              <div>
                <Label>Категория</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c: any) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Бренд</Label>
                <Select value={formData.brand} onValueChange={(v) => setFormData({ ...formData, brand: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите бренд" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => (
                      <SelectItem key={b._id} value={b._id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Количество на складе</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="flex gap-8 items-center">
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isNew} onCheckedChange={(v) => setFormData({ ...formData, isNew: v })} />
                  <Label>Новинка</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.isSale} onCheckedChange={(v) => setFormData({ ...formData, isSale: v })} />
                  <Label>Акция</Label>
                </div>
              </div>

              <div className="col-span-2">
                <Label>Изображения</Label>
                <ImageUpload
                  value={formData.images}
                  onChange={(urls) => setFormData({ ...formData, images: urls })}
                  maxFiles={5}
                />
              </div>

              <div className="col-span-2">
                <Label>Характеристики</Label>
                <KeyValueEditor
                  value={formData.characteristics}
                  onChange={(val) => setFormData({ ...formData, characteristics: val })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Отмена
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  editingProduct ? 'Сохранить' : 'Создать'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;