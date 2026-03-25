import { Suspense } from "react";
import PaystackPaymentsClient from "./PaystackPaymentsClient";

export const dynamic = "force-dynamic";

export default function PaystackPaymentsPage() {
  return (
    <div className="container mx-auto">
      <Suspense>
        <PaystackPaymentsClient />
      </Suspense>
    </div>
  );
}
