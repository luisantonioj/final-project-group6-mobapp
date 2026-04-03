-- Roles
insert into public."Roles" (role_name) values
  ('Admin'),
  ('Student'),
  ('Candidate');

-- Positions — adjust to your org's actual ballot
insert into public."Positions" (position_name, display_order) values
  ('Executive President',         1),
  ('Executive Vice President',    2),
  ('Secretary General',           3),
  ('Treasurer',                   4),
  ('Auditor',                     5),
  ('Public Relations Officer',    6),
  ('1st Year Representative',     7),
  ('2nd Year Representative',     8);

-- SystemSettings singleton
insert into public."SystemSettings" (
  voting_start_time, voting_end_time,
  is_miting_active, show_live_results
) values (
  now(),                          -- update to actual election date before prod
  now() + interval '8 hours',
  false,
  false
);

-- Notification templates
insert into public."Notifications" (event_trigger, title, message_body) values
  ('voting_start',  'Voting is now open!',        'Cast your vote before the polls close.'),
  ('voting_end',    'Voting has closed',           'Thank you for participating in AnimoQuorum.'),
  ('miting_opened', 'Miting de Avance is live',   'Submit and upvote questions for your candidates now.');