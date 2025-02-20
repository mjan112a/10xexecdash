-- Create the salesdata table
CREATE TABLE IF NOT EXISTS salesdata (
    uuid TEXT PRIMARY KEY,
    invoice_number TEXT,
    date DATE,
    customer TEXT,
    first_sale_date DATE,
    item TEXT,
    quantity NUMERIC,
    item_weight NUMERIC,
    total_weight NUMERIC,
    shipping MONEY,
    product_revenue MONEY,
    total_revenue MONEY,
    sales_rep TEXT,
    online_offline TEXT,
    product_line TEXT,
    first_repeat TEXT,
    order_category TEXT
);

-- Insert sample data
INSERT INTO salesdata (
    uuid,
    invoice_number,
    date,
    customer,
    first_sale_date,
    item,
    quantity,
    item_weight,
    total_weight,
    shipping,
    product_revenue,
    total_revenue,
    sales_rep,
    online_offline,
    product_line,
    first_repeat,
    order_category
) VALUES 
    ('1', 'INV4182', '2024-01-02', '1381 Second Chance Cycle & Customs, LLC', '2022-05-10', 'KX-20/70-50', 10.00, 50.00, 500.00, '$0.00', '$155.00', '$155.00', 'Edris, Steven S', 'Offline', 'KinetiX', 'Repeat', 'Small Direct'),
    ('2', 'INV4221', '2024-01-02', '1525 Charged Coatings', '2023-06-20', 'EX-EP-50', 1.00, 50.00, 50.00, '$0.00', '$52.95', '$52.95', 'Gillenwater, Carrie', 'Offline', 'EpiX', 'Repeat', 'Small Direct'),
    ('3', 'INV4261', '2024-01-02', '1567 Northern Tool & Equipment', '2023-10-23', 'KX-20/70-50', 2.00, 50.00, 100.00, '$0.00', '$28.00', '$28.00', 'Gillenwater, Carrie', 'Offline', 'KinetiX', 'Repeat', 'Distributor');