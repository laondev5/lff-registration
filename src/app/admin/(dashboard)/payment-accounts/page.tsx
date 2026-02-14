import { getPaymentAccounts } from "@/lib/googleSheets";
import PaymentAccountsClient from "./PaymentAccountsClient";

export const dynamic = "force-dynamic";

export default async function PaymentAccountsPage() {
  const accounts = await getPaymentAccounts();

  return (
    <div className="container mx-auto">
      <PaymentAccountsClient initialAccounts={accounts} />
    </div>
  );
}
