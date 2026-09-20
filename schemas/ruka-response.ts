// Production contract for Ruka answers (Zod). The LLM only ever returns an object of this shape
// (via structured outputs); the UI renders it with fixed components. NOT compiled in the prototype environment;
// the same rules are enforced there by validateResponse() in src/engine/engine.js.
import { z } from 'zod';

const iso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const Tone = z.enum(['info', 'satisfied', 'action', 'problem', 'accommodation', 'unknown']);
export const Confidence = z.enum(['verified', 'summary', 'multiple', 'more_info', 'unclear', 'none']);
export const Basis = z.enum(['read', 'summary', 'title']);

export const Source = z.object({
  title: z.string(), institution: z.string(), ay: z.string().regex(/^\d{4}\/\d{2}$/),
  article: z.string(), page: z.number().int().nullable(), url: z.string().url(), basis: Basis, lastVerified: iso,
});
export const Metric = z.object({ label: z.string().max(40), value: z.string().max(60), note: z.string().max(60).optional() });
export const Deadline = z.object({ label: z.string(), date: iso, time: z.string().nullable(), state: z.enum(['upcoming', 'today', 'passed']), daysLeft: z.number().int() });
export const Question = z.object({
  key: z.string(), text: z.string(), chips: z.array(z.object({ label: z.string(), set: z.record(z.union([z.string(), z.number(), z.boolean()])) })).optional(),
});

export const RukaResponse = z.object({
  type: z.enum(['cfu_requirement', 'deadline', 'eligibility', 'ranking_status', 'accommodation', 'payment', 'isee', 'international',
    'documents_checklist', 'dual_institution', 'general_rule', 'next_steps', 'document_analysis', 'upload_prompt', 'year_mismatch', 'no_source', 'help']),
  ay: z.string(), status: z.object({ tone: Tone, label: z.string() }),
  headline: z.string().max(90), summary: z.string().max(220),
  metrics: z.array(Metric).max(4), progress: z.object({ current: z.number(), required: z.number(), remaining: z.number() }).optional(),
  deadline: Deadline.optional(), next_actions: z.array(z.object({ text: z.string().max(200), due: iso.optional() })).max(6),
  explanation: z.array(z.string().max(500)).max(4),             // collapsed by default in the UI
  sources: z.array(Source),                                     // must be non-empty for any rule-based claim
  questions: z.array(Question).max(2), confidence: Confidence,
}).strict().superRefine((r, ctx) => {
  if (r.confidence !== 'none' && r.type !== 'help' && r.sources.length === 0) ctx.addIssue({ code: 'custom', message: 'rule-based answers need a source' });
  if (r.sources.some((s) => s.ay !== r.ay)) ctx.addIssue({ code: 'custom', message: 'source academic year differs from answer year' });
});
export type RukaResponse = z.infer<typeof RukaResponse>;
