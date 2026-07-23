alter table public.spotlight_items
add column if not exists layout jsonb not null default '{
  "desktop": {
    "x": 2,
    "y": 7,
    "width": 18,
    "rotation": -7,
    "shape": "portrait"
  },
  "mobile": {
    "x": 4,
    "y": 4,
    "width": 40,
    "rotation": -7,
    "shape": "portrait"
  }
}'::jsonb;
