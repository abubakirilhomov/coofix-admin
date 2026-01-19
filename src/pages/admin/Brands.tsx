import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { ImageUpload, ImageItem } from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { Edit, Trash2, MoreHorizontal, Building2, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Brand, brandsApi } from '@/lib/api';
interface BrandWithCount extends Brand {
  productCount?: number;
}

import { PaginationState } from '@tanstack/react-table';

// ...

const Brands = () => {
  const [brands, setBrands] = useState<BrandWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 20,
  });
  const [pageCount, setPageCount] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: [] as ImageItem[],
  });
  const { toast } = useToast();

  const loadBrands = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await brandsApi.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      setBrands(data.brands || []);
      setPageCount(data.pages || 0);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить бренды',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, pagination]);

  useEffect(() => {
    loadBrands();
  }, [loadBrands]);

  const columns: ColumnDef<BrandWithCount>[] = [
    {
      accessorKey: 'logo',
      header: 'Логотип',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {row.original.image ? (
            <img
              src={row.original.image.url}
              alt={row.original.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Building2 className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
      ),
    },
    {
      accessorKey: 'name',
      header: 'Название бренда',
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground">{row.original.slug}</p>
        </div>
      ),
    },
    {
      accessorKey: 'productCount',
      header: 'Товары',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.productCount}</span>
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
            <DropdownMenuItem onClick={() => handleEdit(row.original)}>
              <Edit className="mr-2 h-4 w-4" /> Редактировать
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDelete(row.original._id)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleEdit = (brand: BrandWithCount) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      image: brand.image ? [brand.image] : [],
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить этот бренд?')) return;

    try {
      setIsLoading(true);
      await brandsApi.delete(id);
      await loadBrands();
      toast({
        title: 'Бренд удален',
        description: 'Бренд успешно удален.',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить бренд',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingBrand(null);
    setFormData({
      name: '',
      image: [],
    });

    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const data = {
        name: formData.name,
        image: formData.image.length ? formData.image[0] : null,
      };

      if (editingBrand) {
        await brandsApi.update(editingBrand._id, data);
        toast({
          title: 'Бренд обновлен',
          description: 'Бренд успешно обновлен.',
        });
      } else {
        await brandsApi.create(data);
        toast({
          title: 'Бренд создан',
          description: 'Новый бренд успешно добавлен.',
        });
      }
      loadBrands();
      setIsDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить бренд',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Бренды"
        description="Управление брендами товаров"
        action={{ label: 'Добавить бренд', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={brands}
        searchKey="name"
        searchPlaceholder="Поиск брендов..."
        isLoading={isLoading}
        pageCount={pageCount}
        pagination={pagination}
        onPaginationChange={setPagination}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBrand ? 'Редактировать бренд' : 'Новый бренд'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название бренда</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Логотип бренда</Label>
                <ImageUpload
                  value={formData.image}
                  onChange={(urls) => setFormData({ ...formData, image: urls })}
                  maxFiles={1}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  editingBrand ? 'Сохранить' : 'Создать'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Brands;
