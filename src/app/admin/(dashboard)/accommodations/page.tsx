import { getAccommodationsWithAvailability } from "@/lib/accommodationService";
import AccommodationsManager from "@/components/admin/AccommodationsManager";

export const dynamic = "force-dynamic";

export default async function AccommodationsPage() {
  const accommodations = await getAccommodationsWithAvailability();

  return (
    <div>
      <AccommodationsManager initialData={accommodations} />
    </div>
  );
}
