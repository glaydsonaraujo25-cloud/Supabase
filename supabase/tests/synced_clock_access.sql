begin;
insert into auth.users(id,email,raw_user_meta_data,created_at,updated_at) values
('b6000000-0000-4000-8000-000000000001','clock-a@example.invalid','{"full_name":"A"}',now(),now()),
('b6000000-0000-4000-8000-000000000002','clock-b@example.invalid','{"full_name":"B"}',now(),now());
set local role authenticated;
select set_config('request.jwt.claim.sub','b6000000-0000-4000-8000-000000000001',true);
do $$ declare c jsonb; oldrun uuid; v bigint; begin
 c:=public.study_clock_command('read');oldrun:=(c->>'run_id')::uuid;
 c:=public.study_clock_command('start',(c->>'version')::bigint,oldrun);v:=(c->>'version')::bigint;
 begin perform public.study_clock_command('pause',0,oldrun);raise exception 'Stale write accepted';exception when raise_exception then if sqlerrm<>'clock_conflict' then raise;end if;end;
 -- Simulate elapsed time without waiting in the test.
 update public.study_clocks set started_at=clock_timestamp()-interval '125 seconds' where user_id=auth.uid();
 c:=public.study_clock_command('pause',v,oldrun);v:=(c->>'version')::bigint;
 if (c->>'accumulated')::integer<125 then raise exception 'Time not accumulated';end if;
 c:=public.study_clock_command('finish',v,oldrun,current_date,null,'Test session');
 if (select count(*) from public.study_sessions where id=oldrun and minutes=2)<>1 then raise exception 'Session missing';end if;
 c:=public.study_clock_command('finish',v,oldrun,current_date,null,'Retry');
 if (select count(*) from public.study_sessions)<>1 then raise exception 'Duplicate session';end if;
 if (c->>'accumulated')::integer<>0 then raise exception 'Clock not reset';end if;
end $$;
select set_config('request.jwt.claim.sub','b6000000-0000-4000-8000-000000000002',true);
do $$ declare n integer; begin
 if exists(select 1 from public.study_clocks) then raise exception 'Clock leak';end if;
 update public.study_clocks set accumulated=100;get diagnostics n=row_count;if n<>0 then raise exception 'Other clock writable';end if;
end $$;
reset role;
set local role anon;
do $$ begin begin perform public.study_clock_command('read');raise exception 'Anon RPC';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'PASS: synchronized clock, stale version rejection, atomic save, retry idempotency and ownership' as result;
