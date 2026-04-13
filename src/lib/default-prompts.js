export const PROMPT_CATALOG_VERSION = '2026-04-13-catalog-v3';

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
  
  // Wave 11: Image Generation Expansion
  {
    title: 'Cyberpunk Cityscape',
    body: 'A neon-drenched street in {{city}} during a {{weather}} storm, futuristic vehicles, hyper-realistic reflections, cinematic lighting, {{style}} style, 8k.',
    tags: ['advanced', 'image-gen', 'cyberpunk']
  },
  {
    title: 'Floating Fantasy Island',
    body: 'A massive floating island with a {{landmark}} on it, waterfalls falling into the clouds, sunset lighting, high fantasy, {{style}} style.',
    tags: ['epic', 'image-gen', 'fantasy']
  },
  {
    title: 'Bioluminescent Ecosystem',
    body: 'A dense forest of bioluminescent plants in {{color}} and {{color2}}, mystical creatures in the background, ethereal glow, macro photography.',
    tags: ['advanced', 'image-gen', 'nature']
  },
  {
    title: 'Solarpunk Utopia',
    body: 'A solarpunk city center with lush vertical gardens, {{vehicle_type}} moving on tracks, white architecture, glass domes, golden hour lighting, {{style}}.',
    tags: ['advanced', 'image-gen', 'solarpunk']
  },
  {
    title: 'Low-Poly Isometric Room',
    body: 'Low-poly isometric 3D render of a {{room_type}}, soft lighting, pastel colors, clean edges, cute furniture, blender style.',
    tags: ['common', 'image-gen', '3d']
  },
  {
    title: 'Surreal Clock Melt',
    body: 'A melting clock hanging over a {{object}}, desert background, inspired by Dali, high contrast, dream-like atmosphere, {{style}}.',
    tags: ['epic', 'image-gen', 'surrealism']
  },
  {
    title: 'Macro Insect Portrait',
    body: 'Extreme macro close-up of a {{insect}}, vibrant iridescent colors, focus on the eyes, wet dew drops, soft bokeh background, {{lens}} lens.',
    tags: ['advanced', 'image-gen', 'nature']
  },
  {
    title: 'Gothic Cathedral Interior',
    body: 'Interior of a vast gothic cathedral made of {{material}}, stained glass windows with {{theme}} patterns, rays of light hitting the floor, dust particles.',
    tags: ['advanced', 'image-gen', 'architecture']
  },
  {
    title: 'Space Station View',
    body: 'POV from inside a space station looking at {{planet_type}}, high-tech control panels, futuristic UI, stars in the distance, cinematic sci-fi.',
    tags: ['advanced', 'image-gen', 'sci-fi']
  },
  {
    title: 'Ancient Jungle Temple',
    body: 'An ancient temple overgrown with {{vine_type}}, hidden in a deep jungle, explorers with {{tool}} in the foreground, misty morning atmosphere.',
    tags: ['advanced', 'image-gen', 'adventure']
  },
  {
    title: 'Minimalist Product Shot',
    body: 'Minimalist product photography of a {{product}}, set on a {{surface}}, harsh shadows, monochromatic background, high-end luxury aesthetic.',
    tags: ['common', 'image-gen', 'marketing']
  },
  {
    title: 'Fantasy Character Sketch',
    body: 'Full body sketch of a {{race}} {{class}}, wearing {{armor_type}}, wielding a {{weapon}}, charcoal and ink style, detailed anatomical accuracy.',
    tags: ['advanced', 'image-gen', 'character']
  },
  {
    title: 'Abstract Fluid Flow',
    body: 'Swirling {{colors}} flowing like {{liquid}}, macro photography, ethereal lighting, smooth gradients, high contrast, organic shapes.',
    tags: ['advanced', 'image-gen', 'abstract']
  },
  {
    title: 'Brutalist Monolith',
    body: 'A massive brutalist concrete monolith in the middle of a {{landscape}}, overcast sky, dramatic scale, architectural photography.',
    tags: ['advanced', 'image-gen', 'architecture']
  },
  {
    title: 'Claymation Character',
    body: 'A cute character made of {{color}} clay, {{attribute}} eyes, standing in a small outdoor scene, stop-motion animation style, soft studio lighting.',
    tags: ['common', 'image-gen', '3d']
  },
  {
    title: 'Cyberpunk Portrait',
    body: 'Close-up portrait of a person with {{aug_type}} cybernetic implants, neon glows reflected on skin, {{color}} lighting, tactical gear, 8k resolution.',
    tags: ['advanced', 'image-gen', 'cyberpunk']
  },
  {
    title: 'Steam-Punk Airship',
    body: 'A massive steam-punk airship made of brass and copper, with several {{prop_type}} propellers, flying over a {{city_style}} city, Victorian era, sepia tones.',
    tags: ['advanced', 'image-gen', 'steampunk']
  },
  {
    title: 'Minimalist Nature Wallpaper',
    body: 'A single {{plant}} in the center of a {{color}} background, minimalist design, high resolution, clean lines, calm vibe.',
    tags: ['common', 'image-gen', 'minimalism']
  },
  {
    title: 'Futuristic Vehicle Design',
    body: 'Concept art for a {{vehicle_type}}, aerodynamic shape, made of {{material}}, hover technology, sleek design, matte finish.',
    tags: ['advanced', 'image-gen', 'sci-fi']
  },
  {
    title: 'Mythical Beast Encounter',
    body: 'A {{beast_type}} emerging from the {{environment}}, {{reaction}} behavior, majestic scale, detailed textures, mythical atmosphere.',
    tags: ['epic', 'image-gen', 'fantasy']
  },
  {
    title: 'Hyper-Realistic Food Shot',
    body: 'Close up of a {{food_item}} with steam rising, professional food styling, wooden table, natural window light, bokeh background, appetizer appeal.',
    tags: ['common', 'image-gen', 'food']
  },
  {
    title: 'Dystopian Wasteland',
    body: 'A vast dystopian wasteland with rusted remains of {{object}}, sand dunes, pale sun, scavengers in the distance, Mad Max aesthetic.',
    tags: ['advanced', 'image-gen', 'dystopia']
  },
  {
    title: 'Magical Potion Bottle',
    body: 'A small glass bottle containing swirling {{color}} liquid, emits a soft {{glow_color}} light, set on an old {{surface}}, alchemist workshop style.',
    tags: ['common', 'image-gen', 'fantasy']
  },
  {
    title: 'Intergalactic Market',
    body: 'A bustling market on {{planet_name}}, various alien races trading {{items}}, vibrant colors, high-tech and low-life mix, detailed crowd.',
    tags: ['epic', 'image-gen', 'sci-fi']
  },
  {
    title: 'Paper Craft Landscape',
    body: 'A landscape of {{setting}} made entirely of {{color}} paper, layered paper texture, soft shadows, crafty aesthetic, unique art style.',
    tags: ['advanced', 'image-gen', 'art']
  },
  {
    title: 'Futuristic Sports Stadium',
    body: 'An aerial view of a futuristic sports stadium in {{city}}, hosting a {{sport}} match, hologram scoreboard, massive crowd, cinematic lighting.',
    tags: ['advanced', 'image-gen', 'architecture']
  },
  {
    title: 'Deep Sea Abyss',
    body: 'At the bottom of the ocean, a {{creature}} lurking near a {{structure}}, glowing lures, dark pressure atmosphere, high-definition bioluminescence.',
    tags: ['advanced', 'image-gen', 'nature']
  },
  {
    title: 'Vintage Sci-Fi Poster',
    body: '1950s style sci-fi movie poster featuring a {{monster}}, dramatic title font, halftone texture, vibrant colors, retro aesthetic.',
    tags: ['common', 'image-gen', 'retro']
  },
  {
    title: 'Cozy Hobbit Hole',
    body: 'A cozy house built into a green hill, circular {{color}} door, smoke coming from chimney, garden with {{flowers}}, Shire atmosphere.',
    tags: ['common', 'image-gen', 'fantasy']
  },
  {
    title: 'Underwater City',
    body: 'A sprawling city inside giant glass domes under the sea, schools of fish swimming around, futuristic submersibles, soft blue lighting.',
    tags: ['advanced', 'image-gen', 'architecture']
  },
  {
    title: 'Origami Animal Scene',
    body: 'An origami {{animal}} in a simple environment, sharp folds, delicate paper texture, monochromatic color palette, studio lighting.',
    tags: ['common', 'image-gen', 'art']
  },
  {
    title: 'Space Nebula Cluster',
    body: 'A vibrant space nebula with clouds of {{color}} and {{color2}} gas, clusters of newborn stars, interstellar dust, celestial wallpaper style.',
    tags: ['advanced', 'image-gen', 'sci-fi']
  },
  {
    title: 'Cyberpunk Bar Interior',
    body: 'Interior view of a gritty cyberpunk bar, patrons with {{augmentation}} implants, neon signs for {{brand}}, rainy window background, hazy atmosphere.',
    tags: ['advanced', 'image-gen', 'cyberpunk']
  },
  {
    title: 'Whimsical Tree House',
    body: 'A vast tree house complex built into a giant {{tree_type}}, rope bridges, glowing lanterns, spiral staircases, magical forest setting.',
    tags: ['advanced', 'image-gen', 'fantasy']
  },
  {
    title: 'Desert Oasis Temple',
    body: 'A pristine white temple standing in a desert oasis with {{palm_type}}, reflection on the water, golden sand, clear blue sky, architectural symmetry.',
    tags: ['advanced', 'image-gen', 'architecture']
  },
  {
    title: 'Futuristic Hospital Wing',
    body: 'Interior of a ultra-clean futuristic hospital wing, {{medical_robots}} assisting patients, soft integrated lighting, white and teal color scheme.',
    tags: ['advanced', 'image-gen', 'sci-fi']
  },
  {
    title: 'Enchanted Meadow',
    body: 'A field of glowing {{flower_type}} under a full moon, fireflies everywhere, soft silver lighting, dream-like atmosphere, high resolution.',
    tags: ['common', 'image-gen', 'fantasy']
  },
  {
    title: 'Steampunk Workshop',
    body: 'An inventor\'s workshop filled with {{machine_type}}, gears, pipes, blueprints, soft gaslight, detailed clutter, Victorian industrial aesthetic.',
    tags: ['advanced', 'image-gen', 'steampunk']
  },
  {
    title: 'Snowy Alpine Village',
    body: 'A small village nestled in the snowy {{mountains}}, cabins with glowing windows, blue hour lighting, cozy winter vibe, highly detailed.',
    tags: ['common', 'image-gen', 'nature']
  },
  { title: "Ancient Sky Library", body: "A library with floating books and stone arches in the clouds, shafts of sunlight, dust particles, ancient scrolls, magical scholar atmosphere.", tags: ["epic", "image-gen", "fantasy"] },
  },

  // Wave 11: Canvas Apps Expansion (Preact/HTM)
  {
    title: 'App: Pomodoro Timer',
    body: `() => {
  const [time, setTime] = hooks.useState(1500);
  const [isActive, setIsActive] = hooks.useState(false);

  hooks.useEffect(() => {
    let interval = null;
    if (isActive && time > 0) {
      interval = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0) {
      setIsActive(false);
      alert('Time is up!');
    }
    return () => clearInterval(interval);
  }, [isActive, time]);

  const format = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return \`\${min}:\${sec < 10 ? '0' : ''}\${sec}\`;
  };

  return html\`
    <div style={{ textAlign: 'center', padding: '20px', background: '#f9f9f9', borderRadius: '12px' }}>
      <h2 style={{ color: '#ff6b6b' }}>Pomodoro Timer</h2>
      <div style={{ fontSize: '48px', fontWeight: 'bold', margin: '20px 0' }}>\${format(time)}</div>
      <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button 
          onClick={() => setIsActive(!isActive)} 
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#4ecdc4', color: 'white', cursor: 'pointer' }}
        >
          \${isActive ? 'Pause' : 'Start'}
        </button>
        <button 
          onClick={() => { setTime(1500); setIsActive(false); }} 
          style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#ccc', cursor: 'pointer' }}
        >
          Reset
        </button>
      </div>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Reaction Timer',
    body: `() => {
  const [state, setState] = hooks.useState('waiting'); // waiting, ready, testing, done
  const [startTime, setStartTime] = hooks.useState(0);
  const [result, setResult] = hooks.useState(null);
  const timeoutRef = hooks.useRef(null);

  const start = () => {
    setState('ready');
    const delay = 1000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      setState('testing');
      setStartTime(Date.now());
    }, delay);
  };

  const handlePointer = () => {
    if (state === 'ready') {
      clearTimeout(timeoutRef.current);
      setState('waiting');
      alert('Too early!');
    } else if (state === 'testing') {
      const ms = Date.now() - startTime;
      setResult(ms);
      setState('done');
    }
  };

  return html\`
    <div 
      onPointerDown=\${handlePointer}
      style={{ 
        height: '240px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: state === 'testing' ? '#2ecc71' : state === 'ready' ? '#f1c40f' : '#3498db',
        color: 'white',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'center'
      }}
    >
      <div>
        \${state === 'waiting' && html\`
          <div>
            <h3>Reaction Test</h3>
            <p>Click the button below, then click this blue box when it turns GREEN.</p>
            <button onClick=\${(e) => { e.stopPropagation(); start(); }} style={{ padding: '10px 20px' }}>Start Test</button>
          </div>
        \`}
        \${state === 'ready' && html\`<h3>WAIT FOR GREEN...</h3>\`}
        \${state === 'testing' && html\`<h3>CLICK NOW!</h3>\`}
        \${state === 'done' && html\`
          <div>
            <h3>Result: \${result}ms</h3>
            <button onClick=\${(e) => { e.stopPropagation(); start(); }} style={{ padding: '10px 20px' }}>Try Again</button>
          </div>
        \`}
      </div>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'game']
  },
  {
    title: 'App: Color Palette Gen',
    body: `() => {
  const [palette, setPalette] = hooks.useState([]);
  
  const generate = () => {
    const newPalette = Array.from({ length: 5 }, () => {
      return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
    });
    setPalette(newPalette);
  };

  hooks.useEffect(() => generate(), []);

  return html\`
    <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #eee' }}>
      <h3 style={{ marginTop: 0 }}>Color Palette Generator</h3>
      <div style={{ display: 'flex', height: '150px', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
        \${palette.map(clr => html\`
          <div 
            key=\${clr}
            style={{ flex: 1, background: clr, display: 'flex', alignItems: 'end', justifyContent: 'center', paddingBottom: '10px' }}
          >
            <span style={{ fontSize: '10px', background: 'rgba(255,255,255,0.8)', padding: '2px 4px', borderRadius: '4px' }}>\${clr}</span>
          </div>
        \`)}
      </div>
      <button onClick=\${generate} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
        Generate New Palette
      </button>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Minimal Todo',
    body: `() => {
  const [todos, setTodos] = hooks.useState([]);
  const [text, setText] = hooks.useState('');

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setTodos([...todos, { id: Date.now(), text, done: false }]);
    setText('');
  };

  const toggle = (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return html\`
    <div style={{ padding: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 16px' }}>Local Tasks</h3>
      <form onSubmit=\${add} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input 
          value=\${text} 
          onInput=\${e => setText(e.target.value)} 
          style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
          placeholder="What needs to be done?"
        />
        <button type="submit" style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Add</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        \${todos.map(t => html\`
          <li key=\${t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0', borderBottom: '1px solid #eee' }}>
            <input type="checkbox" checked=\${t.done} onChange=\${() => toggle(t.id)} />
            <span style={{ textDecoration: t.done ? 'line-through' : 'none', color: t.done ? '#999' : '#333' }}>\${t.text}</span>
          </li>
        \`)}
      </ul>
      \${todos.length === 0 && h('p', { style: { color: '#999', textAlign: 'center' } }, 'No tasks added yet.')}
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Click Speed Test',
    body: `() => {
  const [clicks, setClicks] = hooks.useState(0);
  const [timeLeft, setTimeLeft] = hooks.useState(0);
  const [isActive, setIsActive] = hooks.useState(false);

  hooks.useEffect(() => {
    let timer = null;
    if (isActive && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
    }
    return () => clearInterval(timer);
  }, [isActive, timeLeft]);

  const start = () => {
    setClicks(0);
    setTimeLeft(10);
    setIsActive(true);
  };

  return html\`
    <div style={{ textAlign: 'center', padding: '20px', background: '#fef3c7', borderRadius: '12px' }}>
      <h3>Click Speed Test (10s)</h3>
      <div style={{ fontSize: '32px', margin: '10px 0' }}>\${timeLeft}s remaining</div>
      <div style={{ fontSize: '48px', fontWeight: 'bold' }}>\${clicks} clicks</div>
      <div style={{ margin: '20px 0' }}>
        \${!isActive && timeLeft === 0 ? html\`
          <button onClick=\${start} style={{ padding: '15px 30px', background: '#d97706', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px' }}>
            \${clicks > 0 ? 'Restart Test' : 'Start Test'}
          </button>
        \` : html\`
          <button 
            onMouseDown=\${() => setClicks(c => c + 1)} 
            style={{ width: '100%', padding: '40px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '12px', fontSize: '24px', cursor: 'pointer' }}
          >
            CLICK!!!
          </button>
        \`}
      </div>
      \${!isActive && clicks > 0 && html\`<div>Average CPS: \${(clicks / 10).toFixed(1)}</div>\`}
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'game']
  },
  {
    title: 'App: Drawing Pad',
    body: `() => {
  const canvasRef = hooks.useRef(null);
  const [isDrawing, setIsDrawing] = hooks.useState(false);
  const [color, setColor] = hooks.useState('#333333');

  hooks.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineWidth = 3;
  }, []);

  const start = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(offsetX, offsetY);
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return html\`
    <div style={{ background: '#fff', padding: '12px', border: '1px solid #ddd', borderRadius: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <input type="color" value=\${color} onChange=\${e => setColor(e.target.value)} />
        <button onClick=\${clear}>Clear</button>
      </div>
      <canvas 
        ref=\${canvasRef}
        onMouseDown=\${start}
        onMouseMove=\${draw}
        onMouseUp=\${() => setIsDrawing(false)}
        onMouseLeave=\${() => setIsDrawing(false)}
        style={{ width: '100%', height: '200px', background: '#fafafa', border: '1px solid #eee', cursor: 'crosshair', touchAction: 'none' }}
      />
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Digital Clock',
    body: `() => {
  const [time, setTime] = hooks.useState(new Date());

  hooks.useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return html\`
    <div style={{ 
      padding: '30px', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      color: 'white', 
      borderRadius: '16px', 
      textAlign: 'center',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    }}>
      <div style={{ fontSize: '14px', opacity: 0.8, marginBottom: '8px' }}>\${time.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</div>
      <div style={{ fontSize: '48px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        \${time.toLocaleTimeString()}
      </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Random Quote',
    body: `() => {
  const [quote, setQuote] = hooks.useState({ text: '', author: '' });
  const [loading, setLoading] = hooks.useState(false);

  const fetchQuote = async () => {
    setLoading(true);
    // In actual app we'd fetch from API, here we mock for sandbox safety
    const quotes = [
      { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
      { text: "Code is like humor. When you have to explain it, it’s bad.", author: "Cory House" },
      { text: "Fix the cause, not the symptom.", author: "Steve Maguire" },
      { text: "First, solve the problem. Then, write the code.", author: "John Johnson" }
    ];
    await new Promise(r => setTimeout(r, 600));
    setQuote(quotes[Math.floor(Math.random() * quotes.length)]);
    setLoading(false);
  };

  hooks.useEffect(() => fetchQuote(), []);

  return html\`
    <div style={{ padding: '20px', background: '#fff', borderLeft: '5px solid #333', borderRadius: '4px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      \${loading ? html\`<p>Finding inspiration...</p>\` : html\`
        <div>
          <p style={{ fontSize: '18px', fontStyle: 'italic', marginBottom: '10px' }}>"\${quote.text}"</p>
          <p style={{ textAlign: 'right', fontWeight: 'bold' }}>— \${quote.author}</p>
          <button onClick=\${fetchQuote} style={{ marginTop: '10px' }}>Next Quote</button>
        </div>
      \`}
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Tip Calculator',
    body: `() => {
  const [bill, setBill] = hooks.useState(50);
  const [tip, setTip] = hooks.useState(15);

  const total = bill * (1 + tip / 100);

  return html\`
    <div style={{ padding: '16px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #bbf7d0' }}>
      <h3 style={{ margin: '0 0 16px', color: '#166534' }}>Tip Calculator</h3>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px' }}>Bill Amount: $\${bill}</label>
        <input type="range" min="1" max="500" value=\${bill} onInput=\${e => setBill(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={{ display: 'block', fontSize: '12px' }}>Tip Percentage: \${tip}%</label>
        <input type="range" min="0" max="50" value=\${tip} onInput=\${e => setTip(Number(e.target.value))} style={{ width: '100%' }} />
      </div>
      <div style={{ borderTop: '1px solid #bbf7d0', paddingTop: '12px', marginTop: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tip:</span>
          <strong>$\${(bill * (tip / 100)).toFixed(2)}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', marginTop: '4px' }}>
          <span>Total:</span>
          <strong>$\${total.toFixed(2)}</strong>
        </div>
      </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Memory Card Game',
    body: `() => {
  const icons = ['🍎', '🍌', '🍇', '🍓', '🍒', '🍍'];
  const [cards, setCards] = hooks.useState([]);
  const [flipped, setFlipped] = hooks.useState([]);
  const [solved, setSolved] = hooks.useState([]);

  const init = () => {
    const deck = [...icons, ...icons].sort(() => Math.random() - 0.5);
    setCards(deck);
    setFlipped([]);
    setSolved([]);
  };

  hooks.useEffect(() => init(), []);

  const handleClick = (index) => {
    if (flipped.includes(index) || solved.includes(index) || flipped.length >= 2) return;
    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]] === cards[newFlipped[1]]) {
        setSolved([...solved, ...newFlipped]);
        setFlipped([]);
      } else {
        setTimeout(() => setFlipped([]), 800);
      }
    }
  };

  return html\`
    <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '12px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
        \${cards.map((icon, i) => html\`
          <div 
            key=\${i}
            onClick=\${() => handleClick(i)}
            style={{ 
              height: '60px', 
              background: flipped.includes(i) || solved.includes(i) ? 'white' : '#374151',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '24px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              transition: 'transform 0.2s'
            }}
          >
            \${(flipped.includes(i) || solved.includes(i)) ? icon : '?'}
          </div>
        \`)}
      </div>
      \${solved.length === cards.length && solved.length > 0 && html\`
        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <p>Great Job!</p>
          <button onClick=\${init}>Play Again</button>
        </div>
      \`}
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'game']
  },
  {
    title: 'App: Password Generator',
    body: `() => {
  const [length, setLength] = hooks.useState(12);
  const [password, setPassword] = hooks.useState('');
  
  const gen = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let res = '';
    for (let i = 0; i < length; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
    setPassword(res);
  };

  hooks.useEffect(() => gen(), [length]);

  return html\`
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
      <h3>Secure Gen</h3>
      <div style={{ background: '#fff', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', marginBottom: '12px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
        \${password || 'Generating...'}
      </div>
      <label style={{ fontSize: '12px' }}>Length: \${length}</label>
      <input type="range" min="4" max="32" value=\${length} onInput=\${e => setLength(Number(e.target.value))} style={{ width: '100%', marginBottom: '12px' }} />
      <button onClick=\${gen} style={{ width: '100%', padding: '10px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px' }}>Regenerate</button>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Unit Converter',
    body: `() => {
  const [km, setKm] = hooks.useState(1);
  const miles = (km * 0.621371).toFixed(2);

  return html\`
    <div style={{ padding: '16px', background: '#fff', border: '1px solid #eee', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 12px' }}>Distance Converter</h3>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <input type="number" value=\${km} onInput=\${e => setKm(e.target.value)} style={{ width: '80px', padding: '8px' }} />
        <span>Kilometers =</span>
      </div>
      <div style={{ marginTop: '12px', fontSize: '20px', fontWeight: 'bold' }}>
        \${miles} Miles
      </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Markdown Preview',
    body: `() => {
  const [text, setText] = hooks.useState('# Hello World\\n\\nThis is a **markdown** previewer in the sandbox.\\n\\n- List item 1\\n- List item 2');
  
  // Simple regex-based markdown parser for sandbox
  const parse = (md) => {
    let res = md
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/\\*\\*(.*)\\*\\*/gim, '<b>$1</b>')
      .replace(/\\*(.*)\\*/gim, '<i>$1</i>')
      .replace(/^- (.*$)/gim, '<li>$1</li>');
    return res;
  };

  return html\`
    <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid #ddd' }}>
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Markdown Input</label>
      <textarea 
        value=\${text} 
        onInput=\${e => setText(e.target.value)} 
        style={{ width: '100%', height: '80px', marginBottom: '12px', fontFamily: 'monospace' }}
      />
      <label style={{ fontSize: '11px', fontWeight: 'bold' }}>Preview</label>
      <div 
        dangerouslySetInnerHTML=\${{ __html: parse(text) }} 
        style={{ padding: '12px', background: '#f9f9f9', border: '1px solid #eee', minHeight: '100px' }} 
      />
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Stop Watch',
    body: `() => {
  const [ms, setMs] = hooks.useState(0);
  const [running, setRunning] = hooks.useState(false);

  hooks.useEffect(() => {
    let timer;
    if (running) {
      timer = setInterval(() => setMs(m => m + 10), 10);
    }
    return () => clearInterval(timer);
  }, [running]);

  const format = (m) => {
    const s = Math.floor(m / 1000);
    const mm = m % 1000;
    return \`\${s}.\${mm < 100 ? '0' : ''}\${Math.floor(mm/10)}\`;
  };

  return html\`
    <div style={{ padding: '20px', textAlign: 'center', background: '#000', color: '#0f0', borderRadius: '12px', fontFamily: 'monospace' }}>
      <div style={{ fontSize: '48px' }}>\${format(ms)}s</div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '16px' }}>
        <button onClick=\${() => setRunning(!running)} style={{ padding: '8px 16px' }}>\${running ? 'Stop' : 'Start'}</button>
        <button onClick=\${() => { setMs(0); setRunning(false); }} style={{ padding: '8px 16px' }}>Reset</button>
      </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Compound Interest',
    body: `() => {
  const [p, setP] = hooks.useState(1000);
  const [r, setR] = hooks.useState(5);
  const [t, setT] = hooks.useState(10);

  const amount = p * Math.pow((1 + r / 100), t);

  return html\`
    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #cbd5e1' }}>
      <h3 style={{ margin: '0 0 12px' }}>Savings Forecast</h3>
      <div style={{ margin: '8px 0' }}> Principal: $\${p} <input type="range" min="100" max="10000" step="100" value=\${p} onInput=\${e => setP(e.target.value)} /> </div>
      <div style={{ margin: '8px 0' }}> Rate: \${r}% <input type="range" min="1" max="20" value=\${r} onInput=\${e => setR(e.target.value)} /> </div>
      <div style={{ margin: '8px 0' }}> Years: \${t} <input type="range" min="1" max="40" value=\${t} onInput=\${e => setT(e.target.value)} /> </div>
      <div style={{ marginTop: '16px', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
        Result: <strong style={{ fontSize: '18px' }}>$\${amount.toFixed(2)}</strong>
      </div>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'tool']
  },
  {
    title: 'App: Mock Weather',
    body: `() => {
  const [city, setCity] = hooks.useState('San Francisco');
  const [temp, setTemp] = hooks.useState(68);

  return html\`
    <div style={{ padding: '24px', background: 'linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%)', color: '#fff', borderRadius: '16px', textAlign: 'center' }}>
       <div style={{ fontSize: '20px', fontWeight: '600' }}>\${city}</div>
       <div style={{ fontSize: '64px', margin: '8px 0' }}>☀️</div>
       <div style={{ fontSize: '48px', fontWeight: 'bold' }}>\${temp}°F</div>
       <div style={{ textTransform: 'uppercase', fontSize: '12px', opacity: 0.8 }}>Mostly Sunny</div>
       <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '16px', fontSize: '12px' }}>
         <div>H: 74°</div>
         <div>L: 58°</div>
       </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Tic Tac Toe',
    body: `() => {
  const [board, setBoard] = hooks.useState(Array(9).fill(null));
  const [xIsNext, setXIsNext] = hooks.useState(true);

  const calculateWinner = (squares) => {
    const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) return squares[a];
    }
    return null;
  };

  const handleClick = (i) => {
    if (calculateWinner(board) || board[i]) return;
    const next = board.slice();
    next[i] = xIsNext ? 'X' : 'O';
    setBoard(next);
    setXIsNext(!xIsNext);
  };

  const winner = calculateWinner(board);

  return html\`
    <div style={{ padding: '16px', background: '#fff', borderRadius: '12px', textAlign: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', maxWidth: '180px', margin: '0 auto' }}>
        \${board.map((sq, i) => html\`
          <div 
            key=\${i} 
            onClick=\${() => handleClick(i)}
            style={{ width: '60px', height: '60px', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer' }}
          >
            \${sq}
          </div>
        \`)}
      </div>
      <div style={{ marginTop: '16px' }}>
        \${winner ? \`Winner: \${winner}\` : \`Next player: \${xIsNext ? 'X' : 'O'}\`}
        <br/><button onClick=\${() => setBoard(Array(9).fill(null))} style={{ marginTop: '8px' }}>Reset</button>
      </div>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'game']
  },
  {
    title: 'App: Digital Pet',
    body: `() => {
  const [hunger, setHunger] = hooks.useState(50);
  const [happy, setHappy] = hooks.useState(50);

  const getEmoji = () => {
    if (hunger > 80) return '💀';
    if (hunger > 60) return '🤢';
    if (happy < 20) return '😢';
    if (happy > 80) return '🥳';
    return '🐱';
  };

  return html\`
    <div style={{ padding: '20px', background: '#fff9c4', borderRadius: '16px', textAlign: 'center' }}>
      <div style={{ fontSize: '64px', marginBottom: '16px' }}>\${getEmoji()}</div>
      <div style={{ fontSize: '12px', textAlign: 'left' }}>
        Hunger: \${hunger}% <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}><div style={{ width: \`\${hunger}%\`, height: '100%', background: '#ef4444' }}></div></div>
        Happiness: \${happy}% <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}><div style={{ width: \`\${happy}%\`, height: '100%', background: '#fbbf24' }}></div></div>
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button onClick=\${() => setHunger(Math.max(0, hunger - 10))} style={{ flex: 1 }}>Feed</button>
        <button onClick=\${() => setHappy(Math.min(100, happy + 10))} style={{ flex: 1 }}>Play</button>
      </div>
    </div>
  \`;
}`,
    tags: ['advanced', 'apps', 'game']
  },
  {
    title: 'App: Data Converter',
    body: `() => {
  const [mb, setMb] = hooks.useState(1024);
  return html\`
    <div style={{ padding: '16px', background: '#fff', border: '1px solid #ddd', borderRadius: '12px' }}>
      <h3 style={{ margin: '0 0 12px' }}>Bytes Converter</h3>
      <input type="number" value=\${mb} onInput=\${e => setMb(e.target.value)} style={{ width: '100px' }} /> MB
      <div style={{ marginTop: '12px' }}>
        <div>\${(mb / 1024).toFixed(3)} GB</div>
        <div>\${(mb * 1024).toLocaleString()} KB</div>
      </div>
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'tool']
  },
  {
    title: 'App: Simple Quiz',
    body: `() => {
  const [step, setStep] = hooks.useState(0);
  const [score, setScore] = hooks.useState(0);

  const questions = [
    { q: 'What is 2+2?', a: '4', options: ['3', '4', '5'] },
    { q: 'Language of the web?', a: 'JS', options: ['Python', 'JS', 'C++'] }
  ];

  const handle = (opt) => {
    if (opt === questions[step].a) setScore(score + 1);
    setStep(step + 1);
  };

  return html\`
    <div style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #ddd' }}>
      \${step < questions.length ? html\`
        <div>
          <h4>\${questions[step].q}</h4>
          \${questions[step].options.map(opt => html\`
            <button onClick=\${() => handle(opt)} style={{ display: 'block', width: '100%', marginBottom: '4px', padding: '8px' }}>\${opt}</button>
          \`)}
        </div>
      \` : html\`
        <div style={{ textAlign: 'center' }}>
          <h3>Quiz Finished!</h3>
          <p>Score: \${score}/\${questions.length}</p>
          <button onClick=\${() => { setStep(0); setScore(0); }}>Restart</button>
        </div>
      \`}
    </div>
  \`;
}`,
    tags: ['common', 'apps', 'game']
  },
  // Wave 12: Team Role Personas
  {
    title: 'ROLE: Fullstack Architect',
    body: 'Act as a Senior Fullstack Architect. Focus on scalability, security, and maintainability. When reviewing code, look for pattern consistency, potential race conditions, and architectural drift. Return structured ADR (Architecture Decision Record) style feedback.',
    tags: ['persona', 'engineering', 'advanced'],
  },
  {
    title: 'ROLE: Product Manager (Growth)',
    body: 'Act as a Growth Product Manager. Focus on conversion, user friction, and metric impact. When reviewing features, ask: "How does this move our North Star?" and "What is the simplest version that validates our hypothesis?"',
    tags: ['persona', 'product', 'strategy'],
  },
  {
    title: 'ROLE: UI/UX Specialist',
    body: 'Act as a Senior UI/UX Designer. Focus on accessibility (A11y), visual hierarchy, and cognitive load. Review interfaces for spacing consistency, color contrast, and micro-interaction delight. Suggest modern CSS solutions (CSS Variables, Flex/Grid).',
    tags: ['persona', 'design', 'common'],
  },
  {
    title: 'ROLE: Cybersecurity Auditor',
    body: 'Act as a Lead Cybersecurity Auditor. Review every input/output for injection risks, insecure defaults, and privilege escalation vulnerabilities. Assume zero-trust. Refer to OWASP Top 10 where applicable.',
    tags: ['persona', 'security', 'advanced'],
  },
  {
    title: 'ROLE: Data Scientist',
    body: 'Act as a Senior Data Scientist. Focus on data integrity, statistical significance, and bias detection. When reviewing queries or models, look for leakage, improper normalization, and non-linear correlations. Suggest experimental improvements.',
    tags: ['persona', 'data', 'advanced'],
  },
  {
    title: 'ROLE: Technical Writer',
    body: 'Act as an Expert Technical Writer. Focus on clarity, brevity, and the "Inverted Pyramid" of information. Review text for passive voice, jargon without definition, and complex sentence structures. Ensure documentation is actionable.',
  },
  // Wave 13: Character Reference & Concept Art Focus
  {
    title: 'Character Reference Sheet: Standard',
    body: 'A comprehensive character reference sheet for a {{archetype}}, featuring three separate views: full body front, profile side, and back view. Flat colors, simple T-pose, set on a plain neutral white background, high-resolution line art, {{style}} style.',
    tags: ['advanced', 'image-gen', 'character-sheet'],
  },
  {
    title: 'Character: Cyberpunk Mercenary',
    body: 'Full body portrait of a cyberpunk mercenary with {{augment_type}} cybernetic implants, wearing {{armor_material}} tactical gear. Neon {{glow_color}} accents, rainy urban alleyway background, dark atmosphere, hyper-realistic, 8k.',
    tags: ['advanced', 'image-gen', 'cyberpunk'],
  },
  {
    title: 'Character: High Fantasy Mage',
    body: 'An elder mage wearing flowing {{color}} silk robes embroidered with silver arcane runes. Holding a {{material}} staff topped with a glowing {{crystal_type}} gem. Swirling magical energy in the background, cinematic lighting.',
    tags: ['epic', 'image-gen', 'fantasy'],
  },
  {
    title: 'Character: Steampunk Inventor',
    body: 'A steampunk inventor with brass-rimmed goggles and a leather apron stained with oil. Features a complex {{device_type}} steam-powered apparatus on their back. Victorian workshop setting with gears and blueprints, sepia-toned cinematic lighting.',
    tags: ['advanced', 'image-gen', 'steampunk'],
  },
  {
    title: 'Character: Post-Apoc Scavenger',
    body: 'A gritty post-apocalyptic scavenger wearing layered rags and a makeshift gas mask. Carrying a {{weapon}} made of scrapped parts. Desert wasteland background with rusted ruins, high-contrast lighting, weathered textures.',
    tags: ['advanced', 'image-gen', 'dystopia'],
  },
  {
    title: 'Character: Expression Sheet (9-Grid)',
    body: 'A 3x3 grid expression sheet for a character named {{name}}. Emotions: Neutral, Joy, Anger, Fear, Sadness, Disgust, Surprise, Determination, and Exhaustion. Consistent character features across all squares, clean background.',
    tags: ['advanced', 'image-gen', 'character-sheet'],
  },
  {
    title: 'Character: Samurai Ronin',
    body: 'A lone samurai ronin in a weathered indigo kimono, standing in a field of red spider lilies. Hand on a {{sword_type}} hilt, wind blowing through their hair, traditional Japanese ink wash aesthetic mixed with realism.',
    tags: ['advanced', 'image-gen', 'character'],
  },
  {
    title: 'Character: Viking Shield-Maiden',
    body: 'A fierce Viking shield-maiden with braided hair and blue war paint. Wearing fur-lined leather armor and holding a notched wooden shield. Snowing mountain backdrop, cinematic cold lighting, epic scale.',
    tags: ['advanced', 'image-gen', 'character'],
  },
  {
    title: 'Character: Heavy Space Marine',
    body: 'A massive space marine encased in {{color}} power armor with hydraulic pistons and glowing exhaust vents. Holding a heavy {{weapon_type}} weapon. Sci-fi hangar background, gritty industrial lighting, focus on metal textures.',
    tags: ['epic', 'image-gen', 'sci-fi'],
  },
  {
    title: 'Character: Streetwear Protagonist',
    body: 'A modern protagonist wearing high-end streetwear: oversized hoodie, tactical joggers, and tech-pack. Standing in a brightly lit {{city}} crosswalk. Vibrant colors, shallow depth of field, fashion photography style.',
    tags: ['common', 'image-gen', 'character'],
  },
  {
    title: 'Character: Elven Forest Ranger',
    body: 'An elven ranger with long pointed ears, wearing green-and-brown leather scale armor. Aiming a recursive longbow made of living wood. Dappled sunlight through a dense forest canopy, mystical atmosphere.',
    tags: ['advanced', 'image-gen', 'fantasy'],
  },
  {
    title: 'Character: Gothic Vampire Noble',
    body: 'A gothic vampire noble in a high-collared velvet coat and silken cravat. Pale skin, striking red eyes, holding a silver chalice. Dimly lit castle hall background, dramatic chiaroscuro lighting.',
    tags: ['advanced', 'image-gen', 'character'],
  },
  {
    title: 'Character: Dieselpunk Pilot',
    body: 'A dieselpunk pilot with a leather flight jacket and a sheepskin collar. Features a specialized {{mask_type}} flight mask. Standing in front of a heavy propeller plane, 1940s aesthetic with gritty industrial details.',
    tags: ['advanced', 'image-gen', 'steampunk'],
  },
  {
    title: 'Character: Noir Detective',
    body: 'A classic noir detective in a trench coat and fedora, face partially obscured by shadow. Standing under a single streetlamp in the fog. Black and white film noir aesthetic, high contrast, cigarette smoke.',
    tags: ['common', 'image-gen', 'character'],
  },
  {
    title: 'Character: Alien Biomancer',
    body: 'An alien biomancer with iridescent bioluminescent skin and multiple elongated limbs. Surrounded by floating glowing spores and strange organic pods. Ethereal alien landscape, vibrant otherworldly colors.',
    tags: ['epic', 'image-gen', 'sci-fi'],
  },
  {
    title: 'Character: Dwarven Blacksmith',
    body: 'A stout dwarven blacksmith with a thick braided beard adorned with iron rings. Wearing a heavy scorched leather apron and swinging a molten hammer on an anvil. Glowing embers and sparks everywhere, dark forge setting.',
    tags: ['advanced', 'image-gen', 'fantasy'],
  },
  {
    title: 'Character: Shadow Assassin',
    body: 'A shadow assassin wearing a form-fitting charcoal stealth suit with {{color}} light-absorbing fabric. Holding twin {{weapon}} blades. Perched on a moonlit rooftop, dramatic moonlight and deep shadows.',
    tags: ['advanced', 'image-gen', 'character'],
  },
  {
    title: 'Character: Solarpunk Botanist',
    body: 'A solarpunk botanist wearing a white eco-suit with integrated vertical garden tools. Surrounded by lush greenery and clean white architecture. Golden hour lighting, hopeful and bright aesthetic.',
    tags: ['advanced', 'image-gen', 'solarpunk'],
  },
  {
    title: 'Character: Victorian Android',
    body: 'A Victorian-era android with a white porcelain face and exposed golden clockwork gears in its neck. Wearing a lace dress and holding a parasol. Greenhouse background with exotic flowers, soft lighting.',
    tags: ['epic', 'image-gen', 'steampunk'],
  },
  {
    title: 'Character: Nomad Merchant',
    body: 'A nomad merchant leading a {{animal_type}} pack animal laden with colorful rugs and copper pots. Wearing layered nomadic robes and a turban. Vast desert dunes at sunset, warm cinematic lighting.',
    tags: ['common', 'image-gen', 'character'],
  },
];
