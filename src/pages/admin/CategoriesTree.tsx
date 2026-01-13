import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi, Category } from '@/lib/api';
import {
    ChevronRight,
    ChevronDown,
    Folder,
    FolderOpen,
    Plus,
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    PlusCircle,
    Loader2
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ImageUpload, ImageItem } from '@/components/admin/ImageUpload';
import { toast } from 'react-hot-toast';


interface TreeNodeProps {
    category: Category;
    level: number;
    expandedIds: Set<string>;
    toggleExpand: (id: string) => void;
    onAction: (action: 'edit' | 'create_sub' | 'delete', category: Category) => void;
}

interface CategoryModalState {
    isOpen: boolean;
    mode: 'create_root' | 'create_sub' | 'edit';
    category?: Category; // For edit
    parentId?: string;   // For create_sub
}

const filterTree = (nodes: Category[], query: string): { nodes: Category[], matches: Set<string> } => {
    const lowerQuery = query.toLowerCase();
    const matches = new Set<string>();

    const filter = (node: Category): boolean => {
        const nameMatch = node.name.toLowerCase().includes(lowerQuery);
        const childrenMatch = node.children ? node.children.some(child => filter(child)) : false;

        if (nameMatch || childrenMatch) {
            matches.add(node._id);
            return true;
        }
        return false;
    };

    const filteredNodes = nodes.filter(node => filter(node));
    return { nodes: filteredNodes, matches };
};

const getAllIds = (nodes: Category[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
        ids.push(node._id);
        if (node.children) {
            ids = [...ids, ...getAllIds(node.children)];
        }
    });
    return ids;
};

