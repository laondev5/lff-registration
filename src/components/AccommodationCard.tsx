import Link from 'next/link';

interface AccommodationProps {
  id: string;
  name: string;
  type: string;
  price: number;
  description: string;
  features?: string[]; // Added optional features
  image: string; // URL or placeholder color
}

export function AccommodationCard({ id, name, type, price, description, image, imageUrl }: AccommodationProps & { imageUrl?: string }) {
  return (
    <Link href={`/accommodations/${id}`} className="block h-full group">
      <div className="bg-card border border-white/10 rounded-xl overflow-hidden hover:scale-[1.02] transition-transform duration-300 flex flex-col h-full">
        <div 
            className={`h-48 w-full bg-cover bg-center group-hover:opacity-90 transition-opacity ${!imageUrl ? image : ''}`}
            style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : {}}
        ></div>
        <div className="p-6 flex flex-col flex-grow">
          <div className="flex justify-between items-start mb-2">
             <h3 className="text-xl font-bold text-white">{name}</h3>
             <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full uppercase tracking-wider">{type}</span>
          </div>
          <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>
          <div className="mt-auto flex items-center justify-between">
              <span className="text-2xl font-bold text-primary">₦{price.toLocaleString()}</span>
              <span className="px-4 py-2 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                View Details
              </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
