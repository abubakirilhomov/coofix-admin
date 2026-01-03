import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KeyValueEditorProps {
    value: string; // JSON string
    onChange: (value: string) => void;
    placeholder?: string;
}

interface KeyValuePair {
    key: string;
    value: string;
}

export const KeyValueEditor = ({ value, onChange }: KeyValueEditorProps) => {
    const [pairs, setPairs] = useState<KeyValuePair[]>([]);

    useEffect(() => {
        try {
            if (!value) {
                setPairs([]);
                return;
            }
            const parsed = JSON.parse(value);
            const newPairs = Object.entries(parsed).map(([k, v]) => ({
                key: k,
                value: String(v),
            }));
            setPairs(newPairs);
        } catch (e) {
            // If parsing fails, we don't update pairs to avoid wiping invalid manual checks
            // But for this editor, we assume it controls the value.
            setPairs([]);
        }
    }, [value]);

    const updateParent = (newPairs: KeyValuePair[]) => {
        const obj = newPairs.reduce((acc, { key, value }) => {
            if (key) acc[key] = value;
            return acc;
        }, {} as Record<string, string>);
        onChange(JSON.stringify(obj, null, 2));
    };

    const handleAdd = () => {
        const newPairs = [...pairs, { key: '', value: '' }];
        setPairs(newPairs);
        // Don't update parent immediately on empty add, wait for input
    };

    const handleChange = (index: number, field: 'key' | 'value', val: string) => {
        const newPairs = [...pairs];
        newPairs[index][field] = val;
        setPairs(newPairs);
        updateParent(newPairs);
    };

    const handleDelete = (index: number) => {
        const newPairs = pairs.filter((_, i) => i !== index);
        setPairs(newPairs);
        updateParent(newPairs);
    };

    return (
        <div className="space-y-2">
            <div className="space-y-2">
                {pairs.map((pair, index) => (
                    <div key={index} className="flex gap-2">
                        <Input
                            placeholder="Характеристика (например, Цвет)"
                            value={pair.key}
                            onChange={(e) => handleChange(index, 'key', e.target.value)}
                            className="flex-1"
                        />
                        <Input
                            placeholder="Значение (например, Красный)"
                            value={pair.value}
                            onChange={(e) => handleChange(index, 'value', e.target.value)}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDelete(index)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
            </div>
            <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAdd}
                className="w-full"
            >
                <Plus className="mr-2 h-4 w-4" /> Добавить характеристику
            </Button>
        </div>
    );
};
