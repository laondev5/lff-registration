import { AlertTriangle, Clock } from "lucide-react";

export function StoreDeadlineBanner() {
  return (
    <div className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-black">
      <div className="container mx-auto px-4 py-3.5 flex items-start sm:items-center gap-3">
        <div className="flex-shrink-0 bg-black/10 rounded-full p-1.5 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-5 h-5" strokeWidth={2.5} />
        </div>
        <div className="flex-1">
          <p className="font-bold text-sm sm:text-base leading-snug">
            ⚠️ Order Deadline: 15th March 2026
          </p>
          <p className="text-sm leading-snug mt-0.5 text-black/80">
            Orders placed <strong>after 15th March</strong> will <strong>not</strong> be available for collection at the convention.
            Items ordered after this date will be ready for pickup <strong>after the convention</strong>.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1.5 flex-shrink-0 bg-black/15 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap">
          <Clock className="w-4 h-4" />
          Order by Mar 15
        </div>
      </div>
    </div>
  );
}
