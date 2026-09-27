import { Link } from 'react-router-dom';
import { MapPin, Maximize, BedDouble, FileText } from 'lucide-react';
import type { PropertyWithRelations } from '@/lib/types';
import { formatPrice, getOperationTypeLabel, getPropertyStatusLabel, getPropertyStatusColor } from '@/lib/format';

interface PropertyCardProps {
  property: PropertyWithRelations;
}

export function PropertyCard({ property }: PropertyCardProps) {
  const primaryImage = property.property_images?.find((img) => img.is_primary) || property.property_images?.[0];
  const imageUrl = primaryImage?.image_url;

  return (
    <Link
      to={`/properties/${property.id}`}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-200 transition-all duration-300 animate-fade-in"
    >
      {/* Image */}
      <div className="relative h-52 bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100">
            <MapPin className="w-12 h-12 text-primary-300" />
          </div>
        )}
        {/* Operation type badge */}
        <div className="absolute top-3 right-3 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
          {getOperationTypeLabel(property.operation_type)}
        </div>
        {/* Status badge (for exhibitor/admin views) */}
        {property.status !== 'published' && (
          <div className={`absolute top-3 left-3 text-xs font-bold px-3 py-1 rounded-full shadow-md ${getPropertyStatusColor(property.status)}`}>
            {getPropertyStatusLabel(property.status)}
          </div>
        )}
        {/* Featured badge */}
        {property.is_featured && (
          <div className="absolute bottom-3 right-3 bg-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
            مميز
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
          {property.title}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-3">
          <MapPin className="w-4 h-4 shrink-0" />
          <span className="line-clamp-1">
            {property.area?.name_ar || 'غير محدد'} - قصر البخاري
          </span>
        </div>

        {/* Price */}
        <div className="text-primary-700 font-bold text-lg mb-3">
          {formatPrice(property.operation_type, property.price, property.price_unit)}
        </div>

        {/* Specs */}
        <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          {property.property_type && (
            <span className="bg-gray-50 px-2.5 py-1 rounded-md text-xs font-medium text-gray-600">
              {property.property_type.name_ar}
            </span>
          )}
          {property.area_size && (
            <span className="flex items-center gap-1">
              <Maximize className="w-4 h-4" />
              {property.area_size} م²
            </span>
          )}
          {property.rooms && (
            <span className="flex items-center gap-1">
              <BedDouble className="w-4 h-4" />
              {property.rooms} غرف
            </span>
          )}
          {property.document_type && (
            <span className="flex items-center gap-1 text-xs">
              <FileText className="w-3.5 h-3.5" />
              {property.document_type.name_ar}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