export default function CategoriesTree() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Modal States
    const [modalState, setModalState] = useState<CategoryModalState>({ isOpen: false, mode: 'create_root' });
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

    // Form Data
    const [formData, setFormData] = useState({ name: '', image: [] as ImageItem[] });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Queries
    const { data, isLoading, error } = useQuery({
        queryKey: ['categories-tree'],
        queryFn: categoriesApi.getTree,
    });

    const categories = data?.tree || [];

    // Mutations
    const createMutation = useMutation({
        mutationFn: categoriesApi.create,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
            toast.success('Категория создана');
            setModalState({ ...modalState, isOpen: false });
        },
        onError: (err: any) => toast.error(err.message || 'Ошибка создания')
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => categoriesApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
            toast.success('Категория обновлена');
            setModalState({ ...modalState, isOpen: false });
        },
        onError: (err: any) => toast.error(err.message || 'Ошибка обновления')
    });

    const deleteMutation = useMutation({
        mutationFn: categoriesApi.delete,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories-tree'] });
            toast.success('Категория удалена');
            setDeleteConfirmOpen(false);
        },
        onError: (err: any) => toast.error(err.message || 'Ошибка удаления')
    });

    // Search Logic
    const { filteredTree, searchMatches } = useMemo(() => {
        if (!searchQuery.trim()) return { filteredTree: categories, searchMatches: new Set<string>() };
        const { nodes, matches } = filterTree(categories, searchQuery);
        return { filteredTree: nodes, searchMatches: matches };
    }, [categories, searchQuery]);

    // Auto-expand on search
    useEffect(() => {
        if (searchQuery.trim()) {
            setExpandedIds(prev => {
                const next = new Set(prev);
                searchMatches.forEach(id => next.add(id));
                return next;
            });
        }
    }, [searchMatches, searchQuery]);

    // Handlers
    const toggleExpand = (id: string) => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleAction = (action: 'edit' | 'create_sub' | 'delete', category: Category) => {
        if (action === 'edit') {
            setFormData({
                name: category.name,
                image: category.image ? [{ url: category.image, publicId: category.image }] : []
            });
            setModalState({ isOpen: true, mode: 'edit', category });
        } else if (action === 'create_sub') {
            setFormData({ name: '', image: [] });
            setModalState({ isOpen: true, mode: 'create_sub', parentId: category._id });
        } else if (action === 'delete') {
            if (category.children && category.children.length > 0) {
                toast.error('Нельзя удалить категорию с подкатегориями');
                return;
            }
            setCategoryToDelete(category);
            setDeleteConfirmOpen(true);
        }
    };

    const handleCreateRoot = () => {
        setFormData({ name: '', image: [] });
        setModalState({ isOpen: true, mode: 'create_root' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim()) return;

        setIsSubmitting(true);
        try {
            const payload: any = {
                name: formData.name,
                image: formData.image[0]?.url
            };

            if (modalState.mode === 'create_sub') {
                payload.parent = modalState.parentId;
            } else if (modalState.mode === 'create_root') {
                // no parent
            }

            if (modalState.mode === 'edit' && modalState.category) {
                await updateMutation.mutateAsync({ id: modalState.category._id, data: payload });
            } else {
                await createMutation.mutateAsync(payload);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (error) return <div className="p-8 text-destructive">Ошибка загрузки</div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Дерево категорий"
                description="Управление иерархией категорий"
                action={{
                    label: 'Добавить корневую категорию',
                    icon: <PlusCircle size={16} className="mr-2" />,
                    onClick: handleCreateRoot
                }}
            />

            <Card className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Поиск категорий..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="border rounded-md divide-y">
                    <div className="grid grid-cols-[1fr_100px_80px] p-3 bg-muted/40 text-sm font-medium text-muted-foreground">
                        <div>Название</div>
                        <div className="text-center">Товары</div>
                        <div className="text-right">Действия</div>
                    </div>
                    {filteredTree.length > 0 ? (
                        filteredTree.map(node => (
                            <CategoryNode
                                key={node._id}
                                category={node}
                                level={0}
                                expandedIds={expandedIds}
                                toggleExpand={toggleExpand}
                                onAction={handleAction}
                            />
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">Категории не найдены</div>
                    )}
                </div>
            </Card>

            {/* Create/Edit Modal */}
            <Dialog open={modalState.isOpen} onOpenChange={(open) => setModalState(prev => ({ ...prev, isOpen: open }))}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {modalState.mode === 'create_root' && 'Новая корневая категория'}
                            {modalState.mode === 'create_sub' && 'Новая подкатегория'}
                            {modalState.mode === 'edit' && 'Редактирование категории'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Название</Label>
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                placeholder="Название категории"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Изображение</Label>
                            <ImageUpload
                                value={formData.image}
                                onChange={v => setFormData({ ...formData, image: v })}
                                maxFiles={1}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))}>Отмена</Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить категорию?</DialogTitle>
                        <DialogDescription>
                            Вы собираетесь удалить категорию "{categoryToDelete?.name}". Это действие нельзя отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Отмена</Button>
                        <Button
                            variant="destructive"
                            onClick={() => categoryToDelete && deleteMutation.mutate(categoryToDelete._id)}
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// --- CategoryNode Implementation ---

const CategoryNode = ({ category, level, expandedIds, toggleExpand, onAction }: TreeNodeProps) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedIds.has(category._id);

    // Mock product count since API doesn't return it yet, but we can display placeholder or 0
    const productCount = (category as any).productCount || 0;

    return (
        <>
            <div
                className={cn(
                    "grid grid-cols-[1fr_100px_80px] items-center p-2 hover:bg-muted/50 group transition-colors",
                    level === 0 && "font-medium"
                )}
            >
                <div className="flex items-center gap-2 overflow-hidden" style={{ paddingLeft: `${level * 24}px` }}>
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("h-6 w-6 shrink-0", !hasChildren && "opacity-0")}
                        onClick={() => toggleExpand(category._id)}
                    >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </Button>

                    <div className="w-8 h-8 shrink-0 rounded bg-muted flex items-center justify-center overflow-hidden border">
                        {category.image ? (
                            <img src={category.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                            <Folder className="h-4 w-4 text-muted-foreground/50" />
                        )}
                    </div>

                    <span className="truncate">{category.name}</span>
                </div>

                <div className="text-center text-sm text-muted-foreground">
                    {productCount > 0 && <Badge variant="secondary" className="font-normal">{productCount}</Badge>}
                    {productCount === 0 && <span className="text-xs">—</span>}
                </div>

                <div className="flex justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal size={16} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onAction('create_sub', category)}>
                                <Plus className="mr-2 h-4 w-4" /> Добавить подкатегорию
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => onAction('edit', category)}>
                                <Edit className="mr-2 h-4 w-4" /> Редактировать
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => onAction('delete', category)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" /> Удалить
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {isExpanded && hasChildren && (
                <div className="border-l border-muted ml-[39px] animate-in slide-in-from-top-1 fade-in duration-200">
                    {category.children!.map(child => (
                        <CategoryNode
                            key={child._id}
                            category={child}
                            level={level + 1}
                            expandedIds={expandedIds}
                            toggleExpand={toggleExpand}
                            onAction={onAction}
                        />
                    ))}
                </div>
            )}
        </>
    );
};