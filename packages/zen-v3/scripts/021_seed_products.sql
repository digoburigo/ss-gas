-- Seed some example products for the sales system
INSERT INTO products (name, description, category, unit_price, active) VALUES
  ('Shoyu', 'Molho de soja tradicional', 'Condimentos', 8.50, true),
  ('Ketchup', 'Molho de tomate', 'Condimentos', 6.00, true),
  ('Maionese', 'Maionese tradicional', 'Condimentos', 7.50, true),
  ('Mostarda', 'Mostarda amarela', 'Condimentos', 5.00, true),
  ('Azeite', 'Azeite extra virgem', 'Óleos', 25.00, true),
  ('Vinagre', 'Vinagre de vinho tinto', 'Condimentos', 4.50, true),
  ('Sal', 'Sal refinado', 'Temperos', 3.00, true),
  ('Pimenta', 'Pimenta do reino moída', 'Temperos', 8.00, true)
ON CONFLICT DO NOTHING;
