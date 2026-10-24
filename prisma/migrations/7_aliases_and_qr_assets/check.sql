-- aliases-and-qr-assets.check.sql: behaviour checks. Run on a THROWAWAY database after the migration.
-- Lines marked 'must FAIL' should print an ERROR; 'OK' lines print nothing. Verified once on PostgreSQL 16 with my own earlier migrations (not your repo's).
\set ON_ERROR_STOP off
INSERT INTO weddings (id,slug,bride_name,groom_name,wedding_date) VALUES
 ('11111111-1111-1111-1111-111111111111','demo-one','A','B','2027-01-01'),
 ('22222222-2222-2222-2222-222222222222','demo-two','C','D','2027-01-02');
\echo '--- A1 normal alias OK'
INSERT INTO wedding_aliases (alias,wedding_id,kind) VALUES ('demo-one-2027','11111111-1111-1111-1111-111111111111','vanity');
\echo '--- A2 reserved alias must FAIL'
INSERT INTO wedding_aliases (alias,wedding_id,kind) VALUES ('pricing','11111111-1111-1111-1111-111111111111','vanity');
\echo '--- A3 alias equal to another wedding slug must FAIL'
INSERT INTO wedding_aliases (alias,wedding_id,kind) VALUES ('demo-two','11111111-1111-1111-1111-111111111111','vanity');
\echo '--- A4 duplicate alias must FAIL'
INSERT INTO wedding_aliases (alias,wedding_id,kind) VALUES ('demo-one-2027','22222222-2222-2222-2222-222222222222','vanity');
\echo '--- A5 new wedding slug equal to an alias must FAIL'
INSERT INTO weddings (slug,bride_name,groom_name,wedding_date) VALUES ('demo-one-2027','X','Y','2027-03-03');
\echo '--- A6 slug change: update slug THEN insert old slug as history must SUCCEED'
BEGIN;
UPDATE weddings SET slug='demo-two-renamed' WHERE id='22222222-2222-2222-2222-222222222222';
INSERT INTO wedding_aliases (alias,wedding_id,kind) VALUES ('demo-two','22222222-2222-2222-2222-222222222222','slug_history');
COMMIT;
\echo '--- A7 alias text update must FAIL, delete must FAIL, move must FAIL'
UPDATE wedding_aliases SET alias='something-new' WHERE alias='demo-two';
DELETE FROM wedding_aliases WHERE alias='demo-two';
UPDATE wedding_aliases SET wedding_id='11111111-1111-1111-1111-111111111111' WHERE alias='demo-two';
\echo '--- A8 erasure transaction with opt-in may rewrite text, retire OK'
BEGIN; SET LOCAL app.allow_alias_erase='on';
UPDATE wedding_aliases SET alias='erased-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' WHERE alias='demo-two';
COMMIT;
UPDATE wedding_aliases SET retired_at=now() WHERE alias='demo-one-2027';
\echo '--- A9 hard-deleting a wedding that has aliases must FAIL (RESTRICT)'
DELETE FROM weddings WHERE id='11111111-1111-1111-1111-111111111111';
\echo '--- Q1 draft QR OK; bad url and bad hash must FAIL'
INSERT INTO qr_assets (id,wedding_id,encoded_url,format,size_mm,generator,file_hash,storage_key)
 VALUES ('aaaaaaaa-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111111','https://shadify.in/demo-one','svg',30,'qr-lib@1.0',repeat('a',64),'weddings/x/qr_v1.svg');
INSERT INTO qr_assets (wedding_id,encoded_url,format,size_mm,generator,file_hash,storage_key)
 VALUES ('11111111-1111-1111-1111-111111111111','http://shadify.in/demo-one?x=1','svg',30,'l',repeat('b',64),'k');
INSERT INTO qr_assets (wedding_id,encoded_url,format,size_mm,generator,file_hash,storage_key)
 VALUES ('11111111-1111-1111-1111-111111111111','https://shadify.in/demo-one','svg',30,'l','NOTHEX','k');
\echo '--- Q2 approving without approver must FAIL'
UPDATE qr_assets SET status='approved_for_print' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '--- Q3 proof -> approve with approver OK'
UPDATE qr_assets SET status='proofed' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
INSERT INTO users (id,email,full_name,role) VALUES ('99999999-9999-9999-9999-999999999999','s@x.test','Staff','staff');
UPDATE qr_assets SET status='approved_for_print', approved_by='99999999-9999-9999-9999-999999999999', approved_at=now() WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '--- Q4 locked: change url / hash must FAIL; move backwards must FAIL'
UPDATE qr_assets SET encoded_url='https://shadify.in/other' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
UPDATE qr_assets SET file_hash=repeat('c',64) WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
UPDATE qr_assets SET status='draft' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '--- Q5 forward to printed OK, then superseded OK, revive must FAIL'
UPDATE qr_assets SET status='printed', printer_label='Test Printers', quantity=500, printed_at=now() WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
UPDATE qr_assets SET status='superseded' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
UPDATE qr_assets SET status='printed' WHERE id='aaaaaaaa-0000-0000-0000-000000000001';
\echo '--- Q6 scan test row OK; bad lighting must FAIL'
INSERT INTO qr_scan_tests (asset_id,device,scanner,lighting,passed) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','iPhone 13','camera','dim',true);
INSERT INTO qr_scan_tests (asset_id,device,scanner,lighting,passed) VALUES ('aaaaaaaa-0000-0000-0000-000000000001','Pixel','camera','neon',true);
