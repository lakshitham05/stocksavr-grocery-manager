CREATE TABLE public.products (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  quantity integer NOT NULL DEFAULT 0,
  low_stock integer NOT NULL DEFAULT 0,
  sell_price numeric NOT NULL DEFAULT 0,
  buy_price numeric NOT NULL DEFAULT 0,
  expiry date NOT NULL,
  is_food boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.sales (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  id text NOT NULL,
  product_id text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL,
  unit_price numeric NOT NULL,
  total numeric NOT NULL,
  sold_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);
CREATE TABLE public.rescue_actions (
  user_id uuid NOT NULL DEFAULT auth.uid(),
  product_id text NOT NULL,
  expiry date NOT NULL,
  discount_offer boolean NOT NULL DEFAULT false,
  donation boolean NOT NULL DEFAULT false,
  PRIMARY KEY (user_id, product_id, expiry)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products, public.sales, public.rescue_actions TO authenticated;
GRANT ALL ON public.products, public.sales, public.rescue_actions TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own products" ON public.products FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Own rescue actions" ON public.rescue_actions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE public.products, public.sales, public.rescue_actions;