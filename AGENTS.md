<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- Module logic lives in pure functions under `src/lib/rtm/` (tested in `src/test/rtm-rules.test.ts`); routes only render. Why: requirement rules stay verifiable per R-id.
- `noUncheckedIndexedAccess` is off: the numeric engines index arrays heavily and the guards add noise.
- tesseract.js is only dynamically imported inside a click handler. Why: it is browser-only and heavy.

- Directory preview state lives in a shared React provider, not browser storage; role selectors navigate demonstration views and never authorize users. Why: preserve session-only prototype scope without implying secure accounts.
- Directory filter logic lives in `src/lib/rtm/directory.ts` and view components in `src/components/directory/`; route files mount views. Why: preserve testable domain logic and focused rendering.
- The sample neighborhood map uses app-owned illustrative vectors with maintained zoom/pan controls, not geographic tiles. Why: show sample locations without pretending they are geocoded listings.
