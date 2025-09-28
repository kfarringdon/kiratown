-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.book (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  title text NOT NULL,
  author text NOT NULL,
  genre text,
  year smallint,
  CONSTRAINT book_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user_book (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  book_id bigint NOT NULL,
  rating smallint,
  owned boolean NOT NULL DEFAULT false,
  read_at timestamp with time zone,
  CONSTRAINT user_book_pkey PRIMARY KEY (id),
  CONSTRAINT user_book_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT user_book_book_id_fkey FOREIGN KEY (book_id) REFERENCES public.book(id)
);