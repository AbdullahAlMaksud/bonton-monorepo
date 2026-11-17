# Bonton (বণ্টন)

Offline-first expense splitting. Create groups, add expenses (multiple payers, personal bills, equal / percentage / custom splits), see balances and the fewest payments needed to settle up. Bengali and English, 5 themes, 5 currencies. Everything stays on the device.

## Run it

```bash
bun install
bun run prebuild        # generates ios/ and android/ (first time, or after native dependency changes)
bun run android         # or: bun run ios
```

**Expo Go will not work.** Unistyles 3 and Reanimated 4 use native modules (Nitro), so the app needs a development build (`expo run:android` / `expo run:ios`, or an EAS dev build).

Other scripts: `bun run typecheck` (strict `tsc` for app + tests), `bun test`.

## Structure

```
index.ts                     entry: configures Unistyles BEFORE expo-router loads routes
src/
  app/                       routes only (thin)
    _layout.tsx              providers, splash/hydration gate, theme + language sync, error boundary
    (tabs)/index.tsx         dashboard
    (tabs)/settings.tsx      language, 5 themes, currency
    groups/new.tsx           create group (or edit with ?groupId=)
    groups/[id].tsx          group detail: Expenses / Balances / Settle up
    expense/add.tsx          add expense (or edit with ?expenseId=)
  features/                  screen-specific components and logic
    dashboard/  group/  settings/
    expense/expense-form.ts  pure, unit-tested form logic (text in → validated ExpenseInput out)
  shared/
    lib/settlement.ts        calculation engine (pure TS)
    lib/group-math.ts        balances / settlements / dashboard totals
    lib/money.ts             formatting + string→integer parsing (no floats)
    store/bonton-store.ts    Zustand + AsyncStorage persistence
    theme/                   themes.ts (5 themes) + unistyles.ts (configure)
    i18n/                    typed en / bn resources
    ui/                      design-system components
```

## How the money works

- All amounts are **integer minor units** (poisha / cents). User text is parsed with string arithmetic, never `parseFloat`; allocation uses BigInt, so no float error and no overflow.
- Percentages are stored as **basis points** (33.33 % = 3333). If they don't add to 100 they are scaled proportionally, exactly (one rounding step, remainder to the largest fractions).
- Equal splits give the leftover cents to the **first members**.
- **Personal bills** are deducted first; the rest is split.
- **Multiple payers**: what people paid must equal the total.
- **Debt minimization**: exact matches are paired first, then the largest debtor pays the largest creditor. At most n−1 payments.
- **Removing a member** drops their payments and personal bills (the bill shrinks to what remaining payers actually fronted) and re-splits the shared amount among the rest (equal → n−1, percentages → renormalized, custom → their amount spread proportionally). An expense nobody is left to pay for or share is deleted. The UI shows the member's balance before confirming.

## Notes

- **Unistyles 3 API**: `UnistylesRegistry` was a v2 API. v3 registers themes and breakpoints with `StyleSheet.configure` (in `src/shared/theme/unistyles.ts`).
- **Theme colors**: primary / background / card are exactly as specified. White text on the specified emerald is only 2.5:1, so the light theme uses a dark `onPrimary`, and each theme has a `primaryText` token for text on surfaces. All text, accent and status tokens are ≥ 4.5:1 on both background and card.
- **Pinned versions** follow Expo SDK 58's bundled set (AsyncStorage 2.2.0, worklets 0.13.0, svg 15.16.0). Run `bunx expo install --check` after upgrading.
- **Tests**: engine (incl. randomized invariants), form logic, and store actions. The app was also bundled with Metro for Android and iOS.
- **Not yet verified on a device**: visual layout, Bengali glyph rendering, and keyboard behavior on Android edge-to-edge (the screen shell uses `KeyboardAvoidingView` there and the ScrollView's own inset handling on iOS).
