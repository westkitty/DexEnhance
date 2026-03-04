export const PROMPT_CATALOG_VERSION = '2026-03-04-catalog-v1';

/**
 * Curated starter prompt set grouped by difficulty tiers.
 * tags should include one of: common | advanced | epic
 */
export const DEFAULT_PROMPT_TEMPLATES = [
  {
    title: 'Summarize This Thread',
    body: 'Summarize this conversation in 8 bullet points. Include: decisions, open questions, blockers, and next actions.',
    tags: ['common', 'summarize', 'meetings'],
  },
  {
    title: 'Email Reply Draft',
    body: 'Write a concise professional reply to this message. Tone: warm, direct. Include one clear next step and one proposed date.',
    tags: ['common', 'email', 'writing'],
  },
  {
    title: 'Rewrite for Clarity',
    body: 'Rewrite the text below to be clearer and shorter. Keep meaning unchanged. Return: original sentence, revised sentence, why revised.',
    tags: ['common', 'editing', 'writing'],
  },
  {
    title: 'Meeting Agenda Builder',
    body: 'Create a 30-minute meeting agenda for {{topic}} with timeboxes, owner per section, and definition of done.',
    tags: ['common', 'meetings', 'planning'],
  },
  {
    title: 'Action Items Extractor',
    body: 'Extract action items from this text. Return a table with: task, owner, due date, dependency, confidence.',
    tags: ['common', 'project-management', 'operations'],
  },
  {
    title: 'Pros and Cons Snapshot',
    body: 'Give me a balanced pros/cons analysis for {{option}} in my context: {{context}}. End with a practical recommendation.',
    tags: ['common', 'decision-making'],
  },
  {
    title: 'Quick Brainstorm 20',
    body: 'Generate 20 ideas for {{goal}}. Group into low effort, medium effort, high effort. Mark top 3 to test first.',
    tags: ['common', 'brainstorm'],
  },
  {
    title: 'Social Post Variations',
    body: 'Create 10 social post variants for this announcement. Mix styles: punchy, thoughtful, technical. Keep each under 220 chars.',
    tags: ['common', 'marketing', 'social'],
  },
  {
    title: 'Roadmap from Goals',
    body: 'Turn these goals into a 6-week roadmap with weekly milestones, dependencies, and risk flags.',
    tags: ['common', 'planning', 'roadmap'],
  },
  {
    title: 'FAQ Generator',
    body: 'Create a practical FAQ from this content. Include at least 12 questions sorted by beginner to advanced.',
    tags: ['common', 'docs', 'support'],
  },
  {
    title: 'Tone Converter',
    body: 'Convert the following text into three tones: executive brief, friendly teammate, technical engineer.',
    tags: ['common', 'writing', 'communication'],
  },
  {
    title: 'Checklist Maker',
    body: 'Turn this objective into a start-to-finish checklist with acceptance criteria for each step.',
    tags: ['common', 'checklist', 'operations'],
  },
  {
    title: 'Customer Response Drafts',
    body: 'Draft 5 customer support responses for this issue. Keep empathy high and resolution-focused.',
    tags: ['common', 'support', 'communication'],
  },
  {
    title: 'Decision Memo Skeleton',
    body: 'Create a one-page decision memo structure for {{decision}} including context, options, recommendation, risks, and rollout.',
    tags: ['common', 'strategy', 'decision-making'],
  },
  {
    title: 'Learning Plan 30 Days',
    body: 'Create a 30-day learning plan for {{skill}} with daily tasks, practice reps, and checkpoints.',
    tags: ['common', 'learning', 'growth'],
  },
  {
    title: 'Interview Questions Pack',
    body: 'Generate 25 interview questions for {{role}}: 10 core, 10 scenario, 5 culture. Add what great answers include.',
    tags: ['common', 'hiring', 'people'],
  },
  {
    title: 'Feature Brief',
    body: 'Write a short product feature brief for {{feature}}. Include user problem, user story, success metric, non-goals.',
    tags: ['common', 'product', 'planning'],
  },
  {
    title: 'Launch Announcement',
    body: 'Write launch copy for {{product}} in 3 variants: website hero, email intro, changelog note.',
    tags: ['common', 'marketing', 'launch'],
  },
  {
    title: 'Retrospective Prompt',
    body: 'Run a retrospective on this sprint using: what worked, what did not, root causes, experiments for next sprint.',
    tags: ['common', 'agile', 'retrospective'],
  },
  {
    title: 'Clarifying Questions First',
    body: 'Before answering, ask me 7 clarifying questions that materially improve output quality for this task.',
    tags: ['common', 'prompting', 'quality'],
  },

  {
    title: 'PR Review Assistant',
    body: 'Review this code diff for correctness, edge cases, regressions, test gaps, and readability. Return findings by severity.',
    tags: ['advanced', 'engineering', 'review'],
  },
  {
    title: 'System Design Drill',
    body: 'Design a scalable architecture for {{system}} at {{scale}}. Include data flow, failure modes, monitoring, and tradeoffs.',
    tags: ['advanced', 'architecture', 'engineering'],
  },
  {
    title: 'SQL Debug Companion',
    body: 'Given this SQL and schema, identify correctness/performance issues. Propose a fixed query and index strategy.',
    tags: ['advanced', 'data', 'sql'],
  },
  {
    title: 'API Contract Evaluator',
    body: 'Evaluate this API spec for consistency, versioning risk, idempotency, and backward compatibility. Suggest concrete fixes.',
    tags: ['advanced', 'api', 'engineering'],
  },
  {
    title: 'Incident Postmortem Writer',
    body: 'Draft a blameless postmortem from this timeline. Include impact, root cause, detection, resolution, and prevention actions.',
    tags: ['advanced', 'operations', 'incident'],
  },
  {
    title: 'Threat Model Walkthrough',
    body: 'Create a threat model for {{feature}} using assets, actors, trust boundaries, abuse cases, and mitigations.',
    tags: ['advanced', 'security', 'risk'],
  },
  {
    title: 'A/B Test Designer',
    body: 'Design an A/B test for {{hypothesis}} with primary metric, guardrail metrics, sample size assumptions, and stop criteria.',
    tags: ['advanced', 'experimentation', 'analytics'],
  },
  {
    title: 'Metric Tree Builder',
    body: 'Build a metric tree for {{business_goal}} from north-star metric down to leading indicators and instrumentation events.',
    tags: ['advanced', 'analytics', 'strategy'],
  },
  {
    title: 'Migration Plan Generator',
    body: 'Create a zero-downtime migration plan from {{from_system}} to {{to_system}} with rollback checkpoints.',
    tags: ['advanced', 'migration', 'engineering'],
  },
  {
    title: 'Policy Draft with Edge Cases',
    body: 'Draft a policy for {{policy_topic}} and include at least 12 edge cases with recommended handling.',
    tags: ['advanced', 'policy', 'operations'],
  },
  {
    title: 'Research Synthesis Matrix',
    body: 'Synthesize these sources into a matrix: claim, evidence strength, contradictions, confidence, next research question.',
    tags: ['advanced', 'research', 'analysis'],
  },
  {
    title: 'Competitive Teardown',
    body: 'Perform a competitive teardown of {{competitor_set}} across onboarding, pricing, feature depth, and defensibility.',
    tags: ['advanced', 'market', 'strategy'],
  },
  {
    title: 'Risk Register Builder',
    body: 'Build a risk register for {{project}} with severity, likelihood, trigger, owner, mitigation, contingency.',
    tags: ['advanced', 'risk', 'project-management'],
  },
  {
    title: 'Executive Brief from Raw Notes',
    body: 'Convert raw notes into a C-level brief: situation, key insight, decision required, recommendation, timeline.',
    tags: ['advanced', 'executive', 'communication'],
  },
  {
    title: 'SOP Draft Assistant',
    body: 'Write a standard operating procedure for {{process}} with prerequisites, steps, QA checks, escalation paths.',
    tags: ['advanced', 'operations', 'documentation'],
  },
  {
    title: 'User Story Stress Test',
    body: 'Stress test these user stories for ambiguity. Rewrite each with acceptance criteria and negative test cases.',
    tags: ['advanced', 'product', 'quality'],
  },
  {
    title: 'Refactor Plan with Safety Rails',
    body: 'Create a refactor plan for {{component}} with incremental milestones, feature flags, test checkpoints, rollback strategy.',
    tags: ['advanced', 'engineering', 'refactoring'],
  },
  {
    title: 'Content Audit and Gap Map',
    body: 'Audit this documentation corpus. Return content inventory, overlap map, stale sections, and high-impact missing docs.',
    tags: ['advanced', 'docs', 'audit'],
  },
  {
    title: 'Negotiation Prep Sheet',
    body: 'Prepare a negotiation sheet for {{deal}}: goals, BATNA, concessions, red lines, opening offer, fallback positions.',
    tags: ['advanced', 'negotiation', 'strategy'],
  },
  {
    title: 'Forecast Scenarios',
    body: 'Build best/base/worst-case scenarios for {{initiative}} with assumptions, sensitivities, and decision triggers.',
    tags: ['advanced', 'forecasting', 'finance'],
  },

  {
    title: 'Company OS Blueprint',
    body: 'Design a full company operating system for {{company_type}} at {{size_stage}}: planning cadence, decision rights, metrics, rituals, escalation pathways.',
    tags: ['epic', 'operations', 'leadership'],
  },
  {
    title: 'Product Strategy Narrative',
    body: 'Write a 3-year product strategy narrative for {{product}} including market thesis, wedge, moat, sequencing, and kill criteria.',
    tags: ['epic', 'strategy', 'product'],
  },
  {
    title: 'Go-To-Market War Plan',
    body: 'Build a GTM war plan for {{offering}} across ICP, channels, messaging hierarchy, content engine, sales plays, and KPI scoreboard.',
    tags: ['epic', 'gtm', 'growth'],
  },
  {
    title: 'Platform Re-Architecture Proposal',
    body: 'Propose a platform re-architecture for {{platform}} with phased roadmap, ROI model, staffing plan, and technical debt payoff analysis.',
    tags: ['epic', 'architecture', 'strategy'],
  },
  {
    title: 'M&A Evaluation Playbook',
    body: 'Create an M&A evaluation playbook for {{target_type}} covering strategic fit, diligence checklist, integration risks, and 180-day integration plan.',
    tags: ['epic', 'finance', 'strategy'],
  },
  {
    title: 'Org Redesign Plan',
    body: 'Design an org restructure for {{org_context}}. Include reporting model, role charter updates, communication plan, and transition milestones.',
    tags: ['epic', 'people', 'leadership'],
  },
  {
    title: 'Pricing Architecture Deep Dive',
    body: 'Design a pricing architecture for {{product}} including packaging, usage metrics, expansion paths, discount policy, and migration strategy.',
    tags: ['epic', 'pricing', 'strategy'],
  },
  {
    title: 'Zero-to-One Product Discovery Sprint',
    body: 'Create a 4-week discovery sprint plan for {{problem_space}} with hypotheses, experiments, interview scripts, and decision gates.',
    tags: ['epic', 'product', 'discovery'],
  },
  {
    title: 'Founder Memo Draft',
    body: 'Draft a founder memo that aligns team, investors, and customers around {{big_bet}} with narrative, rationale, and execution commitments.',
    tags: ['epic', 'leadership', 'communication'],
  },
  {
    title: 'Transformation Program Plan',
    body: 'Design a cross-functional transformation program for {{initiative}} with governance model, change management, and risk controls.',
    tags: ['epic', 'program-management', 'operations'],
  },
  {
    title: 'International Expansion Blueprint',
    body: 'Build an international expansion blueprint for {{region}} including regulatory, localization, support, and launch sequencing.',
    tags: ['epic', 'expansion', 'operations'],
  },
  {
    title: 'Data Platform Vision + Execution',
    body: 'Create a data platform vision with 12-month execution plan covering data contracts, quality SLAs, governance, and self-serve analytics.',
    tags: ['epic', 'data', 'architecture'],
  },
  {
    title: 'AI Adoption Program',
    body: 'Design an enterprise AI adoption program for {{department}} with use-case prioritization, guardrails, training, and ROI tracking.',
    tags: ['epic', 'ai', 'operations'],
  },
  {
    title: 'Trust and Safety Framework',
    body: 'Create a trust and safety framework for {{platform}} including policy taxonomy, detection signals, response SLAs, and governance.',
    tags: ['epic', 'safety', 'policy'],
  },
  {
    title: 'Full Funnel Optimization Engine',
    body: 'Build a full-funnel optimization operating model for {{business}} from acquisition to retention with experiments and owner matrix.',
    tags: ['epic', 'growth', 'analytics'],
  },
  {
    title: 'Strategic Narrative Reframe',
    body: 'Rewrite this strategy into a compelling narrative for board, team, and customers. Keep one core thesis with role-specific versions.',
    tags: ['epic', 'strategy', 'communication'],
  },
  {
    title: 'Customer Advisory Board Program',
    body: 'Design a customer advisory board program including member selection, cadence, agenda templates, and insight-to-roadmap flow.',
    tags: ['epic', 'customer-success', 'strategy'],
  },
  {
    title: 'Mission-Critical Runbook Suite',
    body: 'Generate a suite of runbooks for mission-critical operations in {{domain}}: incident, escalation, fallback, communication, postmortem.',
    tags: ['epic', 'operations', 'resilience'],
  },
  {
    title: 'Portfolio Prioritization Engine',
    body: 'Create a portfolio prioritization framework for {{portfolio}} using impact, confidence, effort, strategic fit, and optionality.',
    tags: ['epic', 'portfolio', 'decision-making'],
  },
  {
    title: 'Annual Planning Command Center',
    body: 'Design an annual planning command center process with planning artifacts, review cadence, budget gates, and execution scorecards.',
    tags: ['epic', 'planning', 'leadership'],
  },
];
