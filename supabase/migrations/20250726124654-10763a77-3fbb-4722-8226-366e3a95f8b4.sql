-- Add index on wardrobe_items.created_at for improved performance of recent outfit queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_created_at 
ON public.wardrobe_items (user_id, created_at DESC);

-- Add index to help with duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_wardrobe_items_user_recent 
ON public.wardrobe_items (user_id, created_at, rating_score, feedback);

-- Add comment explaining the purpose
COMMENT ON INDEX idx_wardrobe_items_user_created_at IS 'Index for filtering user outfits by creation date - improves duplicate detection performance';
COMMENT ON INDEX idx_wardrobe_items_user_recent IS 'Composite index for duplicate detection queries based on user, date, score and feedback length';