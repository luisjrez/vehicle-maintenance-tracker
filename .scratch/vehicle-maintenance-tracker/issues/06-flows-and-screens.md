# Flows and screens

Type: prototype
Status: resolved
Blocked by: 05, 16

## Question

How should the core flows look and behave on mobile — garage, add vehicle (type or scan VIN, or pick make/model/year; invalid VIN → "Add without VIN"; review/edit decoded details), log work (record with line items, odometer typed or scanned, consistency errors), vehicle log with cost totals, edit/delete, and Settings → transfer to another phone (show QR / scan QR, replace-data warning)? Build a rough prototype to react to.

## Comments

- 2026-10-26: Prototype built — [flows-prototype.html](../prototypes/flows-prototype.html) (open in a browser; `?variant=A|B|C`, ← / → keys). A: tabs + garage cards + single-scroll form. B: vehicle switcher home + "+" action sheet + 3-step wizard. C: timeline-first + garage sheet + invoice-style form. Shared: add vehicle (type/scan VIN, invalid → Add without VIN, review decoded details, required initial odometer), scanner with VIN/Odometer/QR modes, odometer consistency errors, record detail/edit/delete, transfer QR. Verdict pending the user's reaction.

## Answer

Resolved 2026-10-26 (user reviewed the prototype). **Variant B wins: vehicle switcher home**, with a strong push toward native **bottom sheets and modals**.

- **Home:** one vehicle at a time. Horizontal vehicle carousel (+ "Add" tile) on top; selected vehicle summary (current mileage, spend this year), "Vehicle details & VIN" row, basic spending report (year chips, per-category bars), history list. Settings via a header button. Empty state: "Add your first vehicle" / "I have data on another phone".
- **Primary action:** floating "+" opening an action sheet (Log work, Add vehicle, Transfer to another phone).
- **Log work:** 3-step wizard (What was done → When & where → What did it cost) with the common-services chips, a searchable service picker (catalog + custom), optional per-line costs on the cost step, odometer consistency errors inline on step 2.
- **Direction for sheets/modals** (to refine during implementation with Expo Router form sheets / detents): action menu, service picker, log-work wizard and record detail as bottom sheets; add vehicle as a modal; scanner (VIN / Odometer / QR) as a full-screen modal; transfer QR as a sheet; destructive confirmations as native alerts.
- Shared flows from the prototype stand: add vehicle (type/scan VIN, invalid → Add without VIN, review/edit decoded details, required initial odometer), one scanner screen with VIN/Odometer/QR modes, record detail/edit/delete, transfer with replace-data warning.

The prototype ([flows-prototype.html](../prototypes/flows-prototype.html), `?variant=B`) is throwaway reference for the PRD; delete it once the spec is written.
