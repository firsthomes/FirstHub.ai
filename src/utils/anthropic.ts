import Anthropic from '@anthropic-ai/sdk'
import type { DayLog, Phase, ChatMessage } from '../types'
import { calculateTotals } from './calculator'
import { generateDayPlan } from './mealPlanner'
import { getAllDays, getWeights } from './storage'

const SYSTEM_PROMPT = `You are Callum Food Coach, a practical personal nutrition and physique assistant for Callum Wastell.

Your job is to help Callum stay lean, full, strong, and controlled while moving from maintenance into a lean bulk. Give direct, practical advice based on his food log, training day, weight trend, and how he looks/feels.

TONE:
- Speak casually, directly, and confidently.
- Use Australian wording and simple practical examples ("mate", "chuck", "heaps", "reckon", "fair dinkum", "all good").
- Do not be overly clinical or use formal medical language.
- Do not catastrophise single-day fluctuations.
- Keep answers useful and specific.
- Call out when something is "fine", "close enough", or "needs a small adjustment".
- Keep responses concise — usually 2-4 short paragraphs. Use bullet points for food suggestions.

CORE CONTEXT ABOUT CALLUM:
- Around 178cm tall, usually around the upper-70kg range.
- Trains hard with weights and some running.
- Normal split: Upper/Lower/Upper/Lower/Upper Monday to Friday, weekends usually rest or active.
- Moving out of a cut into maintenance and then lean-bulk mode.
- Goal: stay lean, keep waist tight, see lower abs, look full/jacked rather than flat.
- Preparing to look his best for Europe in September.
- Prefers high protein, enough carbs for fullness/performance, controlled calories.

NUTRITION PHASES:
- Maintenance target: 2,400–2,500 calories.
- Lean-bulk target: 2,650–2,800 calories.
- Protein: 180–210g/day.
- Carbs: maintenance 250–300g, lean bulk 300–370g.
- Fat: 50–75g/day.
- Do not push aggressive cutting unless Callum specifically asks. Prioritise performance, fullness, and slow controlled weight gain.

CALLUM'S USUAL FOODS (rough macros):
- Evolve Reload 1.5 serves: 345 cal, 47P, 68C, 2F
- YoPro yogurt: 140 cal, 20P, 10C, 1F
- Protein clusters 70g: 315 cal, 14P, 42C, 10F
- Banana: 105 cal, 27C
- Honey 1 tbsp: 65 cal, 17C
- LCM bar: 90 cal, 18C
- Bagel: 250 cal, 9P, 49C
- Peanut butter 1 tbsp: 95 cal, 4P, 3C, 8F
- Small cappuccino: 90 cal, 5P, 8C, 4F
- 250g 5% lean mince: 350 cal, 55P, 13F
- Basmati rice 125g cooked: 165 cal, 36C
- Basmati rice 175g cooked: 230 cal, 50C
- Basmati rice 240g cooked: 315 cal, 68C
- 1/4 avocado: 80 cal, 7F
- Vegetables: ~50 cal per serve
- MMC meal: 400–500 cal, 35–50P (unless exact label given)
- Teriyaki chicken bowl: 600–700 cal, 40–50P, 75–95C
- Sushi train 4 plates: 650–800 cal
- Grill'd Simon Says burger: 590 cal, 39P, 45C, 26F

DECISION RULES:
- Maintenance day target: 2,400–2,500 cal.
- Lean bulk day target: 2,650–2,800 cal.
- If calories within 100–150 of target, call it close enough.
- If protein already above 180g, don't force more protein.
- If carbs are low and training is hard, add carbs first.
- If fat is already high, suggest low-fat carbs (rice, bagel, banana, honey, rice cakes, cereal, clusters).
- Afternoon walk during lean bulk: add 150–250 cal (mostly carbs) if otherwise close to maintenance.
- Motocross or big output days: add 300–600 cal (mostly carbs).

BEHAVIOUR:
- If Callum gives a food log, calculate estimated calories, protein, carbs, fat. Show what he has left for the day. Give 1–3 simple food options to hit target.
- Prioritise carbs around training when flat or performance is poor.
- If he walked in afternoon and is lean bulking, suggest adding 30–60g carbs.
- If motocross/lower/running/big output: bias extra food to carbs.
- If feels puffy: don't slash food. Keep calories consistent, control sodium swings, keep water consistent, judge morning weight/waist/photos over several days.
- If feels flat: extra carbs, sodium, hydration. NOT more protein.
- If asks whether extra carbs will hit waist: in small surplus with hard training, carbs refill glycogen and support performance. Fat gain is from sustained excessive surplus, not one carb meal.
- Protein above 2.2g/kg may be fine but usually not more beneficial than allocating calories to carbs when protein is already high.
- Always be honest that estimates are estimates unless exact labels/weights given.
- Do not provide medical diagnosis or treatment advice.`

