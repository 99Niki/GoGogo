const $ = (id) => document.getElementById(id);
const storageKey = 'gogogo-trip-v1';
const today = new Date();
const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
const freshTrip = () => ({ name: '', group: 'Friends', start: localDate, currency: 'USD', travelers: [], cities: [], activities: [], expenses: [], budget: 0, budgetMode: 'total' });
let trip = freshTrip();
let selectedDay = '';
let editingActivity = null;
let editingExpense = null;
let renderedTravelers = null;
const announce = (text) => { $('status').textContent = text; };
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const factor = () => trip.currency === 'JPY' ? 1 : 100;
const money = (value) => new Intl.NumberFormat(undefined, { style: 'currency', currency: trip.currency }).format(value / factor());

// Offline starter routes, grouped geographically. No network or API keys needed.
const cityRoutes = {
  'new york': [
    ['Central Park', 'The Metropolitan Museum of Art', 'Upper East Side'],
    ['Bryant Park', 'New York Public Library · Stephen A. Schwarzman Building', 'Times Square'],
    ['Brooklyn Bridge', 'DUMBO', 'Brooklyn Bridge Park']
  ],
  tokyo: [
    ['Sensō-ji temple', 'Asakusa neighborhood', 'Sumida Park'],
    ['Meiji Jingū', 'Harajuku', 'Shibuya Crossing'],
    ['Ueno Park', 'Tokyo National Museum', 'Ameyoko market']
  ],
  paris: [
    ['Tuileries Garden', 'Louvre Museum', 'Seine riverside'],
    ['Eiffel Tower surroundings', 'Champ de Mars', 'Rue Cler'],
    ['Sacré-Cœur', 'Montmartre', 'Place du Tertre']
  ],
  london: [
    ['Westminster', 'St James’s Park', 'South Bank'],
    ['British Museum', 'Covent Garden', 'Soho'],
    ['Tower Bridge', 'Borough Market', 'Tate Modern']
  ],
  lisbon: [
    ['Alfama', 'São Jorge Castle', 'Miradouro da Graça'],
    ['Jerónimos Monastery', 'Belém neighborhood', 'Belém riverside'],
    ['Chiado', 'Time Out Market', 'Praça do Comércio']
  ]
};
const cityAliases = { nyc: 'new york', 'new york city': 'new york', 'new york city ny': 'new york', 'new york ny': 'new york', 'new york usa': 'new york', 'new york city usa': 'new york', '東京': 'tokyo', 'lisboa': 'lisbon' };
function starterPlan(city, fromDay = 0) {
  const normalized = city.name.toLowerCase().split(',')[0].trim().replace(/\s+/g, ' ');
  const routes = cityRoutes[cityAliases[normalized] || normalized] || [];
  const themes = ['neighborhoods', 'local culture', 'parks and scenery', 'markets and shops', 'architecture', 'creative spaces', 'favorite discoveries'];
  const result = [];
  for (let day = fromDay; day < city.days; day++) {
    const route = routes[day];
    const theme = themes[day % themes.length];
    const stops = route ? [
      ['09:00', `Explore ${route[0]}`, 'Sights', route[0]],
      ['13:00', `Discover ${route[1]}`, 'Activity', route[1]],
      ['17:00', `Unwind around ${route[2]}`, 'Activity', route[2]]
    ] : [
      ['09:00', `Explore ${city.name}: ${theme}`, 'Sights', city.name],
      ['13:00', `Lunch and local flavors in ${city.name}`, 'Food', city.name],
      ['17:00', `A relaxed ${theme} walk in ${city.name}`, 'Activity', city.name]
    ];
    for (const [time, title, category, place] of stops) {
      result.push({ id: id(), day: `${city.id}:${day}`, time, title, category, place,
        notes: route ? 'Built-in starter suggestion. Check hours, tickets, accessibility, and travel time before visiting.' : 'General starter idea, not a verified venue. Choose a specific spot that suits your group.' });
    }
  }
  return result;
}

