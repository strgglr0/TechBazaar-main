import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
  const [customMinPrice, setCustomMinPrice] = useState<string>("");
  const [customMaxPrice, setCustomMaxPrice] = useState<string>("");
  const [useCustomPrice, setUseCustomPrice] = useState(false);

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: brands = [] } = useQuery<Brand[]>({
    queryKey: ['/api/brands'],
  });

  const priceRanges = [
    { label: "Under ₱10,000", min: 0, max: 10000 },
    { label: "₱10,000 - ₱30,000", min: 10000, max: 30000 },
    { label: "₱30,000 - ₱60,000", min: 30000, max: 60000 },
    { label: "₱60,000+", min: 60000, max: Infinity },
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
    setUseCustomPrice(false);
    setCustomMinPrice("");
    setCustomMaxPrice("");
    onFiltersChange({
      ...filters,
      minPrice: checked ? range.min : undefined,
      maxPrice: checked && range.max !== Infinity ? range.max : undefined,
    });
  };

  const handleCustomPriceApply = () => {
    const min = parseFloat(customMinPrice) || 0;
    const max = parseFloat(customMaxPrice) || undefined;
    
    setUseCustomPrice(true);
    onFiltersChange({
      ...filters,
      minPrice: min > 0 ? min : undefined,
      maxPrice: max,
    });
  };

  const handleClearCustomPrice = () => {
    setCustomMinPrice("");
    setCustomMaxPrice("");
    setUseCustomPrice(false);
    onFiltersChange({
      ...filters,
      minPrice: undefined,
      maxPrice: undefined,
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-bold font-lora text-foreground">Filters</CardTitle>
        {(filters.category || filters.brand || filters.minPrice || filters.maxPrice || filters.rating) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCustomMinPrice("");
              setCustomMaxPrice("");
              setUseCustomPrice(false);
              onFiltersChange({});
            }}
            className="text-xs"
          >
            Clear All
          </Button>
        )}
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
          <div className="space-y-3">
            {/* Preset Price Ranges */}
            <div className="space-y-2">
              {priceRanges.map((range, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`price-${index}`}
                    checked={!useCustomPrice && filters.minPrice === range.min && (range.max === Infinity ? !filters.maxPrice : filters.maxPrice === range.max)}
                    onCheckedChange={(checked) => handlePriceRangeChange(range, checked as boolean)}
                    data-testid={`checkbox-price-${index}`}
                  />
                  <Label htmlFor={`price-${index}`} className="text-sm font-geist cursor-pointer">
                    {range.label}
                  </Label>
                </div>
              ))}
            </div>

            {/* Custom Price Range */}
            <div className="pt-2 border-t">
              <Label className="text-sm font-semibold mb-2 block">Custom Range</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={customMinPrice}
                    onChange={(e) => setCustomMinPrice(e.target.value)}
                    className="h-8 text-sm"
                    min="0"
                  />
                  <span className="text-muted-foreground">-</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={customMaxPrice}
                    onChange={(e) => setCustomMaxPrice(e.target.value)}
                    className="h-8 text-sm"
                    min="0"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleCustomPriceApply}
                    disabled={!customMinPrice && !customMaxPrice}
                    className="flex-1 h-8 text-xs"
                  >
                    Apply
                  </Button>
                  {(useCustomPrice || customMinPrice || customMaxPrice) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleClearCustomPrice}
                      className="h-8 text-xs"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            </div>
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
