import Link from "next/link";

interface AccommodationProps {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features?: string[]; // Added optional features
  image: string; // URL or placeholder color
  isFullyBooked?: boolean;
}

export function AccommodationCard({
  id,
  name,
  type,
  price,
  description,
  image,
  imageUrl,
  isFullyBooked,
}: AccommodationProps & { imageUrl?: string }) {
  const cardContent = (
    <div
      className={`bg-card border ${isFullyBooked ? "border-red-500/50 opacity-75" : "border-white/10"} rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full relative`}
    >
      {isFullyBooked && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white z-10 backdrop-blur-[2px]">
          <span className="font-bold text-lg tracking-wider bg-red-600 px-3 py-1 rounded">
            FULLY BOOKED
          </span>
        </div>
      )}
      <div
        className={`h-48 w-full bg-cover bg-center group-hover:opacity-90 transition-opacity ${!imageUrl ? image : ""}`}
        style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
      ></div>
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-xl font-bold text-white">{name}</h3>
          <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full uppercase tracking-wider">
            {type}
          </span>
        </div>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-2xl font-bold text-primary">
            ₦{price.toLocaleString()}
          </span>
          <span
            className={`px-4 py-2 font-semibold rounded-lg transition-colors ${isFullyBooked ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-white text-black hover:bg-gray-200"}`}
          >
            {isFullyBooked ? "Unavailable" : "View Details"}
          </span>
        </div>
      </div>
    </div>
  );

  if (isFullyBooked) {
    return (
      <div className="block h-full group cursor-not-allowed">{cardContent}</div>
    );
  }

  return (
    <Link href={`/accommodations/${id}`} className="block h-full group">
      {cardContent}
    </Link>
  );
}
