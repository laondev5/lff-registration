import { getAccommodations } from "@/lib/accommodationService";
import AccommodationsManager from "@/components/admin/AccommodationsManager";

export default async function AccommodationsPage() {
  const accommodations = await getAccommodations();

  return (
    <div>
      <AccommodationsManager initialData={accommodations} />
    </div>
  );
}
