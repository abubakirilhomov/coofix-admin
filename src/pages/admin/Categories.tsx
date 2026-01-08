import { useState } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Edit, Trash2, MoreHorizontal, FolderOpen, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useCallback } from 'react';
import { categoriesApi, Category } from '@/lib/api';

interface CategoryWithCount extends Category {
  productCount?: number;
}

const Categories = () => {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    image: [] as string[],
    parent: '',
  });
  const { toast } = useToast();

  const loadCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await categoriesApi.getAll();
      setCategories(data.categories || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить категории',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);
  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const columns: ColumnDef<CategoryWithCount>[] = [
    {
      accessorKey: 'image',
      header: 'Изображение',
      cell: ({ row }) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
          {row.original.image ? (
            <img
              src={row.original.image}
              alt={row.original.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <FolderOpen className="w-6 h-6 text-muted-foreground" />
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
    {
      accessorKey: 'parent',
      header: 'Родительская категория',
      cell: ({ row }) => row.original.parent?.name || '—',
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

  const handleEdit = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      image: category.image ? [category.image] : [],
      parent: category.parent?._id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту категорию?')) return;

    try {
      setIsLoading(true);
      await categoriesApi.delete(id);
      await loadCategories();
      toast({
        title: 'Категория удалена',
        description: 'Категория успешно удалена.',
      });
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить категорию',
        variant: 'destructive',
      });
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      image: [],
      parent: '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      const data = {
        name: formData.name,
        image: formData.image[0],
        parent: formData.parent && formData.parent !== 'none' ? formData.parent : undefined,
      };

      if (editingCategory) {
        await categoriesApi.update(editingCategory._id, data);
        toast({
          title: 'Категория обновлена',
          description: 'Категория успешно сохранена.',
        });
      } else {
        await categoriesApi.create(data);
        toast({
          title: 'Категория создана',
          description: 'Новая категория успешно добавлена.',
        });
      }
      loadCategories();
      setIsDialogOpen(false);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сохранить категорию',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Категории"
        description="Управление категориями товаров"
        action={{ label: 'Добавить категорию', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={categories}
        searchKey="name"
        searchPlaceholder="Поиск категорий..."
        isLoading={isLoading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Редактировать категорию' : 'Новая категория'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Название категории</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="parent">Родительская категория (опционально)</Label>
                <Select
                  value={formData.parent}
                  onValueChange={(value) => setFormData({ ...formData, parent: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите родительскую категорию" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Нет</SelectItem>
                    {categories
                      ?.filter((c) => !c.parent && c._id !== editingCategory?._id)
                      ?.map((cat) => (
                        <SelectItem key={cat._id} value={cat._id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Изображение категории</Label>
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
                  editingCategory ? 'Сохранить' : 'Создать'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;
