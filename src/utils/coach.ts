import type { DayLog, Phase, MacroTotals } from '../types'
import { calculateTotals, getTargets, getRemaining, macroStatus } from './calculator'
import { FOOD_DATABASE } from '../data/foods'

function fmt(n: number): string {
  return Math.round(n).toString()
}

export function generateDayReview(day: DayLog, phase: Phase): string {
  const totals = calculateTotals(day.entries)
  const targets = getTargets(phase)
  const remaining = getRemaining(totals, targets)
  const lines: string[] = []

  if (day.entries.length === 0) {
    lines.push("No food logged yet today. Chuck something in and I'll track it for you.")
    return lines.join('\n\n')
  }

  lines.push(`**Today's totals:**\n${fmt(totals.calories)} cal | ${fmt(totals.protein)}P | ${fmt(totals.carbs)}C | ${fmt(totals.fat)}F`)

  const target = phase === 'lean-bulk' ? '2,650–2,800' : '2,400–2,500'
  lines.push(`**Target (${phase === 'lean-bulk' ? 'lean bulk' : 'maintenance'}):** ${target} cal`)

  const calStatus = macroStatus(totals.calories, targets.calories)
  const proteinStatus = macroStatus(totals.protein, targets.protein)
  const carbStatus = macroStatus(totals.carbs, targets.carbs)

  if (calStatus === 'on-track' && proteinStatus !== 'low') {
    lines.push("Day looks solid. You're right in the zone. Close enough — don't overthink it.")
  } else if (calStatus === 'low') {
    lines.push(`You're sitting about ${fmt(Math.abs(remaining.calories))} cal under target.`)
    if (remaining.calories > 400) {
      lines.push("That's a fair gap — you'll want to get some more food in tonight.")
    } else if (remaining.calories > 150) {
      lines.push("Not a huge gap but worth closing, especially on a training day.")
    }
  } else if (calStatus === 'high' || calStatus === 'over') {
    const over = totals.calories - targets.calories.max
    if (over < 150) {
      lines.push("Slightly over target but honestly that's close enough. Don't stress it.")
    } else {
      lines.push(`You're about ${fmt(over)} cal over target. Not the end of the world — just keep tomorrow tighter.`)
    }
  }

  if (proteinStatus === 'low' && totals.protein < 160) {
    lines.push(`Protein is a bit low at ${fmt(totals.protein)}g. Try to get another serve in.`)
  } else if (totals.protein >= 180) {
    lines.push(`Protein is solid at ${fmt(totals.protein)}g.`)
  }

  if (carbStatus === 'low' && day.training && day.training !== 'rest') {
    lines.push(`Carbs are low at ${fmt(totals.carbs)}g for a training day. You might feel flat tomorrow — consider some extra rice, a banana, or a bagel tonight.`)
  }

  if (day.activity.includes('walk') && phase === 'lean-bulk') {
    lines.push("The walk burns extra on top of your surplus. If you haven't already, add 30–60g carbs (banana + rice cakes, or a bagel) to keep the surplus real.")
  }

  if (day.activity.includes('motocross')) {
    lines.push("Motocross chews through a heap of energy. Make sure you've added an extra 300–600 cal today, mostly carbs. Rice, banana, honey, cereal — whatever's easy.")
  }

  if (day.feeling === 'flat') {
    lines.push("Feeling flat usually means glycogen is low, not that you need more protein. Extra carbs, some sodium, and good hydration will fill you out. Try an extra serve of rice or a bagel with honey tonight.")
  }

  if (day.feeling === 'puffy') {
    lines.push("Feeling puffy is almost always sodium/water swings, not fat gain overnight. Don't slash food — keep calories consistent, drink your water, and judge it over several mornings by weight and how your waist looks.")
  }

  if (remaining.calories > 200 && calStatus === 'low') {
    lines.push(getSuggestions(remaining, totals))
  }

  return lines.join('\n\n')
}

