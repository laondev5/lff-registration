import { getOrders } from '@/lib/storeService';
import { OrderList } from '@/components/admin/OrderList';

export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
    const orders = await getOrders();

    return (
        <div className="container mx-auto">
            <OrderList initialOrders={orders} />
        </div>
    );
}
