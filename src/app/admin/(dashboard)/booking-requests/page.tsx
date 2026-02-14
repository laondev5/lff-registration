import { getBookingRequests } from "@/lib/googleSheets";
import BookingRequestsClient from "./BookingRequestsClient";

export const dynamic = "force-dynamic";

export default async function BookingRequestsPage() {
  const bookings = await getBookingRequests();

  return (
    <div className="container mx-auto">
      <BookingRequestsClient initialBookings={bookings} />
    </div>
  );
}
