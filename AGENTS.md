<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Marketplace data (dresses, bookings, favorites, profiles, roles) lives in Lovable Cloud; `src/lib/store.ts` is the single client cache that refetches on auth change, focus and realtime events — why: keeps every page synced across devices through one place.
- Permissions are enforced in the database (RLS + guard triggers on dresses/bookings); operator status lives in `user_roles` checked via `has_role` — why: UI gates are only cosmetic.