function getSuggestions(remaining: MacroTotals, totals: MacroTotals): string {
  const suggestions: string[] = []
  const needProtein = totals.protein < 170
  const needCarbs = remaining.carbs > 30
  const fatHigh = totals.fat > 65

  if (remaining.calories > 500) {
    if (needProtein) {
      suggestions.push('Lean mince (250g) + rice (175g) — ~580 cal, 59P, 50C')
      suggestions.push('My Muscle Chef meal — ~450 cal, 42P')
    } else {
      suggestions.push('Bagel + banana + honey — ~420 cal, 93C')
      suggestions.push('Teriyaki chicken rice bowl — ~650 cal, 45P, 85C')
    }
  } else if (remaining.calories > 250) {
    if (needProtein && !fatHigh) {
      suggestions.push('YoPro + protein clusters — ~455 cal, 34P, 52C')
    }
    if (needCarbs) {
      suggestions.push('Bagel + banana — ~355 cal, 76C')
      suggestions.push('Rice (175g) + veg — ~280 cal, 50C')
    }
  } else if (remaining.calories > 100) {
    if (needCarbs) {
      suggestions.push('Banana — 105 cal, 27C')
      suggestions.push('LCM bar — 90 cal, 18C')
      suggestions.push('Rice cakes (2) + honey — 135 cal, 32C')
    } else {
      suggestions.push('YoPro — 140 cal, 20P')
    }
  }

  if (suggestions.length === 0) return ''
  const header = '**Quick options to close the gap:**'
  return header + '\n' + suggestions.slice(0, 3).map(s => `• ${s}`).join('\n')
}

