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

- Identify food using the product's optional isFood flag, treating legacy grocery records as food; the product form must allow non-food items to be excluded.
- Scope rescue action flags to product ID and expiry date so editing a product to a new batch cannot inherit old actions; impact counts unique current eligible stock, not confirmed completed rescues.
- Cloud is the source of truth for signed-in users: `src/lib/cloud-sync.ts` pulls into the localStorage cache and pushes store changes via `setChangeHook`, so pages keep using the synchronous store API.
