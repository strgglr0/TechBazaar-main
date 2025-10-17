import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useQuery } from "@tanstack/react-query";
import type { Category, ProductFilters } from "@/lib/types";

interface Brand {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

export default function ProductFiltersComponent({ filters, onFiltersChange }: ProductFiltersProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const priceRanges = [
    { label: "Under ₱500", min: 0, max: 500 },
    { label: "₱500 - ₱1000", min: 500, max: 1000 },
    { label: "₱1000+", min: 1000, max: Infinity },
  ];

  const ratingOptions = [
    { label: "4+ ⭐", value: 4 },
    { label: "3+ ⭐", value: 3 },
  ];

  const handleCategoryChange = (category: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      category: checked ? category : undefined,
    });
  };

  const handleBrandChange = (brand: string, checked: boolean) => {
    onFiltersChange({
      ...filters,
      brand: checked ? brand : undefined,
    });
  };

  const handlePriceRangeChange = (range: { min: number; max: number }, checked: boolean) => {
    onFiltersChange({
      ...filters,
      minPrice: checked ? range.min : undefined,
      maxPrice: checked && range.max !== Infinity ? range.max : undefined,
    });
  };

  const handleRatingChange = (rating: number, checked: boolean) => {
    onFiltersChange({
      ...filters,
      rating: checked ? rating : undefined,
    });
  };

  return (
    <Card className="bg-card border-border sticky top-24">
      <CardHeader>
        <CardTitle className="font-bold font-lora text-foreground">Filters</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Categories */}
        <div>
          <h5 className="font-semibold font-geist text-foreground mb-3">Category</h5>
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={filters.category === category.id}
                  onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                  data-testid={`checkbox-category-${category.id}`}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm font-geist">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h5 className="font-semibold font-geist text-foreground mb-3">Price Range</h5>
          <div className="space-y-2">
            {priceRanges.map((range, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Checkbox
                  id={`price-${index}`}
                  checked={filters.minPrice === range.min && (range.max === Infinity ? !filters.maxPrice : filters.maxPrice === range.max)}
                  onCheckedChange={(checked) => handlePriceRangeChange(range, checked as boolean)}
                  data-testid={`checkbox-price-${index}`}
                />
                <Label htmlFor={`price-${index}`} className="text-sm font-geist">
                  {range.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Brand */}
        {brands.length > 0 && (
          <div>
            <h5 className="font-semibold font-geist text-foreground mb-3">Brand</h5>
            <div className="space-y-2">
              {brands.slice(0, 5).map((brand) => (
                <div key={brand.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand.id}`}
                    checked={filters.brand === brand.id}
                    onCheckedChange={(checked) => handleBrandChange(brand.id, checked as boolean)}
                    data-testid={`checkbox-brand-${brand.id}`}
                  />
                  <Label htmlFor={`brand-${brand.id}`} className="text-sm font-geist">
                    {brand.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rating */}
        <div>
          <h5 className="font-semibold font-geist text-foreground mb-3">Rating</h5>
          <div className="space-y-2">
            {ratingOptions.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`rating-${option.value}`}
                  checked={filters.rating === option.value}
                  onCheckedChange={(checked) => handleRatingChange(option.value, checked as boolean)}
                  data-testid={`checkbox-rating-${option.value}`}
                />
                <Label htmlFor={`rating-${option.value}`} className="text-sm font-geist">
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