export function answerCoachQuestion(question: string, day: DayLog, phase: Phase): string {
  const q = question.toLowerCase()
  const totals = calculateTotals(day.entries)
  const targets = getTargets(phase)

  if (q.includes('review today') || q.includes('review the day') || q.includes('how did i go') || q.includes("how'd i go") || q.includes('how was today')) {
    return generateDayReview(day, phase)
  }

  if (q.includes('what should i eat') || q.includes('what can i eat') || q.includes('what to eat')) {
    const remaining = getRemaining(totals, targets)
    if (remaining.calories <= 100) {
      return "You're basically at target. If you're hungry, a YoPro or some veg won't hurt. Otherwise you're done for the day — nice work."
    }
    return getSuggestions(remaining, totals) || "You're close to target. A banana or YoPro would round it out."
  }

  if (q.includes('carbs') && (q.includes('waist') || q.includes('fat') || q.includes('gain'))) {
    return "In a small surplus with hard training, carbs mainly refill glycogen and support performance. Fat gain is driven by a *sustained* excessive surplus, not one carb meal. If you're in a controlled lean bulk, the carbs are doing their job — filling you out, fuelling your sessions, and keeping you looking full rather than flat. Don't stress about one bigger carb day."
  }

  if (q.includes('flat') || q.includes('feel flat') || q.includes('looking flat')) {
    return "Feeling flat is a glycogen thing, not a protein thing. Your fix is: extra carbs (rice, bagel, banana), a bit of sodium (soy sauce on rice, or just salt your food more), and good hydration. A high-carb dinner tonight will have you looking fuller by morning. Don't add more protein if it's already above 180g — put those calories into carbs instead."
  }

  if (q.includes('puffy') || q.includes('bloated') || q.includes('water retention')) {
    return "Puffiness is almost always sodium and water swings. It's not fat gain from yesterday's food. Don't slash calories — keep them consistent, drink your water steadily through the day, and judge your physique over 3–5 mornings, not one day. Check your waist measurement and morning photos rather than just going by feel."
  }

  if (q.includes('protein') && (q.includes('too much') || q.includes('enough') || q.includes('how much'))) {
    const proteinPerKg = totals.protein / 78
    if (totals.protein >= 180) {
      return `You're at ${fmt(totals.protein)}g protein (~${proteinPerKg.toFixed(1)}g/kg). That's plenty. Anything above ~2.2g/kg isn't doing much extra for your goals. If you've got more calories to fill, put them into carbs for performance and fullness rather than forcing more protein.`
    }
    return `You're at ${fmt(totals.protein)}g protein. Aim for 180–210g. Try to get another protein source in — a YoPro, protein shake, or some lean mince would sort it out.`
  }

  if (q.includes('walk') && (q.includes('surplus') || q.includes('burn') || q.includes('extra'))) {
    return "A solid afternoon walk can burn 150–250 cal depending on length and pace. During a lean bulk, that eats into your surplus. If you walked today, adding a banana + some rice or a bagel (~200 cal of carbs) keeps your surplus intact without going overboard."
  }

  if (q.includes('motocross') || q.includes('moto')) {
    return "Motocross is a massive energy output — easily 300–600+ cal depending on how long and hard you rode. Treat it like a heavy lower body day plus cardio. Bias the extra food toward carbs: rice, bagel, banana, honey, cereal. Your protein is probably already fine from regular meals."
  }

  if (q.includes('cheat') || q.includes('blew it') || q.includes('went over') || q.includes('bad day')) {
    return "One day over doesn't do anything to your physique. Don't try to 'make up for it' by slashing tomorrow. Just get back to your normal targets. Fat gain comes from weeks of sustained surplus, not one big day. Drink your water, hit your protein, train hard, move on."
  }

  if (q.includes('europe') || q.includes('trip') || q.includes('september')) {
    return "You've got plenty of time until September. The play is: lean bulk now to fill out and build, then dial it back to maintenance or a gentle cut 4–6 weeks before the trip. Don't rush it. Consistent training + controlled surplus now = looking full and jacked by September, not flat from aggressive dieting."
  }

  if (q.includes('weight') && (q.includes('going up') || q.includes('gaining') || q.includes('gained'))) {
    return "In a lean bulk, you want to see 0.2–0.4kg per week on average. Daily fluctuations of up to 1kg are totally normal from water, sodium, food volume, and timing. Judge the trend over 7–14 days, not day to day. If you're gaining faster than ~0.5kg/week consistently, we'd pull back 100–200 cal. Otherwise you're doing exactly what you should be."
  }

  if (q.includes('how many cal') || q.includes('how many calories') || q.includes('target')) {
    const label = phase === 'lean-bulk' ? 'lean bulk' : 'maintenance'
    return `Your current ${label} target is ${targets.calories.min}–${targets.calories.max} cal.\nProtein: ${targets.protein.min}–${targets.protein.max}g\nCarbs: ${targets.carbs.min}–${targets.carbs.max}g\nFat: ${targets.fat.min}–${targets.fat.max}g`
  }

  if (q.includes('remaining') || q.includes('left') || q.includes('how much more')) {
    const remaining = getRemaining(totals, targets)
    if (remaining.calories <= 0) {
      return `You've hit your target. Sitting at ${fmt(totals.calories)} cal. You're done unless you're genuinely hungry.`
    }
    return `You've got about ${fmt(remaining.calories)} cal left today.\nRemaining: ~${fmt(Math.max(0, remaining.protein))}P | ~${fmt(Math.max(0, remaining.carbs))}C | ~${fmt(Math.max(0, remaining.fat))}F`
  }

  const totalsStr = day.entries.length > 0
    ? `\n\nYour current totals: ${fmt(totals.calories)} cal | ${fmt(totals.protein)}P | ${fmt(totals.carbs)}C | ${fmt(totals.fat)}F`
    : ''

  return `Not sure I follow that one mate. Try asking me things like:\n• "Review today"\n• "What should I eat?"\n• "How much do I have left?"\n• "Will extra carbs make me fat?"\n• "I feel flat"\n• "What are my targets?"${totalsStr}`
}

export function parseFoodFromText(text: string): { foodId: string; quantity: number } | null {
  const lower = text.toLowerCase()
  for (const food of FOOD_DATABASE) {
    const nameLower = food.name.toLowerCase()
    const idParts = food.id.split('-')
    if (
      lower.includes(nameLower) ||
      lower.includes(food.id) ||
      idParts.every(part => lower.includes(part))
    ) {
      const quantityMatch = text.match(/(\d+)\s*x/i) || text.match(/x\s*(\d+)/i)
      const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1
      return { foodId: food.id, quantity }
    }
  }
  return null
}
