-- Raed store — limited coupons are no longer held forever by unpaid orders (security audit, 13 Nov 2026).
-- Run once in Supabase → SQL Editor, after the other files. Safe to run again.
--
-- Before: place_order counts a coupon use when the order is created. Only a cancel gives it back, and nothing cancels
-- an unpaid order, so a few accounts that never pay could use up a limited coupon (max_uses) for every customer.
-- Now: when a limited coupon is full, unpaid orders that used it more than 2 hours ago are cancelled, which gives their
-- uses back (trigger orders_coupon_release). Coupons with no limit, and unpaid orders younger than 2 hours, are untouched.
-- A late payment for such an order is not lost: Tap emails the owner an alert, Tamara cancels it on their side.
-- place_order already calls check_coupon before counting a use, so it gets the same rule without being rewritten.

create or replace function public.check_coupon(p_code text) returns public.coupons
language plpgsql volatile security definer set search_path = public as $$
declare v_c public.coupons;
begin
  select * into v_c from public.coupons
   where code = upper(p_code) and active and (expires_at is null or expires_at > now());
  if not found then return null; end if;
  if v_c.max_uses is not null and v_c.used >= v_c.max_uses then
    update public.orders
       set status = 'cancelled',
           history = history || jsonb_build_array(jsonb_build_object('status', 'cancelled', 'at', now(),
                     'note', 'أُلغي تلقائياً: ما اندفع خلال ساعتين وكود الخصم محدود العدد'))
     where coupon = v_c.code and status = 'pending' and created_at < now() - interval '2 hours';
    select * into v_c from public.coupons where code = v_c.code;
  end if;
  if v_c.max_uses is not null and v_c.used >= v_c.max_uses then return null; end if;
  return v_c;
end $$;

revoke execute on function public.check_coupon(text) from anon, public;
grant execute on function public.check_coupon(text) to authenticated;