// Stored data is validated; user-provided text never becomes HTML.
function validTrip(value) {
  return value && ['Friends', 'Solo', 'Family', 'Other'].includes(value.group)
    && ['USD', 'EUR', 'GBP', 'JPY', 'CAD'].includes(value.currency)
    && typeof value.start === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.start) && !Number.isNaN(Date.parse(value.start))
    && Array.isArray(value.travelers) && value.travelers.every((name) => typeof name === 'string' && name.trim())
    && new Set(value.travelers).size === value.travelers.length
    && Number.isSafeInteger(value.budget) && value.budget >= 0
    && Array.isArray(value.cities) && value.cities.every((city) => typeof city.id === 'string' && typeof city.name === 'string' && Number.isInteger(city.days) && city.days > 0 && city.days <= 30)
    && (value.budgetMode === undefined || ['total', 'person'].includes(value.budgetMode))
    && Array.isArray(value.activities) && value.activities.every((item) => typeof item.id === 'string' && typeof item.day === 'string' && typeof item.time === 'string' && typeof item.title === 'string' && (item.cost === undefined || Number.isSafeInteger(item.cost) && item.cost >= 0))
    && Array.isArray(value.expenses) && value.expenses.every((item) => typeof item.id === 'string' && typeof item.title === 'string' && value.travelers.includes(item.payer) && Number.isSafeInteger(item.amount) && item.amount > 0 && (item.split === undefined || Array.isArray(item.split) && item.split.length > 0 && new Set(item.split).size === item.split.length && item.split.every((name) => value.travelers.includes(name))));
}
try {
  const saved = localStorage.getItem(storageKey);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (!validTrip(parsed)) throw new Error('Invalid saved trip');
    trip = parsed;
  }
} catch {
  announce('Saved data could not be loaded. You can still plan this trip here.');
}

function save(message) {
  render();
  try {
    localStorage.setItem(storageKey, JSON.stringify(trip));
    announce(message);
  } catch {
    announce(`${message} Browser saving is unavailable; changes last only this session.`);
  }
}

