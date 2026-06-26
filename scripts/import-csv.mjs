import { readFileSync, writeFileSync } from 'fs'

const CSV_PATH = '/root/.claude/uploads/12c53f04-b133-5b4a-9b8a-6b2b4c72b118/a7a83651-cal_complete_health_log_upload_20260626.csv'
const OUT_PATH = './src/data/seed.json'

function splitCSVLine(line) {
  const out = []
  let cur = ''
  let inQuote = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++ } else { inQuote = !inQuote }
    } else if (c === ',' && !inQuote) {
      out.push(cur); cur = ''
    } else { cur += c }
  }
  out.push(cur)
  return out
}

function parseCSV(text) {
  const lines = []
  let current = ''
  let inQuote = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (c === '"') { inQuote = !inQuote; current += c }
    else if (c === '\n' && !inQuote) { lines.push(current); current = '' }
    else { current += c }
  }
  if (current) lines.push(current)
  const headers = splitCSVLine(lines[0]).map(h => h.trim())
  const rows = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const values = splitCSVLine(line)
    const row = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] || '').trim() })
    rows.push(row)
  }
  return rows
}

function matchFood(item, qtyStr, unit, notes) {
  const lower = item.toLowerCase()
  const qty = parseFloat(qtyStr) || 1
  const unitLower = (unit || '').toLowerCase()
  const notesLower = (notes || '').toLowerCase()

  if (/banana/.test(lower)) {
    const factor = /large/.test(unitLower) ? 1.2 : 1
    return { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0, quantity: qty * factor }
  }
  if (/honey/.test(lower) && !/yogurt/.test(lower)) {
    let multiplier = qty
    if (unitLower === 'g') multiplier = qty / 20
    else if (unitLower === 'tbsp') multiplier = qty
    else if (/mouthful/.test(unitLower) || /mouthful|small amount/.test(notesLower)) multiplier = 0.5
    else if (!unitLower || unitLower === 'each') multiplier = 1
    return { name: 'Honey', calories: 65, protein: 0, carbs: 17, fat: 0, quantity: multiplier }
  }
  if (/lcm/.test(lower)) return { name: 'LCM bar', calories: 90, protein: 0, carbs: 18, fat: 2, quantity: qty }
  if (/yopro|yoplait pro|protein yogurt/.test(lower) && !/cluster/.test(lower))
    return { name: 'YoPro Yogurt', calories: 140, protein: 20, carbs: 10, fat: 1, quantity: qty }
  if (/cluster|granola/.test(lower)) {
    const grams = unitLower === 'g' ? qty : 70
    const factor = grams / 70
    return { name: 'Protein Clusters', calories: 315 * factor, protein: 14 * factor, carbs: 42 * factor, fat: 10 * factor, quantity: 1 }
  }
  if (/lean mince|mince/.test(lower)) {
    const grams = unitLower === 'g' ? qty : 250
    const factor = grams / 250
    return { name: '5% Lean Mince', calories: 350 * factor, protein: 55 * factor, carbs: 0, fat: 13 * factor, quantity: 1 }
  }
  if (/basmati rice|jasmine rice|cooked rice|rice(?!.*cake)/.test(lower)) {
    const grams = unitLower === 'g' ? qty : 125
    const factor = grams / 125
    return { name: 'Cooked Rice', calories: 165 * factor, protein: 3 * factor, carbs: 36 * factor, fat: 0, quantity: 1 }
  }
  if (/avocado/.test(lower)) return { name: 'Avocado', calories: 320, protein: 4, carbs: 16, fat: 28, quantity: qty }
  if (/bagel/.test(lower)) return { name: 'Bagel', calories: 250, protein: 9, carbs: 49, fat: 2, quantity: qty }
  if (/evolve reload|reload recovery|recovery matrix/.test(lower))
    return { name: 'Evolve Reload', calories: 474, protein: 47, carbs: 68, fat: 1.5, quantity: qty }
  if (/my muscle chef|mmc|marry me chicken|vodka penne/.test(lower))
    return { name: 'MMC Meal', calories: 450, protein: 42, carbs: 35, fat: 14, quantity: qty }
  if (/small cappuccino|cappuccino|coffee/.test(lower) && !/medium|large/.test(lower))
    return { name: 'Small Cappuccino', calories: 90, protein: 5, carbs: 8, fat: 4, quantity: qty }
  if (/medium cappuccino/.test(lower))
    return { name: 'Medium Cappuccino', calories: 130, protein: 7, carbs: 11, fat: 6, quantity: qty }
  if (/protein shake|whey/.test(lower) && !/recovery|reload/.test(lower)) {
    const scoops = /scoop/.test(unitLower) ? qty : 1
    return { name: 'Protein Shake', calories: 120 * scoops, protein: 25 * scoops, carbs: 3 * scoops, fat: 1 * scoops, quantity: 1 }
  }
  if (/protein pasta/.test(lower)) {
    const grams = unitLower === 'g' ? qty : 60
    const factor = grams / 60
    return { name: 'Protein Pasta', calories: 215 * factor, protein: 20 * factor, carbs: 30 * factor, fat: 2 * factor, quantity: 1 }
  }
  if (/spaghetti|pasta/.test(lower) && !/protein/.test(lower))
    return { name: 'Spaghetti meal', calories: 600, protein: 25, carbs: 80, fat: 18, quantity: qty }
  if (/sushi/.test(lower) && /bowl/.test(lower))
    return { name: 'Teriyaki Chicken Sushi Bowl', calories: 650, protein: 45, carbs: 85, fat: 12, quantity: qty }
  if (/sushi/.test(lower))
    return { name: 'Sushi (4 plates est)', calories: 725, protein: 28, carbs: 95, fat: 18, quantity: qty }
  if (/teriyaki.*chicken|chicken.*rice bowl/.test(lower))
    return { name: 'Teriyaki Chicken Bowl', calories: 650, protein: 45, carbs: 85, fat: 12, quantity: qty }
  if (/grill'd|grilld|simon says|grilld burger|chicken burger/.test(lower))
    return { name: "Grill'd Burger", calories: 590, protein: 39, carbs: 45, fat: 26, quantity: qty }
  if (/breakfast burger/.test(lower))
    return { name: 'Breakfast Burger', calories: 650, protein: 30, carbs: 50, fat: 35, quantity: qty }
  if (/caesar wrap|wrap/.test(lower) && !/burrito/.test(lower))
    return { name: 'Caesar Wrap', calories: 450, protein: 25, carbs: 40, fat: 22, quantity: qty }
  if (/burrito bowl|guzman/.test(lower)) {
    if (/chip/.test(lower)) return { name: 'GYG Small Chips', calories: 300, protein: 4, carbs: 35, fat: 16, quantity: qty }
    return { name: 'GYG Burrito Bowl', calories: 650, protein: 40, carbs: 70, fat: 22, quantity: qty }
  }
  if (/small chips|chips/.test(lower)) return { name: 'Small Chips', calories: 300, protein: 4, carbs: 35, fat: 16, quantity: qty }
  if (/garlic bread/.test(lower)) return { name: 'Garlic Bread', calories: 280, protein: 6, carbs: 32, fat: 14, quantity: qty }
  if (/donut|long john/.test(lower)) return { name: 'Donut', calories: 300, protein: 4, carbs: 38, fat: 15, quantity: qty }
  if (/ice cream/.test(lower)) return { name: 'Ice Cream', calories: 250, protein: 4, carbs: 28, fat: 14, quantity: qty }
  if (/chocolate croissant|croissant/.test(lower)) return { name: 'Chocolate Croissant', calories: 280, protein: 5, carbs: 32, fat: 15, quantity: qty }
  if (/mint slice|wagon wheel|biscuit/.test(lower) && !/digestive/.test(lower))
    return { name: 'Sweet Biscuit', calories: 70, protein: 1, carbs: 10, fat: 3, quantity: qty }
  if (/digestive/.test(lower)) return { name: 'Digestive Biscuit', calories: 70, protein: 1, carbs: 10, fat: 3, quantity: qty }
  if (/oat bar/.test(lower)) return { name: 'Oat Bar', calories: 200, protein: 4, carbs: 30, fat: 7, quantity: qty }
  if (/maximus|sports drink|gatorade/.test(lower)) return { name: 'Sports Drink', calories: 200, protein: 0, carbs: 50, fat: 0, quantity: qty }
  if (/mango solo|energy drink|solo/.test(lower)) return { name: 'Energy Drink', calories: 140, protein: 0, carbs: 35, fat: 0, quantity: qty }
  if (/chicken roll/.test(lower)) return { name: 'Chicken Roll', calories: 350, protein: 18, carbs: 30, fat: 16, quantity: qty }
  if (/ham.*cheese|toasted sourdough|toastie/.test(lower)) return { name: 'Ham Cheese Toastie', calories: 450, protein: 22, carbs: 38, fat: 22, quantity: qty }
  if (/curry/.test(lower)) return { name: 'Curry meal', calories: 700, protein: 30, carbs: 70, fat: 30, quantity: qty }
  if (/chinese/.test(lower)) return { name: 'Chinese meal', calories: 700, protein: 30, carbs: 85, fat: 25, quantity: qty }
  if (/tinned tomato|tomato/.test(lower)) return { name: 'Tinned Tomatoes', calories: 80, protein: 4, carbs: 16, fat: 0, quantity: qty }
  if (/carrot/.test(lower)) return { name: 'Carrot', calories: 30, protein: 1, carbs: 7, fat: 0, quantity: qty }
  if (/rokeby/.test(lower)) return { name: 'Rokeby + YoPro 25g', calories: 220, protein: 25, carbs: 18, fat: 4, quantity: qty }
  if (/steamed chicken/.test(lower)) return { name: 'Steamed Chicken Bowl', calories: 600, protein: 45, carbs: 70, fat: 12, quantity: qty }
  return null
}

const SKIP_RECORD_TYPES = ['planned', 'considered', 'optional/considered', 'not eaten', 'not recorded', 'considered only', 'alternative considered']
function shouldImportFood(row) {
  const rt = (row.record_type || '').toLowerCase()
  if (!rt) return false
  if (SKIP_RECORD_TYPES.some(s => rt === s || rt.includes(s))) return false
  return rt.includes('eaten') || rt.includes('reported') || rt.includes('planned/likely') || rt.includes('available/planned')
}
function shouldImportWeight(row) {
  return (row.measurement_time || '').toLowerCase().includes('morning')
}
function inferActivity(timing) {
  const t = (timing || '').toLowerCase()
  if (t.includes('motocross') || t.includes('riding')) return 'motocross'
  return null
}
function inferTraining(timing) {
  const t = (timing || '').toLowerCase()
  if (t.includes('pre-gym') || t.includes('post-gym')) return 'upper'
  return null
}

const text = readFileSync(CSV_PATH, 'utf8')
const rows = parseCSV(text)

const days = {}
const weights = []
const unmatched = new Set()
let foodCount = 0
let weightCount = 0

function getOrCreate(date) {
  if (!days[date]) {
    days[date] = {
      date,
      entries: [],
      training: null,
      activity: [],
      weight: null,
      feeling: null,
      notes: '',
    }
  }
  return days[date]
}

let entryIdx = 0
for (const row of rows) {
  if (row.log_type === 'weight') {
    const w = parseFloat(row.weight_kg)
    if (!isNaN(w) && shouldImportWeight(row)) {
      weights.push({ date: row.date, weight: w })
      getOrCreate(row.date).weight = w
      weightCount++
    }
  } else if (row.log_type === 'food') {
    if (!shouldImportFood(row)) continue
    const matched = matchFood(row.food_item, row.quantity, row.unit, row.notes)
    if (!matched) { unmatched.add(row.food_item); continue }
    const day = getOrCreate(row.date)
    day.entries.push({
      id: `seed-${row.date}-${entryIdx++}`,
      foodId: `imported-${row.date}-${day.entries.length}`,
      name: matched.name,
      calories: matched.calories,
      protein: matched.protein,
      carbs: matched.carbs,
      fat: matched.fat,
      quantity: matched.quantity,
      timestamp: new Date(row.date + 'T12:00:00').getTime(),
    })
    foodCount++
    if (!day.training) {
      const tr = inferTraining(row.timing)
      if (tr) day.training = tr
    }
    const act = inferActivity(row.timing)
    if (act && !day.activity.includes(act)) day.activity.push(act)
  }
}

const seed = {
  version: 2,
  days,
  weights: weights.sort((a, b) => a.date.localeCompare(b.date)),
}

writeFileSync(OUT_PATH, JSON.stringify(seed, null, 2))
console.log(`Wrote ${OUT_PATH}`)
console.log(`Days: ${Object.keys(days).length}, Foods: ${foodCount}, Weights: ${weightCount}`)
if (unmatched.size > 0) console.log(`Unmatched: ${[...unmatched].join(', ')}`)
