import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertProductSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatNumberWithCommas, parseFormattedNumber, sanitizeNumberInput } from "@/lib/formatters";
import type { Product, InsertProduct } from "@/lib/types";
import { z } from "zod";

const formSchema = insertProductSchema.extend({
  specifications: z.string().transform((val) => {
    try {
      return JSON.parse(val || '{}');
    } catch {
      return {};
    }
  }),
});

interface ProductFormProps {
  product?: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProductForm({ product, open, onOpenChange }: ProductFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || "0.00",
      category: product?.category || "phones",
      brand: product?.brand || "",
      sku: product?.sku || "",
      imageUrl: product?.imageUrl || "",
      specifications: JSON.stringify(product?.specifications || {}, null, 2),
      stock: product?.stock || 0,
      rating: product?.rating || "0.00",
      reviewCount: product?.reviewCount || 0,
      isActive: product?.isActive ?? true,
    },
  });

  // Reset form when product changes (for edit mode)
  useEffect(() => {
    if (product && open) {
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "0.00",
        category: product.category || "phones",
        brand: product.brand || "",
        sku: product.sku || "",
        imageUrl: product.imageUrl || "",
        specifications: JSON.stringify(product.specifications || {}, null, 2),
        stock: product.stock || 0,
        rating: product.rating || "0.00",
        reviewCount: product.reviewCount || 0,
        isActive: product.isActive ?? true,
      });
    } else if (!product && open) {
      // Reset to empty for create mode
      form.reset({
        name: "",
        description: "",
        price: "0.00",
        category: "phones",
        brand: "",
        sku: "",
        imageUrl: "",
        specifications: "{}",
        stock: 0,
        rating: "0.00",
        reviewCount: 0,
        isActive: true,
      });
    }
  }, [product, open, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Product created successfully",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("PUT", `/api/products/${product!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/products'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/stats'] });
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (product) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-lora">
            {product ? "Edit Product" : "Add New Product"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">Product Name</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">SKU</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-sku" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-geist">Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} data-testid="textarea-product-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">Price (₱)</FormLabel>
                    <FormControl>
                      <Input 
                        value={formatNumberWithCommas(field.value)}
                        onChange={(e) => {
                          const sanitized = sanitizeNumberInput(e.target.value, true);
                          field.onChange(sanitized);
                        }}
                        onBlur={(e) => {
                          const value = parseFormattedNumber(e.target.value);
                          if (value) {
                            field.onChange(parseFloat(value).toFixed(2));
                          }
                        }}
                        placeholder="0.00"
                        data-testid="input-product-price" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-product-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="phones">Phones</SelectItem>
                        <SelectItem value="laptops">Laptops</SelectItem>
                        <SelectItem value="desktops">Desktops</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">Brand</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-product-brand" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-geist">Image URL</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ""} placeholder="https://example.com/image.jpg" data-testid="input-product-image" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-geist">Stock</FormLabel>
                    <FormControl>
                      <Input 
                        value={formatNumberWithCommas(field.value || 0)}
                        onChange={(e) => {
                          const sanitized = sanitizeNumberInput(e.target.value, false);
                          field.onChange(parseInt(sanitized) || 0);
                        }}
                        placeholder="0"
                        data-testid="input-product-stock" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hidden fields to preserve rating data */}
              <input type="hidden" {...form.register('rating')} />
              <input type="hidden" {...form.register('reviewCount')} />
            </div>

            <FormField
              control={form.control}
              name="specifications"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="font-geist">Specifications (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={6} 
                      placeholder='{"processor": "Intel i7", "ram": "16GB", "storage": "512GB SSD"}'
                      data-testid="textarea-product-specs"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-product"
              >
                {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Product"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