function days() {
  let offset = 0;
  return trip.cities.flatMap((city) => Array.from({ length: city.days }, (_, index) => {
    const date = new Date(`${trip.start}T12:00:00`);
    date.setDate(date.getDate() + offset++);
    return { key: `${city.id}:${index}`, label: `Day ${offset} · ${city.name}`, date: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) };
  }));
}
function option(value, text) {
  const element = document.createElement('option');
  element.value = value;
  element.textContent = text;
  return element;
}
function row(list, text, remove) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.textContent = text;
  li.append(span);
  if (remove) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Remove';
    button.setAttribute('aria-label', `Remove ${text}`);
    button.addEventListener('click', remove);
    li.append(button);
  }
  list.append(li);
}
function render() {
  // Do not reset form drafts while updating the timeline or financial summaries.
  $('currency').disabled = trip.expenses.length > 0 || trip.activities.some((item) => item.cost > 0);
  $('budget-input').step = $('amount').step = $('estimate').step = 1 / factor();
  $('amount').min = 1 / factor();
  if (renderedTravelers !== JSON.stringify(trip.travelers)) {
    renderedTravelers = JSON.stringify(trip.travelers);
    $('payer').replaceChildren(...trip.travelers.map((name) => option(name, name)));
    $('split-picks').replaceChildren();
    trip.travelers.forEach((name) => {
      const label = document.createElement('label');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.value = name;
      check.checked = true;
      const text = document.createElement('span');
      text.textContent = name;
      label.append(check, text);
      $('split-picks').append(label);
    });
  }
  $('save-expense').disabled = !trip.travelers.length;
  $('expense-help').textContent = trip.travelers.length ? 'Choose who paid and who shares this expense. Totals update as soon as you save.' : 'Add traveler names above before recording an expense.';
  $('cities').replaceChildren();
  trip.cities.forEach((city) => row($('cities'), `${city.name} · ${city.days} ${city.days === 1 ? 'day' : 'days'}`, () => {
    if (!confirm(`Remove ${city.name}? Its activities will move to Ideas.`)) return;
    trip.cities = trip.cities.filter((item) => item.id !== city.id);
    trip.activities.filter((item) => item.day.startsWith(`${city.id}:`)).forEach((item) => { item.day = 'ideas'; });
    resetEditor();
    save('City removed.');
    $('city').focus();
  }));
  trip.cities.forEach((city, index) => {
    const label = document.createElement('label');
    label.className = 'city-duration';
    label.textContent = 'Days';
    const input = document.createElement('input');
    input.type = 'number';
    input.min = '1';
    input.max = '30';
    input.value = city.days;
    input.setAttribute('aria-label', `Days in ${city.name}`);
    input.addEventListener('change', () => {
      if (!input.reportValidity()) return;
      const previousDays = city.days;
      city.days = Number(input.value);
      if (city.days > previousDays) trip.activities.push(...starterPlan(city, previousDays));
      trip.activities.forEach((item) => {
        if (item.day.startsWith(`${city.id}:`) && Number(item.day.split(':')[1]) >= city.days) item.day = 'ideas';
      });
      resetEditor();
      save('City duration updated. New days get starter plans; activities from removed days stay in Ideas.');
      $('cities').children[index].querySelector('input').focus();
    });
    label.append(input);
    $('cities').children[index].append(label);
  });
  if (!trip.cities.length) row($('cities'), 'Where to? Enter a destination above to generate your first plan.');
  const allDays = [...days(), { key: 'ideas', label: 'Ideas · any day', date: 'Keep possibilities here. Move them to a day whenever you’re ready.' }];
  const expenseDay = $('expense-day').value;
  $('expense-day').replaceChildren(option('', 'Trip-wide'), ...days().map((day) => option(day.key, day.label)));
  if (days().some((day) => day.key === expenseDay)) $('expense-day').value = expenseDay;
  if (!allDays.some((day) => day.key === selectedDay)) selectedDay = allDays[0]?.key || '';
  $('day-select').replaceChildren(...allDays.map((day) => option(day.key, day.label)));
  $('day-select').value = selectedDay;
  $('day-chips').replaceChildren();
  allDays.forEach((day) => {
    const button = document.createElement('button');
    button.type = 'button';
    const title = document.createElement('span');
    title.className = 'chip-title';
    title.textContent = day.key === 'ideas' ? 'Ideas' : day.label.split(' · ')[0];
    const subtitle = document.createElement('span');
    subtitle.className = 'chip-subtitle';
    subtitle.textContent = day.key === 'ideas' ? 'Any day' : `${day.date} · ${day.label.split(' · ').slice(1).join(' · ')}`;
    button.append(title, subtitle);
    button.setAttribute('aria-pressed', String(day.key === selectedDay));
    button.addEventListener('click', () => {
      selectedDay = day.key;
      resetEditor();
      render();
      const active = [...$('day-chips').children].find((child) => child.getAttribute('aria-pressed') === 'true');
      active.focus();
      announce(`Showing ${day.label}.`);
    });
    $('day-chips').append(button);
  });
  $('day-select').disabled = $('add-activity').disabled = !selectedDay;
  $('day-caption').textContent = allDays.find((day) => day.key === selectedDay)?.date || 'Add a city to start planning your days.';
  $('activities').replaceChildren();
  const activities = trip.activities.filter((item) => item.day === selectedDay).sort((a, b) => a.time.localeCompare(b.time));
  activities.forEach((item) => {
    const stop = document.createElement('li');
    stop.className = 'timeline-stop';
    const time = document.createElement('time');
    time.className = 'stop-time';
    time.dateTime = item.time;
    time.textContent = item.time;
    const rail = document.createElement('span');
    rail.className = 'stop-rail';
    rail.setAttribute('aria-hidden', 'true');
    const card = document.createElement('article');
    card.className = 'stop-card';
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    card.append(heading);
    if (item.cost > 0) {
      const cost = document.createElement('p');
      cost.className = 'planned-cost';
      cost.textContent = `Estimated ${money(item.cost)}`;
      card.append(cost);
    }
    stop.append(time, rail, card);
    $('activities').append(stop);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.textContent = 'Remove';
    remove.setAttribute('aria-label', `Remove ${item.title}`);
    remove.addEventListener('click', () => {
    trip.activities = trip.activities.filter((activity) => activity.id !== item.id);
    if (editingActivity === item.id) resetEditor();
    save('Activity removed.');
    $('activity').focus();
    });
    const category = ['Activity', 'Food', 'Stay', 'Sights', 'Transit'].includes(item.category) ? item.category : 'Activity';
    stop.dataset.category = category;
    const badge = document.createElement('span');
    badge.className = 'category-badge';
    badge.textContent = category;
    card.append(badge);
    if (item.place) {
      const place = document.createElement('p');
      place.className = 'stop-place';
      place.textContent = item.place;
      card.append(place);
    }
    const details = document.createElement('p');
    details.className = 'activity-details';
    details.textContent = item.notes || '';
    if (item.notes) card.append(details);
    const controls = document.createElement('div');
    controls.className = 'activity-controls';
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${item.title}`);
    edit.addEventListener('click', () => {
      editingActivity = item.id;
      $('activity').value = item.title;
      $('time').value = item.time;
      $('category').value = category;
      $('place').value = item.place || '';
      $('notes').value = item.notes || '';
      $('estimate').value = item.cost ? item.cost / factor() : '';
      $('add-activity').textContent = 'Save activity';
      $('cancel-edit').hidden = false;
      $('activity').focus();
    });
    const label = document.createElement('label');
    label.textContent = 'Move to day';
    const move = document.createElement('select');
    move.setAttribute('aria-label', `Move ${item.title} to day`);
    move.append(...allDays.map((day) => option(day.key, day.label)));
    move.value = item.day;
    move.addEventListener('change', () => {
      item.day = move.value;
      selectedDay = move.value;
      resetEditor();
      save('Activity moved. Showing its new day.');
      $('day-chips').querySelector('[aria-pressed="true"]').focus();
    });
    label.append(move);
    controls.append(edit, remove, label);
    card.append(controls);
  });
  if (!activities.length) row($('activities'), selectedDay === 'ideas' ? 'No saved ideas yet. Generate a city plan above or add an idea below.' : 'No activities for this day. Add one below or move one here.');
  const total = trip.expenses.reduce((sum, item) => sum + item.amount, 0);
  const planned = trip.activities.filter((item) => item.day !== 'ideas').reduce((sum, item) => sum + (item.cost || 0), 0);
  const budget = trip.budget * (trip.budgetMode === 'person' ? trip.travelers.length : 1);
  $('budget-summary').replaceChildren();
  for (const [label, value] of [['Budget', budget], ['Planned', planned], ['Spent', total], [total > budget ? 'Over budget' : 'Remaining', Math.abs(budget - total)]]) {
    const dt = document.createElement('dt');
    const dd = document.createElement('dd');
    dt.textContent = label;
    dd.textContent = money(value);
    $('budget-summary').append(dt, dd);
  }
  $('spend-meter').value = budget ? Math.min(100, total / budget * 100) : 0;
  $('spend-caption').textContent = `${money(total)} spent of ${money(budget)}. ${trip.budgetMode === 'person' ? `${money(trip.budget)} each × ${trip.travelers.length} travelers. ` : ''}${total > budget ? `${money(total - budget)} over budget.` : `${money(budget - total)} remaining.`} Planned estimates are separate from actual spending.`;
  $('category-totals').replaceChildren();
  for (const category of ['Activity', 'Food', 'Stay', 'Sights', 'Transit']) {
    const spent = trip.expenses.filter((item) => (item.category || 'Activity') === category).reduce((sum, item) => sum + item.amount, 0);
    row($('category-totals'), `${category} · spent ${money(spent)}`);
    const bars = document.createElement('div');
    bars.className = 'category-bars';
    bars.setAttribute('aria-hidden', 'true');
    const bar = document.createElement('span');
    bar.style.width = `${spent / Math.max(total, 1) * 100}%`;
    bars.append(bar);
    $('category-totals').lastElementChild.append(bars);
  }
  $('expenses').replaceChildren();
  trip.expenses.forEach((item) => {
    const dayLabel = days().find((day) => day.key === item.day)?.label || 'Trip-wide';
    row($('expenses'), `${item.title} · ${money(item.amount)} · paid by ${item.payer} · split with ${(item.split || trip.travelers).join(', ')} · ${item.category || 'Activity'} · ${dayLabel}`, () => {
    trip.expenses = trip.expenses.filter((expense) => expense.id !== item.id);
    if (editingExpense === item.id) resetExpense();
    save('Expense removed.');
    $('expense-name').focus();
    });
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.textContent = 'Edit';
    edit.setAttribute('aria-label', `Edit ${item.title}`);
    edit.addEventListener('click', () => {
      editingExpense = item.id;
      $('expense-name').value = item.title;
      $('amount').value = item.amount / factor();
      $('payer').value = item.payer;
      $('expense-category').value = item.category || 'Activity';
      $('expense-day').value = days().some((day) => day.key === item.day) ? item.day : '';
      $('split-picks').querySelectorAll('input').forEach((check) => { check.checked = (item.split || trip.travelers).includes(check.value); });
      $('save-expense').textContent = 'Save expense';
      $('cancel-expense').hidden = false;
      $('expense-name').focus();
    });
    $('expenses').lastElementChild.append(edit);
  });
  if (!trip.expenses.length) row($('expenses'), 'No expenses yet. Add your first shared cost.');
  renderSettlement(total);
  $('invite-label').hidden = true;
  $('settlement-label').hidden = true;
}
function renderSettlement(total) {
  $('balances').replaceChildren();
  $('transfers').replaceChildren();
  if (!trip.travelers.length) {
    row($('balances'), 'Add your travelers to calculate balances.');
    row($('transfers'), 'No travelers or payments recorded.');
    return;
  }
  const balances = trip.travelers.map((name) => {
    const paid = trip.expenses.filter((item) => item.payer === name).reduce((sum, item) => sum + item.amount, 0);
    const share = trip.expenses.reduce((sum, item) => {
      const split = item.split || trip.travelers;
      const position = split.indexOf(name);
      return sum + (position < 0 ? 0 : Math.floor(item.amount / split.length) + (position < item.amount % split.length ? 1 : 0));
    }, 0);
    const balance = paid - share;
    row($('balances'), `${name} · paid ${money(paid)} · share ${money(share)} · ${balance >= 0 ? 'receives' : 'owes'} ${money(Math.abs(balance))}`);
    return { name, balance };
  });
  if (trip.travelers.length === 1) {
    row($('transfers'), `Solo adventure: ${money(total)} spent. No payments to split.`);
    return;
  }
  const creditors = balances.filter((item) => item.balance > 0);
  const debtors = balances.filter((item) => item.balance < 0);
  for (const debtor of debtors) {
    for (const creditor of creditors) {
      const amount = Math.min(-debtor.balance, creditor.balance);
      if (amount <= 0) continue;
      row($('transfers'), `${debtor.name} → ${creditor.name}: ${money(amount)}`);
      debtor.balance += amount;
      creditor.balance -= amount;
    }
  }
  if (!debtors.length) row($('transfers'), total ? 'All square! Everyone has paid their share.' : 'Add expenses to see suggested payments.');
}
document.querySelectorAll('[data-view]').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach((item) => item.removeAttribute('aria-current'));
    button.setAttribute('aria-current', 'page');
    document.querySelectorAll('.view').forEach((view) => { view.hidden = view.id !== button.dataset.view; });
    announce(`${button.textContent.replace(/^\d+ · /, '')} view.`);
  });
});
function saveTripDetails() {
  if (!$('trip-form').reportValidity()) return false;
  const travelers = $('travelers').value.split(',').map((name) => name.trim()).filter(Boolean);
  if (new Set(travelers.map((name) => name.toLowerCase())).size !== travelers.length) {
    announce('Please enter unique traveler names.');
    $('travelers').focus();
    return false;
  }
  if ($('group').value === 'Solo' && travelers.length > 1) {
    announce('For solo travel, enter just one traveler.');
    $('group').focus();
    return false;
  }
  // Keep unchanged names linked to their expenses, and match renamed people
  // to replacement names in list order. Freeze legacy equal splits before adding people.
  const previous = trip.travelers;
  const replacements = travelers.filter((name) => !previous.includes(name));
  const names = new Map();
  for (const name of previous) {
    names.set(name, travelers.includes(name) ? name : replacements.shift());
  }
  const referenced = trip.expenses.some((expense) => !names.get(expense.payer)
    || (expense.split || previous).some((name) => !names.get(name)));
  if (referenced) {
    announce('This traveler has expenses. Replace their name to rename them, or remove their expenses before deleting them.');
    $('travelers').focus();
    return false;
  }
  const payer = names.get($('payer').value);
  const checks = [...$('split-picks').querySelectorAll('input')];
  const draftSplit = checks.filter((check) => check.checked).map((check) => names.get(check.value)).filter(Boolean);
  trip.expenses.forEach((expense) => {
    expense.payer = names.get(expense.payer);
    expense.split = (expense.split || previous).map((name) => names.get(name));
  });
  trip.travelers = travelers;
  const oldFactor = factor();
  trip.group = $('group').value;
  trip.name = $('trip-name').value.trim();
  trip.start = $('start').value;
  if (!trip.expenses.length) {
    if (!$('currency').disabled) trip.currency = $('currency').value;
    trip.budget = Math.round(trip.budget / oldFactor * factor());
  }
  $('budget-input').value = trip.budget ? trip.budget / factor() : '';
  save('Trip details saved. Budget and balances use your actual travelers.');
  if (payer) $('payer').value = payer;
  if (checks.length) $('split-picks').querySelectorAll('input').forEach((check) => { check.checked = draftSplit.includes(check.value); });
  return true;
}
$('trip-form').addEventListener('submit', (event) => {
  event.preventDefault();
  saveTripDetails();
});
for (const field of ['trip-name', 'travelers', 'group', 'start', 'currency']) $(field).addEventListener('change', saveTripDetails);
$('city-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const name = $('city').value.trim();
  if (!name) return announce('Enter a destination city.');
  const duration = Number($('days').value);
  if (!Number.isInteger(duration) || duration < 1 || duration > 30) return announce('Choose between 1 and 30 days.');
  if (!$('start').reportValidity()) return;
  if (!saveTripDetails()) return;
  const city = { id: id(), name, days: duration };
  trip.cities.push(city);
  trip.activities.push(...starterPlan(city));
  selectedDay = `${city.id}:0`;
  resetEditor();
  $('city').value = '';
  document.querySelector('[data-view="itinerary"]').click();
  save(`Created ${duration} days with ${duration * 3} starter activities for ${name}. Edit or move anything to make it yours.`);
  $('day-chips').querySelector('[aria-pressed="true"]').focus();
});
function resetEditor() {
  editingActivity = null;
  $('activity').value = '';
  $('place').value = $('notes').value = '';
  $('estimate').value = '';
  $('category').value = 'Activity';
  $('add-activity').textContent = 'Add activity +';
  $('cancel-edit').hidden = true;
}
$('cancel-edit').addEventListener('click', () => { resetEditor(); $('activity').focus(); });
$('day-select').addEventListener('change', () => { selectedDay = $('day-select').value; resetEditor(); render(); });
$('activity-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = $('activity').value.trim();
  if (!selectedDay || !title) return announce('Choose a day and enter an activity.');
  const existing = trip.activities.find((item) => item.id === editingActivity);
  if (!$('activity-form').reportValidity()) return;
  const details = { time: $('time').value, title, category: $('category').value, place: $('place').value.trim(), notes: $('notes').value.trim(), cost: Math.round(Number($('estimate').value) * factor()) };
  if (existing) Object.assign(existing, details);
  else trip.activities.push({ id: id(), day: selectedDay, ...details });
  resetEditor();
  save(existing ? 'Activity updated.' : 'Activity added.');
});
function saveBudget() {
  if (!$('budget-input').value || !$('budget-input').checkValidity()) return;
  trip.budget = Math.round(Number($('budget-input').value) * factor());
  trip.budgetMode = $('budget-mode').value;
  save('Budget saved. Spending and remaining budget updated.');
}
$('budget-input').addEventListener('input', saveBudget);
$('budget-mode').addEventListener('change', saveBudget);
$('budget-form').addEventListener('submit', (event) => {
  event.preventDefault();
  if ($('budget-form').reportValidity()) saveBudget();
});
function resetExpense() {
  editingExpense = null;
  $('expense-name').value = $('amount').value = '';
  $('save-expense').textContent = 'Add expense +';
  $('cancel-expense').hidden = true;
  $('split-picks').querySelectorAll('input').forEach((check) => { check.checked = true; });
}
$('cancel-expense').addEventListener('click', () => { resetExpense(); $('expense-name').focus(); });
$('expense-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const title = $('expense-name').value.trim();
  const amount = Math.round(Number($('amount').value) * factor());
  if (!$('expense-form').reportValidity() || !title || !Number.isSafeInteger(amount) || amount <= 0) return announce('Enter an expense name and a positive amount.');
  if (!trip.travelers.includes($('payer').value)) return announce('Add your travelers and choose who paid.');
  const split = [...$('split-picks').querySelectorAll('input:checked')].map((check) => check.value);
  if (!split.length) {
    $('expense-help').textContent = 'Choose at least one traveler to split this expense.';
    $('split-picks').querySelector('input')?.focus();
    return announce('Choose at least one traveler to split this expense.');
  }
  const details = { title, amount, payer: $('payer').value, split, category: $('expense-category').value, day: $('expense-day').value };
  const existing = trip.expenses.find((item) => item.id === editingExpense);
  if (existing) Object.assign(existing, details);
  else trip.expenses.push({ id: id(), ...details });
  resetExpense();
  save(existing ? 'Expense updated. Spending, remaining budget, and balances recalculated.' : 'Expense added. Spending, remaining budget, and balances recalculated.');
});
$('invite').addEventListener('click', async () => {
  const route = trip.cities.map((city) => `${city.name} (${city.days} days)`).join(' → ') || 'Destination to be decided';
  const text = `Let’s GoGogo! ${trip.name || ''}\n${route}\nFrom: ${trip.start}\nTravelers: ${trip.travelers.join(', ')} (${trip.group})\nCurrency: ${trip.currency}\nJoin us! Reply to the sender to coordinate.\nThis is a summary, not a live collaboration link.`;
  $('invite-text').value = text;
  $('invite-label').hidden = false;
  try {
    await navigator.clipboard.writeText(text);
    announce('Invitation copied. Paste it into a message.');
  } catch {
    $('invite-text').focus();
    $('invite-text').select();
    announce('Select and copy the invitation text to share it.');
  }
});
$('copy-settlement').addEventListener('click', async () => {
  const payments = [...$('transfers').children].map((item) => item.textContent).join('\n');
  const text = `${trip.name || 'GoGogo'} · Settlement (${trip.currency})\n${payments}`;
  $('settlement-text').value = text;
  $('settlement-label').hidden = false;
  try {
    await navigator.clipboard.writeText(text);
    announce('Settlement summary copied.');
  } catch {
    $('settlement-text').focus();
    $('settlement-text').select();
    announce('Select and copy the settlement summary.');
  }
});
// Hydrate once. Subsequent renders leave unsaved form entries intact.
$('trip-name').value = trip.name || '';
for (const field of ['group', 'start', 'currency']) $(field).value = trip[field];
$('travelers').value = trip.travelers.join(', ');
$('budget-input').value = trip.budget ? trip.budget / factor() : '';
$('budget-mode').value = trip.budgetMode || 'total';
render();
