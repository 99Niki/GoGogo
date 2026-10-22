# GoGogo

A colorful, dependency-free planner for friends, solo travelers, families, and everyone else.

## Run locally

With Python 3 already installed, open a terminal in this project directory and run:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open **http://127.0.0.1:8000/**. Stop the server with **Ctrl+C**. No install or build step is required. You can also open `index.html` directly, though browser storage and clipboard behavior can vary for file URLs.

## Interactions

- **Itinerary:** enter a city, From/start date, days, and currency, then choose **Generate plan**. Three editable activities are created per day automatically. Repeat to add another city without replacing your existing plan. Save your group type and comma-separated unique traveler names separately.
- **Budget & Expenses:** enter a whole-trip or per-person budget; it saves and recalculates while typing valid amounts. See Budget, Planned, Spent, Remaining/Over budget, a spending meter, and actual spending by category. Category bars show each category's share of total spending, without planned amounts. Planned estimates remain in the overall summary and do not count as actual spending.
- Add actual expenses with amount, payer, category, day, and selected travelers to split between. **Add expense**, **Edit**, **Save expense**, **Cancel edit**, and **Remove** update actual spending and settlements immediately after saving/removing. Add traveler names before recording an expense.
- **Settle Up:** see each person's balance and suggested transfers. Each expense is split only among its selected travelers; rounding remainders go in selected traveler order. Solo trips show personal spending. **Copy summary** includes a manual-copy fallback.
- **Copy invitation:** copy a trip summary to a message. If clipboard access fails, manually copy the displayed text. This is not a live collaboration link.
- Use **Edit** on an activity to adjust its name or time, then **Save activity**. Use its **Move to day** selector to move it to any day, including another city; the planner follows the moved activity.
- The compact trip header stays above all three views. Give the trip a name, then save trip details. Day chips switch the timeline; category colors distinguish Food, Stay, Sights, Transit, and Activity, with text labels as well.
- Daily itinerary follows the original Wayfare layout: day/date chips, a left-hand time and dot rail, and compact colored cards with separate title, category, place, notes, and edit/move controls. The standalone “Your days, your pace” block and duplicate day dropdown are removed from the visible layout.
- Activities can include a place, notes, and a user-entered estimated group cost. Scheduled estimates appear under Planned; **Ideas** estimates are excluded. **Ideas** holds unscheduled plans, even before adding a city. Move them onto a day when ready.
- Adjust each city's duration with its **Days** input. Added days automatically receive starter activities. Activities from removed days or deleted cities move to Ideas rather than being deleted. Existing browser-saved trips remain supported and are not automatically overwritten.

## Offline starter plans

Built-in routes cover the first three days in New York City (including NYC), Tokyo, Paris, London, and Lisbon. Other cities and longer stays use explicitly labeled general exploration, food, and walking ideas. These are static, offline templates—not AI, live recommendations, optimized routing, or verified opening hours. Check hours, reservations, accessibility, and travel times yourself. Generated suggestions do not create expenses or claim prices. All activities remain editable, movable, and removable.

New trips start with no invented travelers, expenses, costs, or example placeholders. Existing browser-saved trips are preserved, including names previously entered or saved. Header fields autosave on valid changes when leaving the field; **Save trip details** explicitly saves them too. Timeline and expense updates no longer erase unsaved form drafts.

Data saves in this browser when local storage is available. Clearing storage removes it. Currency is one trip-wide unit, not an exchange-rate converter. Currency locks while expenses or positive activity estimates exist; clear those amounts before changing currency. Suggested transfers do not move money.

Traveler names stay editable even with expenses. Replace a name and leave the field or choose **Save trip details**; payer names, split participants, and balances update together. Unchanged names retain their expense links, even if reordered. When replacing multiple names, keep their relative order so each replacement matches the correct person. Append new travelers; existing expenses keep their original participants, including older expenses previously split among everyone. Removing a person who is still part of an expense is blocked with an explanation rather than losing their records.

## Files

- `index.html`: semantic page, three views, labeled forms, and invitation text.
- `style.css`: colorful responsive cards and keyboard focus states.
- `script.js`: view/day switching, trip editing, local saving, sharing, and equal expense splitting.
- `AGENTS.md`: constraints for future project work.

## Manual browser checks

Check 320px and desktop layouts, keyboard navigation, visible focus, screen-reader labels and announcements, reload persistence, clipboard fallback, activity and expense removal, and solo/group settlement totals.
