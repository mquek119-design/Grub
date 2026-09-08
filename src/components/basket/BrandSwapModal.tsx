'use client';

import { useRef, useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/media/Icon';
import { formatPence } from '@/lib/money';
import { searchTescoProducts, updateIngredientProductMapping } from '@/app/basket/actions';
import { FoodImage } from '@/components/media/FoodImage';
import { parsePackFromTitle } from '@/lib/packParsing';
import { useModalA11y } from '@/components/ui/useModalA11y';

interface BrandSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  basketItemId: string;
  ingredientId: string | null;
  itemName: string;
}

/** Pack size read out of the product title, e.g. "500g" or "6 pack". */
function packLabel(title: string): string | null {
  const pack = parsePackFromTitle(title);
  if (!pack) return null;
  return pack.unit === 'whole' ? `${pack.size} pack` : `${pack.size}${pack.unit}`;
}

export function BrandSwapModal({ isOpen, onClose, basketItemId, ingredientId, itemName }: BrandSwapModalProps) {
  // Deliberately empty. Pre-filling with the current product name meant the
  // first search returned the thing you were trying to move away from, and you
  // had to clear a field before you could use the box at all.
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useModalA11y(dialogRef, isOpen, onClose);

  if (!isOpen) return null;

  function handleSearch() {
    if (!query.trim()) return;
    setErrorMsg(null);
    startTransition(async () => {
      const res = await searchTescoProducts(query);
      setResults(res);
      if (res.length === 0) {
        setErrorMsg('No products found matching your search.');
      }
    });
  }

  function handleSelect(product: any) {
    setErrorMsg(null);
    startSaving(async () => {
      const res = await updateIngredientProductMapping(
        basketItemId,
        ingredientId,
        product.product_uid,
        product.name,
        product.size,
        product.price,
        product.imageUrl
      );
      if (res.status === 'error') {
        setErrorMsg(res.message);
      } else {
        onClose();
      }
    });
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="brand-swap-title"
      tabIndex={-1}
      className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-md"
    >
      <Card className="w-full max-w-3xl flex flex-col gap-md max-h-[88vh] overflow-hidden shadow-xl border border-outline-variant/50">
        <div className="flex items-start justify-between gap-sm border-b border-surface-container-highest pb-sm">
          <div className="min-w-0">
            <h3 id="brand-swap-title" className="font-title-lg text-title-lg font-bold text-on-surface">
              Swap item for alternative
            </h3>
            {/* The box below starts empty, so this is where you see what you are replacing. */}
            <p className="font-body-sm text-body-sm text-on-surface-variant truncate mt-0.5">
              Currently in basket: <span className="font-semibold text-primary">{itemName}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors shrink-0 text-on-surface-variant"
          >
            <Icon name="close" className="text-xl" />
          </button>
        </div>

        <div className="flex gap-sm">
          <div className="relative flex-1 flex items-center">
            <Icon
              name="search"
              className="absolute left-3 text-on-surface-variant pointer-events-none text-lg"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search Tesco — e.g. eggs, chicken thighs, pasta..."
              aria-label="Search Tesco products"
              className="w-full h-11 pl-10 pr-sm rounded-xl bg-surface-container-low border border-surface-container-highest text-on-surface font-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-xs"
            />
          </div>
          <button
            type="button"
            disabled={isPending || !query.trim()}
            onClick={handleSearch}
            className="h-11 px-lg rounded-xl bg-primary text-on-primary font-semibold flex items-center gap-xs hover:bg-primary/90 transition-all disabled:opacity-50 shadow-xs shrink-0"
          >
            <Icon name={isPending ? 'progress_activity' : 'search'} className={isPending ? 'animate-spin' : undefined} />
            {isPending ? 'Searching...' : 'Search'}
          </button>
        </div>

        {errorMsg && <p className="font-body-sm text-body-sm text-error">{errorMsg}</p>}

        {results.length > 0 && (
          <div className="flex items-center justify-between text-xs text-on-surface-variant px-xs">
            <span>Showing {results.length} Tesco options (select one to swap):</span>
          </div>
        )}

        {/* 2-Column Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm overflow-y-auto max-h-[52vh] pr-xs">
          {results.map((product) => (
            <button
              key={product.product_uid}
              type="button"
              disabled={isSaving}
              onClick={() => handleSelect(product)}
              className="group text-left p-sm rounded-xl bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 hover:border-primary/40 flex items-center gap-sm transition-all disabled:opacity-50 shadow-xs hover:shadow-sm"
            >
              {/* Product thumbnail */}
              <FoodImage
                src={product.imageUrl}
                seed={product.product_uid}
                alt={product.name}
                icon="grocery"
                className="w-14 h-14 rounded-lg shrink-0 object-contain bg-surface-container-lowest border border-outline-variant/30"
              />
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p className="font-body-sm text-body-sm font-semibold text-on-surface line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                  {product.name}
                </p>
                <div className="flex items-center justify-between gap-xs mt-1">
                  <span className="font-body-xs text-[11px] text-on-surface-variant truncate">
                    {packLabel(product.name) ?? product.size}
                  </span>
                  <span className="font-numeric-data text-body-sm font-bold text-primary shrink-0">
                    {formatPence(product.price)}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>

  );
}