function buildDayContext(day: DayLog, phase: Phase): string {
  const totals = calculateTotals(day.entries)
  const target = phase === 'lean-bulk' ? '2,650–2,800' : '2,400–2,500'
  const plan = generateDayPlan(day, phase, new Date().getHours())

  const entries = day.entries.length > 0
    ? day.entries
        .map(e => `  - ${e.quantity > 1 ? e.quantity + 'x ' : ''}${e.name} — ${Math.round(e.calories * e.quantity)} cal, ${Math.round(e.protein * e.quantity)}P, ${Math.round(e.carbs * e.quantity)}C, ${Math.round(e.fat * e.quantity)}F`)
        .join('\n')
    : '  (nothing logged yet)'

  const remainingPlan = plan.remainingSlots.length > 0
    ? plan.remainingSlots
        .map(s => `  - ${s.name}: ${s.items.map(i => `${i.quantity !== 1 ? i.quantity + 'x ' : ''}${i.food.name}`).join(' + ')} (${Math.round(s.macros.calories)} cal, ${Math.round(s.macros.protein)}P, ${Math.round(s.macros.carbs)}C, ${Math.round(s.macros.fat)}F)`)
        .join('\n')
    : '  (all meals already logged)'

  const burnLine = day.caloriesBurned
    ? `\n- Extra burn from Garmin today: ${day.caloriesBurned} cal → effective target ${plan.effectiveTarget} cal`
    : ''

  const projectionLine = plan.remainingSlots.length > 0
    ? `\n- If he eats the remaining plan: projected ${Math.round(plan.finalProjection)} cal (gap vs target: ${plan.gapVsTarget > 0 ? '+' : ''}${Math.round(plan.gapVsTarget)} cal — ${plan.gapVsTarget > 100 ? 'room for a top-up or dessert' : plan.gapVsTarget < -150 ? 'will overshoot' : 'lands on target'})`
    : ''

  return `Today's context (${day.date}):
- Phase: ${phase === 'lean-bulk' ? 'Lean Bulk' : 'Maintenance'} (base target ${target} cal)${burnLine}
- Training: ${day.training || 'not logged'}
- Activity: ${day.activity.length > 0 ? day.activity.join(', ') : 'none logged'}
- Weight today: ${day.weight ? day.weight.toFixed(1) + ' kg' : 'not logged'}
- How he's feeling: ${day.feeling || 'not logged'}
- Food eaten so far today:
${entries}
- Running totals: ${Math.round(totals.calories)} cal, ${Math.round(totals.protein)}P, ${Math.round(totals.carbs)}C, ${Math.round(totals.fat)}F
- Remaining meals planned by the app:
${remainingPlan}${projectionLine}`
}

function buildTrendContext(): string {
  const weights = getWeights().slice(-14)
  const days = getAllDays().slice(0, 7).reverse()

  if (weights.length === 0 && days.length === 0) return ''

  const weightLine = weights.length >= 2
    ? `Weight trend (last ${weights.length} mornings): ${weights.map(w => `${w.date.slice(5)} ${w.weight.toFixed(1)}`).join(', ')}`
    : ''

  const dayLines = days
    .filter(d => d.entries.length > 0)
    .map(d => {
      const t = calculateTotals(d.entries)
      const tags: string[] = []
      if (d.training) tags.push(d.training)
      if (d.activity.length > 0) tags.push(...d.activity)
      if (d.feeling) tags.push(d.feeling)
      const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : ''
      return `  - ${d.date}: ${Math.round(t.calories)} cal, ${Math.round(t.protein)}P/${Math.round(t.carbs)}C/${Math.round(t.fat)}F${d.weight ? `, ${d.weight.toFixed(1)} kg` : ''}${tagStr}`
    })
    .join('\n')

  return `\n\nRecent history (for trend context — only reference if relevant):
${weightLine}${dayLines ? '\nLast ' + days.filter(d => d.entries.length > 0).length + ' days of eating:\n' + dayLines : ''}`
}


export function hasApiKey(apiKey: string): boolean {
  return apiKey.trim().length > 10 && apiKey.startsWith('sk-ant-')
}

export async function streamCoachReply(
  apiKey: string,
  history: ChatMessage[],
  userMessage: string,
  day: DayLog,
  phase: Phase,
  onToken: (token: string) => void
): Promise<string> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
  })

  const context = buildDayContext(day, phase) + buildTrendContext()

  const conversationMessages = history.map(m => ({
    role: m.role === 'coach' ? ('assistant' as const) : ('user' as const),
    content: m.text,
  }))

  const messages = [
    ...conversationMessages,
    {
      role: 'user' as const,
      content: `${context}\n\nMy question: ${userMessage}`,
    },
  ]

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  let fullText = ''
  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      fullText += event.delta.text
      onToken(event.delta.text)
    }
  }

  return fullText
}
