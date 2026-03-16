import { getAllBookings } from "@/lib/bookingService";
import SubAdminBookingRequestsClient from "./SubAdminBookingRequestsClient";

export const dynamic = "force-dynamic";

export default async function SubAdminBookingRequestsPage() {
  const bookings = await getAllBookings();

  return (
    <div className="container mx-auto">
      <SubAdminBookingRequestsClient initialBookings={bookings} />
    </div>
  );
}
