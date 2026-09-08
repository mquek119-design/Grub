-- Extend avatar_accent enum to support 6 curated Grub color palettes
-- Adds 'rust' (Terracotta / Paprika) and 'olive' (Rosemary / Herb)

alter type avatar_accent add value if not exists 'rust';
alter type avatar_accent add value if not exists 'olive';
