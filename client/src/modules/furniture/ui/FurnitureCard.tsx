import { motion } from "framer-motion";
import { type Product } from "@shared/schema";
import { PremiumButton } from "@/shared/components/PremiumButton";
import { ShoppingBag, Star } from "lucide-react";
import { useCart } from "../hooks/use-cart";
import { useState } from "react";

interface FurnitureCardProps {
  product: Product;
  index?: number;
}

export function FurnitureCard({ product, index = 0 }: FurnitureCardProps) {
  const { addToCart, isAdding } = useCart();
  const [isHovered, setIsHovered] = useState(false);

  // Format price from cents
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(product.price / 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group relative flex flex-col gap-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-secondary/20">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        
        {/* Hover Overlay */}
        <div className={`absolute inset-0 bg-black/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
        
        <div className={`absolute bottom-4 left-4 right-4 translate-y-4 transition-all duration-300 ${isHovered ? 'translate-y-0 opacity-100' : 'opacity-0'}`}>
          <PremiumButton
            onClick={() => addToCart({ productId: product.id })}
            isLoading={isAdding}
            className="w-full shadow-xl bg-white text-black hover:bg-white/90"
            size="md"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Add to Bag
          </PremiumButton>
        </div>

        <div className="absolute top-4 right-4 rounded-full bg-white/80 backdrop-blur-sm px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
          {product.category}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-start">
          <h3 className="font-display text-lg font-medium tracking-tight text-foreground">
            {product.name}
          </h3>
          <span className="font-mono text-sm font-medium text-primary">
            {formattedPrice}
          </span>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">{product.description}</p>
      </div>
    </motion.div>
  );
}
