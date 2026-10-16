-- Phase 04: caption positioning per brand kit. 'lower' = y 1350–1650 (default), 'upper' = y 260–560
-- (code panels then sit lower in the frame). The renderer maps it to captionStyle.safeTop/safeBottom.
alter table public.brand_kits
  add column caption_position text not null default 'lower' check (caption_position in ('lower', 'upper'));
