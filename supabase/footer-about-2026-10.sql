-- Raed store — footer sentence under the logo (October 2026).
-- The saved footer text still says «ونسوّقه» (and markets it). Run once in Supabase → SQL Editor; safe to run again.
-- It changes only that sentence; the design backup trigger keeps the previous version. Redeploy afterwards so the
-- pre-rendered pages pick it up.
update public.site_settings
   set data = jsonb_set(data, '{footer,about}', to_jsonb('نبني لك متجراً يلفت النظر، ونرتّب أوراقه الرسمية، وتنطلق بثقة.'::text), true)
 where id = 'main';

-- should show the new sentence
select data #>> '{footer,about}' as "جملة الفوتر" from public.site_settings where id = 'main';
