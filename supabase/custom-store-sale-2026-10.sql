-- Raed store — flagship custom store on sale (17 Oct 2026): was 4999, now 3999. Safe to run again.
update public.products set price = 4999, sale_price = 3999 where id = 'custom-ecommerce-store';
select id, price, sale_price from public.products where id = 'custom-ecommerce-store';
