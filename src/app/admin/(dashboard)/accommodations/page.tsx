import { getAccommodations } from '@/lib/googleSheets';
import AccommodationsManager from '@/components/admin/AccommodationsManager';

export default async function AccommodationsPage() {
    const accommodations = await getAccommodations();

    return (
        <div>
           <AccommodationsManager initialData={accommodations} />
        </div>
    );
}
