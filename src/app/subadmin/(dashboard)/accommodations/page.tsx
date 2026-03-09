import { getAccommodationsWithAvailability } from "@/lib/accommodationService";
import SubAdminAccommodationsClient from "./SubAdminAccommodationsClient";

export const dynamic = "force-dynamic";

export default async function SubAdminAccommodationsPage() {
  const accommodations = await getAccommodationsWithAvailability();

  return (
    <div>
      <SubAdminAccommodationsClient accommodations={accommodations} />
    </div>
  );
}
