
export interface MenuItem {
    id: number;
    label: string;
    title: string;
    icon: string;
    order: number;
    parent_id: number | null;
    module_id: number;
    created_at?: string;
    updated_at?: string;
    module?: {
        id: number;
        name: string;
        slug: string;
        is_active: boolean;
        created_at?: string;
        updated_at?: string;
    };
    children?: MenuItem[];
}