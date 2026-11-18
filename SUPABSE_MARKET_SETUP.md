-- ============================================
-- RIG COUNTS
-- ============================================
create table rig_counts (
  id bigint generated always as identity primary key,
  region text not null check (region in ('US', 'Canada')),
  report_date date not null,
  total_count int not null,
  oil_rigs int,
  gas_rigs int,
  misc_rigs int,
  wow_change int,           -- week-over-week change, precomputed for display
  source text default 'baker_hughes',
  fetched_at timestamptz default now(),
  unique (region, report_date)
);
create index idx_rig_counts_region_date on rig_counts (region, report_date desc);


-- ============================================
-- COMMODITIES (WTI, Brent, Nat Gas, Heating Oil)
-- ============================================
create table commodities (
  symbol text primary key,        -- 'CL1!', 'BZ1!', 'NG1!', 'HO1!'
  name text not null,             -- 'WTI Crude Oil'
  unit text                       -- '$/bbl', '$/MMBtu'
);

create table commodity_prices (
  id bigint generated always as identity primary key,
  symbol text not null references commodities(symbol),
  price_date date not null,
  last_price numeric(10,2) not null,
  daily_change_pct numeric(6,3),
  weekly_change_pct numeric(6,3),
  source text,
  fetched_at timestamptz default now(),
  unique (symbol, price_date)
);
create index idx_commodity_prices_symbol_date on commodity_prices (symbol, price_date desc);


-- ============================================
-- COMPANIES (majors + oilfield services)
-- ============================================
create table companies (
  ticker text primary key,        -- 'XOM', 'SLB'
  name text not null,
  category text not null check (category in ('major', 'service')),
  market_cap_display text         -- '$495B' -- store as display string, refresh separately if needed
);

create table company_quotes (
  id bigint generated always as identity primary key,
  ticker text not null references companies(ticker),
  quote_time timestamptz not null,
  price numeric(10,2),
  change_pct numeric(6,3),
  source text,
  fetched_at timestamptz default now(),
  unique (ticker, quote_time)
);
create index idx_company_quotes_ticker_time on company_quotes (ticker, quote_time desc);


-- ============================================
-- GLOBAL INDICES (S&P 500, Nasdaq 100)
-- ============================================
create table indices (
  symbol text primary key,        -- 'SPX', 'NDX'
  name text not null              -- 'S&P 500'
);

create table index_quotes (
  id bigint generated always as identity primary key,
  symbol text not null references indices(symbol),
  quote_time timestamptz not null,
  value numeric(12,2),
  change_pct numeric(6,3),
  source text,
  fetched_at timestamptz default now(),
  unique (symbol, quote_time)
);
create index idx_index_quotes_symbol_time on index_quotes (symbol, quote_time desc);


-- ============================================
-- FETCH LOG (mirrors your job scraper's run tracking)
-- ============================================
create table market_fetch_log (
  id bigint generated always as identity primary key,
  source text not null,           -- 'eia', 'finnhub', 'baker_hughes'
  fetch_type text not null,       -- 'commodities', 'rig_counts', 'stocks', 'indices'
  success boolean not null,
  records_fetched int,
  error_message text,
  run_at timestamptz default now()
);

-- Migration: expand rig_counts to capture every column from the
-- Baker Hughes summary table, plus allow the International region.

-- 1. Allow 'International' as a region (previously only US/Canada)
alter table rig_counts drop constraint if exists rig_counts_region_check;
alter table rig_counts add constraint rig_counts_region_check
  check (region in ('US', 'Canada', 'International'));

-- 2. Add the columns we were previously dropping on the floor
alter table rig_counts add column if not exists date_of_prior_count date;
alter table rig_counts add column if not exists change_from_last_year int;
alter table rig_counts add column if not exists date_of_last_year_count date;

-- Note: total_count + wow_change already existed and map to
-- "Count" + "Change from Prior Count" respectively.

insert into companies (ticker, name, category) values
  ('XOM', 'ExxonMobil', 'major'),
  ('SHEL', 'Shell', 'major'),
  ('CVX', 'Chevron', 'major'),
  ('TTE', 'TotalEnergies', 'major'),
  ('COP', 'ConocoPhillips', 'major'),
  ('SLB', 'Schlumberger', 'service'),
  ('HAL', 'Halliburton', 'service'),
  ('BKR', 'Baker Hughes', 'service'),
  ('NOV', 'NOV Inc.', 'service'),
  ('FTI', 'TechnipFMC', 'service');
insert into commodities (symbol, name, unit) values
  ('CL1!', 'WTI Crude Oil', '$/bbl'),
  ('BZ1!', 'Brent Crude Oil', '$/bbl'),
  ('NG1!', 'Natural Gas', '$/MMBtu'),
  ('HO1!', 'Heating Oil', '$/gal');
insert into indices (symbol, name) values
  ('SPX', 'S&P 500'),
  ('NDX', 'Nasdaq 100');
insert into indices (symbol, name) values ('DJI', 'Dow Jones Industrial Average');