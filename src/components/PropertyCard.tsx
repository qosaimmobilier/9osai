import type { Property } from '@/types';
import { Link } from 'react-router-dom';
import { MapPin, Bed, Bath, Maximize, Heart, Share2, Eye } from 'lucide-react';
import { formatPrice, OPERATION_LABELS, OPERATION_COLORS, PROPERTY_STATUS_LABELS } from '@/lib/constants';
import { useState, useEffect } from 'react';

interface PropertyCardProps {
  property: Property;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const coverImage = property.images?.find((img) => img.is_cover) || property.images?.[0];

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.includes(property.id));
  }, [property.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const newFavorites = isFavorite
      ? favorites.filter((id: string) => id !== property.id)
      : [...favorites, property.id];
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const shareUrl = `${window.location.origin}/property/${property.id}`;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    if (navigator.share) {
      navigator.share({ title: property.title, url: shareUrl });
    } else {
      navigator.clipboard.writeText(shareUrl);
    }
  };

  return (
    <Link to={`/property/${property.id}`} className="card group block hover:shadow-md transition-all">
      <div className="relative h-52 overflow-hidden bg-gray-100">
        {coverImage ? (
          <img
            src={coverImage.image_url}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <Bed className="w-12 h-12 text-gray-300" />
          </div>
        )}
        <div className="absolute top-2 right-2 flex gap-2">
          <span className={`badge ${OPERATION_COLORS[property.operation_type]}`}>
            {OPERATION_LABELS[property.operation_type]}
          </span>
          {property.featured && (
            <span className="badge bg-primary-500 text-white">مميز</span>
          )}
        </div>
        <button
          onClick={toggleFavorite}
          className="absolute top-2 left-2 w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-gray-900 mb-1 truncate group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4" />
          <span className="truncate">
            {[property.municipality, property.area].filter(Boolean).join('، ') || property.wilaya}
          </span>
        </div>

        <div className="text-primary-600 font-bold text-lg mb-3">
          {formatPrice(property.price)}
        </div>

        <div className="flex items-center gap-3 text-sm text-gray-500 mb-3">
          {property.area_size && (
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {property.area_size} م²
            </span>
          )}
          {property.rooms != null && (
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4" />
              {property.rooms} غرف
            </span>
          )}
          {property.bathrooms != null && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4" />
              {property.bathrooms} حمام
            </span>
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            {property.property_type?.name || 'عقار'}
          </span>
          <button
            onClick={handleShare}
            className="text-gray-400 hover:text-primary-600 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
