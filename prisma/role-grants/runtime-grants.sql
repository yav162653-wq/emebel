REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM emebel_app;
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public FROM emebel_app;

GRANT SELECT, INSERT, UPDATE
ON TABLE public.users, public.identities, public.organizations, public.memberships
TO emebel_app;

GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.auth_tokens, public.external_auth_transactions, public.session
TO emebel_app;

GRANT SELECT, UPDATE ON TABLE public.products TO emebel_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.cart_items TO emebel_app;
GRANT SELECT, INSERT, UPDATE ON TABLE public.orders TO emebel_app;
GRANT SELECT, INSERT ON TABLE public.order_items TO emebel_app;
GRANT SELECT, INSERT, DELETE ON TABLE public.wishlists TO emebel_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.reviews TO emebel_app;
GRANT SELECT, INSERT ON TABLE public.newsletters TO emebel_app;

GRANT USAGE
ON SEQUENCE public.users_id_seq,
            public.identities_id_seq,
            public.newsletters_id_seq,
            public.order_items_id_seq,
            public.orders_id_seq,
            public.cart_items_id_seq,
            public.reviews_id_seq,
            public.wishlists_id_seq
TO emebel_app;
