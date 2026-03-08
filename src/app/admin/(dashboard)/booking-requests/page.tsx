import { getAllBookings } from "@/lib/bookingService";
import BookingRequestsClient from "./BookingRequestsClient";

export const dynamic = "force-dynamic";

export default async function BookingRequestsPage() {
  const bookings = await getAllBookings();

  return (
    <div className="container mx-auto">
      <BookingRequestsClient initialBookings={bookings} />
    </div>
  );
}
