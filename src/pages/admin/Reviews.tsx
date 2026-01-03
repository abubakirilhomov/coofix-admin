import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ColumnDef } from '@tanstack/react-table';
import { Trash2, MoreHorizontal, Eye, Star, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

import { Review, reviewsApi } from '@/lib/api';

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();

  const loadReviews = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await reviewsApi.getAll();
      setReviews(data.reviews || []);
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить отзывы',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${star <= rating ? 'fill-warning text-warning' : 'text-muted-foreground/30'
              }`}
          />
        ))}
      </div>
    );
  };

  const columns: ColumnDef<Review>[] = [
    {
      accessorKey: 'user',
      header: 'Пользователь',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
            {row.original.user.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-sm">{row.original.user.name}</p>
            <p className="text-xs text-muted-foreground">{row.original.user.email}</p>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'product',
      header: 'Товар',
      cell: ({ row }) => (
        <p className="font-medium text-sm max-w-[200px] truncate">
          {row.original.product.name}
        </p>
      ),
    },
    {
      accessorKey: 'rating',
      header: 'Оценка',
      cell: ({ row }) => renderStars(row.original.rating),
    },
    {
      accessorKey: 'text',
      header: 'Отзыв',
      cell: ({ row }) => (
        <p className="text-sm text-muted-foreground max-w-[300px] truncate">
          {row.original.text}
        </p>
      ),
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
            <DropdownMenuItem onClick={() => handleViewReview(row.original)}>
              <Eye className="mr-2 h-4 w-4" /> Просмотр
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteClick(row.original)}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Удалить
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const handleViewReview = (review: Review) => {
    setSelectedReview(review);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (selectedReview) {
      try {
        setIsSubmitting(true);
        await reviewsApi.adminDelete(selectedReview._id);
        toast({
          title: 'Отзыв удален',
          description: 'Отзыв успешно удален.',
        });
        loadReviews();
        setIsDeleteDialogOpen(false);
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Не удалось удалить отзыв',
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
        title="Отзывы"
        description="Модерация отзывов о товарах"
      />

      <DataTable
        columns={columns}
        data={reviews}
        searchPlaceholder="Поиск отзывов..."
        isLoading={isLoading}
      />

      {/* View Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Детали отзыва</DialogTitle>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {selectedReview.user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold">{selectedReview.user.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedReview.user.email}</p>
                </div>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Товар</p>
                <p className="font-medium">{selectedReview.product.name}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Оценка:</span>
                {renderStars(selectedReview.rating)}
                <span className="font-semibold">({selectedReview.rating}/5)</span>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Отзыв</p>
                <p className="text-sm leading-relaxed">{selectedReview.text}</p>
              </div>

              <div className="text-xs text-muted-foreground">
                Posted on {new Date(selectedReview.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Закрыть
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  Удалить отзыв
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Удалить отзыв</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить этот отзыв? Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Удаление...
                </>
              ) : (
                'Удалить'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reviews;
