/**
 * default-chains.js
 * 40 high-performance multi-step AI workflows.
 */

export const DEFAULT_CHAINS = [
  // --- TEXT CHAINS (20) ---
  {
    id: 'chain-pr-review-repair',
    name: 'PR Review & Repair Loop',
    description: 'Deep review of a diff followed by automated blocker fixes.',
    tags: ['text', 'engineering', 'advanced'],
    steps: [
      { title: 'Semantic Review', body: 'Review this code diff for correctness, security, and performance. Focus on blockers. DIFF:\n"""\n{{DIFF}}\n"""', piped: false },
      { title: 'Draft Blocker Fixes', body: 'Based on your review below, draft the exact code changes needed to fix the "Blocker" level issues identified. REVIEW:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-legacy-modernizer',
    name: 'Legacy Modernizer',
    description: 'Detects legacy patterns and rewrites using modern standards.',
    tags: ['text', 'engineering', 'refactor'],
    steps: [
      { title: 'Pattern Detection', body: 'Analyze the following code for legacy patterns (var, callbacks, monolithic structure). Return a list of modernization targets. CODE:\n"""\n{{CODE}}\n"""', piped: false },
      { title: 'Modern Rewrite', body: 'Rewrite the code targets identified below using modern ESNext/TypeScript standards and best practices. TARGETS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-content-multiplier',
    name: 'Content Multiplier',
    description: 'Generate social media thread and LinkedIn post from a core article.',
    tags: ['text', 'marketing', 'writing'],
    steps: [
      { title: 'Summarize Core Values', body: 'Summarize the 5 most valuable insights from this article. ARTICLE:\n"""\n{{ARTICLE}}\n"""', piped: false },
      { title: 'Generate Tweet Thread', body: 'Convert the following insights into a compelling 5-tweet thread. Use punchy openers. INSIGHTS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Draft LinkedIn Summary', body: 'Write a professional LinkedIn post based on these insights, focusing on industry impact. INSIGHTS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-bug-triage',
    name: 'Bug Triage & Root Cause',
    description: 'Analyze log, hypothesize cause, and draft reproduction.',
    tags: ['text', 'engineering', 'debugging'],
    steps: [
      { title: 'Analyze Log', body: 'Analyze this error log for patterns, call stacks, and environment variables. IDENTIFY: The likely failure point. LOG:\n"""\n{{LOG}}\n"""', piped: false },
      { title: 'Hypothesize Cause', body: 'Based on the failure point below, hypothesize the 3 most likely root causes. ANALYSIS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Reproduction Script', body: 'Draft a minimal reproduction script (Node.js or Python) for the most likely cause identified below. CAUSES:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-unit-test-booster',
    name: 'Unit Test Booster',
    description: 'Identify missing branches, generate test cases, and write implementation.',
    tags: ['text', 'engineering', 'testing'],
    steps: [
      { title: 'Logic Analysis', body: 'Identify all logical branches and edge cases in this function. FUNCTION:\n"""\n{{FUNCTION}}\n"""', piped: false },
      { title: 'Generate Test Cases', body: 'Generate a comprehensive table of test cases for a unit test suite based on these branches. ANALYSIS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Write Implementation', body: 'Write the complete unit test implementation using Vitest/Jest for the cases below. CASES:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-api-forge',
    name: 'API Design to Integration',
    description: 'OpenAPI spec to mock server to frontend hook.',
    tags: ['text', 'engineering', 'api'],
    steps: [
      { title: 'Draft OpenAPI Spec', body: 'Draft a full OpenAPI 3.0 YAML spec for a service that handles {{requirement}}.', piped: false },
      { title: 'Mock Server Code', body: 'Generate a Bun/Elysia mock server that implements this spec. SPEC:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Frontend Hook', body: 'Write a React/TanStack query hook to consume the main endpoints from this spec. SPEC:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-feature-spec',
    name: 'Feature Discovery to Spec',
    description: 'Brainstorm to User Story Mapping to PRD.',
    tags: ['text', 'product', 'planning'],
    steps: [
      { title: 'User Story Mapping', body: 'Map out the user journey and stories for a feature called {{feature_name}}. Include happy path and friction points.', piped: false },
      { title: 'Technical Architecture', body: 'Draft a technical architecture for this journey. Focus on data flow and state management. JOURNEY:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Draft PRD', body: 'Write a concise Product Requirements Document (PRD) incorporating the journey and architecture below. CONTEXT:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-meeting-action',
    name: 'Meeting to Action Loop',
    description: 'Summarize transcript, extract items, and draft recap.',
    tags: ['text', 'ops', 'meetings'],
    steps: [
      { title: 'Summarize Decisions', body: 'Summarize the 5 most critical decisions made in this transcript. TRANSCRIPT:\n"""\n{{TRANSCRIPT}}\n"""', piped: false },
      { title: 'Extract Action Items', body: 'Extract a table of action items with owners and estimated due dates. TRANSCRIPT:\n"""\n{{TRANSCRIPT}}\n"""', piped: false },
      { title: 'Draft Recap Email', body: 'Draft a professional recap email including the decisions and action items identified. DECISIONS:\n{{results[0]}}. ACTIONS:\n{{results[1]}}.', piped: false }
    ]
  },
  {
    id: 'chain-threat-model',
    name: 'Security Hardening Chain',
    description: 'Scan vulnerabilities, threat model, and patch.',
    tags: ['text', 'security', 'advanced'],
    steps: [
      { title: 'Vulnerability Scan', body: 'Scan the following component for XSS, CSRF, and data leakage risks. COMPONENT:\n"""\n{{COMPONENT}}\n"""', piped: false },
      { title: 'Threat Model', body: 'Create a STRIDE threat model based on the risks found below. RISKS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Patch Proposal', body: 'Provide a secure refactor of the original component to mitigate these threats. THREATS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-i18n-pipeline',
    name: 'i18n Localization Pipeline',
    description: 'Extract, translate (5 languages), and verify.',
    tags: ['text', 'ops', 'i18n'],
    steps: [
      { title: 'Extract Strings', body: 'Extract all hardcoded user-facing strings from this file into a JSON format. FILE:\n"""\n{{FILE}}\n"""', piped: false },
      { title: 'Translate Batch', body: 'Translate these strings into Spanish, French, German, Japanese, and Chinese. Preserve JSON keys. SOURCE:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Nuance Verification', body: 'Verify these translations for cultural nuance and string length constraints. Report any risks. TRANSLATIONS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-30day-roadmap',
    name: 'Skill Roadmap Builder',
    description: 'Gap analysis to curated resources to 30-day plan.',
    tags: ['text', 'learning', 'career'],
    steps: [
      { title: 'Gap Analysis', body: 'Analyze the gap between a junior and senior level in {{skill_area}}. Identify the 10 most critical missing concepts.', piped: false },
      { title: 'Curate Resources', body: 'Find the best documentation, challenges, and talks for these 10 concepts. CONCEPTS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: '30-Day Calendar', body: 'Build a structured 30-day learning calendar (1 hour/day) incorporating these resources. RESOURCES:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-swot-to-warplan',
    name: 'SWOT to Execution Warplan',
    description: 'SWOT to goal setting to 6-week milestones.',
    tags: ['text', 'strategy', 'business'],
    steps: [
      { title: 'Perform SWOT', body: 'Do a SWOT analysis for {{business_idea}} in the current {{market}} context.', piped: false },
      { title: 'Define Quarterly Goals', body: 'Convert the Strengths and Opportunities identified below into 3 S.M.A.R.T. quarterly goals. SWOT:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: '6-Week Warplan', body: 'Break these goals into a 6-week execution warplan with weekly milestones. GOALS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-a11y-refactor',
    name: 'A11y (Accessibility) Auditor',
    description: 'Structural scan to improvement matrix to refactor.',
    tags: ['text', 'design', 'a11y'],
    steps: [
      { title: 'Accessibility Scan', body: 'Audit the following HTML snippet for A11y (aria, contrast, semantics). HTML:\n"""\n{{HTML}}\n"""', piped: false },
      { title: 'Improvement Matrix', body: 'Generate a prioritized matrix of required A11y fixes. AUDIT:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'A11y Refactor', body: 'Rewrite the original HTML applying all the "High" and "Medium" priority fixes. MATRIX:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-seo-authority',
    name: 'SEO Authority Loop',
    description: 'Keyword analysis to meta-tag optimization to content ideas.',
    tags: ['text', 'marketing', 'seo'],
    steps: [
      { title: 'Keyword Analysis', body: 'Identify the top 10 high-value, low-competition keywords for {{topic}} in {{region}}.', piped: false },
      { title: 'Optimize Meta-Tags', body: 'Rewrite the page Title and Description for {{target_url}} using the keywords below. KEYWORDS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Inbound Ideas', body: 'Draft 10 article outlines designed to build domain authority for these keywords. KEYWORDS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-customer-resolution',
    name: 'Customer Resolution Loop',
    description: 'Sentiment analysis to KB search to draft response.',
    tags: ['text', 'ops', 'support'],
    steps: [
      { title: 'Sentiment Analysis', body: 'Classify this customer ticket by sentiment, urgency, and technical complexity. TICKET:\n"""\n{{TICKET}}\n"""', piped: false },
      { title: 'KB Search Simulation', body: 'Based on the issue below, what are the most likely keywords to search in a knowledge base for a fix? ISSUE:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Draft Resolution', body: 'Draft a warm, technical resolution response for the following issue. CONTEXT:\n{{results[0]}}.', piped: false }
    ]
  },
  {
    id: 'chain-code-archaeologist',
    name: 'Code Archaeologist',
    description: 'Annotation pass to data flow to Mermaid diagram.',
    tags: ['text', 'engineering', 'docs'],
    steps: [
      { title: 'Annotate Logic', body: 'Annotate every function in this file with a "What, Why, and How" comment block. FILE:\n"""\n{{FILE}}\n"""', piped: false },
      { title: 'Flow Analysis', body: 'Analyze the data flow between the annotated functions. IDENTIFY: The central state transitions. ANNOTATION:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Generate Mermaid', body: 'Generate a Mermaid.js flowchart showing the architecture identified below. ANALYSIS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-ux-friction-fix',
    name: 'UX Friction Fixer',
    description: 'Metric analysis to hypothesis to UI experiment.',
    tags: ['text', 'product', 'design'],
    steps: [
      { title: 'Analyze Metric Dropout', body: 'Analyze the following dropout data for a user flow. WHERE: {{dropout_point}}. DATA:\n"""\n{{DATA}}\n"""', piped: false },
      { title: 'Friction Hypothesis', body: 'Hypothesize 3 UI/UX reasons for the dropout identified below. ANALYSIS:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Design Experiment', body: 'Design a single A/B test (variant A/B) to test the primary hypothesis. HYPOTHESIS:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-reasoning-loop',
    name: 'Self-Correction Reasoning Loop',
    description: 'Initial solve to critical review to final optimization.',
    tags: ['text', 'logic', 'advanced'],
    steps: [
      { title: 'Initial Solve', body: 'Solve the following complex logic puzzle step-by-step. PUZZLE:\n"""\n{{PUZZLE}}\n"""', piped: false },
      { title: 'Critical Review', body: 'Critically review the solution below for logical fallacies or missed edge cases. Focus on "System 2" thinking. SOLUTION:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Final Optimized Answer', body: 'Provide the final, optimized, and verifiably correct solution based on the review. REVIEW:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-podcast-repurpose',
    name: 'Podcast Repurposing Suite',
    description: 'Transcript to shownotes to snippet timestamps.',
    tags: ['text', 'content', 'ops'],
    steps: [
      { title: 'Generate Shownotes', body: 'Generate a set of professional shownotes with a high-level summary and 5 key takeaways. TRANSCRIPT:\n"""\n{{TRANSCRIPT}}\n"""', piped: false },
      { title: 'Snippet Selection', body: 'Identify the 5 most "viral-ready" clips from this transcript. Include start/end timestamps and title. TRANSCRIPT:\n"""\n{{TRANSCRIPT}}\n"""', piped: false },
      { title: 'Draft SEO Title', body: 'Draft 10 YouTube/SEO optimized titles for this episode based on the summary below. SUMMARY:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },
  {
    id: 'chain-onboarding-blueprint',
    name: 'Onboarding Flow Blueprint',
    description: 'Persona happy path to friction audit to tooltip copy.',
    tags: ['text', 'product', 'growth'],
    steps: [
      { title: 'Persona Happy Path', body: 'Define the "Happy Path" for a {{user_persona}} trying to achieve {{primary_goal}}.', piped: false },
      { title: 'Friction Audit', body: 'Identify 3 major friction points in this path and how to remove them. PATH:\n"""\n{{LAST_RESULT}}\n"""', piped: true },
      { title: 'Draft Tooltip Copy', body: 'Write the tooltip and micro-copy for the 3 steps in this path. CONTEXT:\n"""\n{{LAST_RESULT}}\n"""', piped: true }
    ]
  },

  // --- IMAGE GEN CHAINS (20) ---
  {
    id: 'chain-character-genesis',
    name: 'Character Genesis',
    description: 'Full pipeline from description to high-fidelity render.',
    tags: ['image', 'concept-art'],
    steps: [
      { title: 'Conceptual Silhouette', body: 'Describe 3 distinct visual silhouettes for a character described as: {{description}}. Focus on unique shape language.', piped: false },
      { title: 'Silhouette Prompt', body: 'Create an image prompt for 3 black silhouette designs on a white background based on: {{LAST_RESULT}}.', piped: true },
      { title: 'Rough Inks Prompt', body: 'Create an image prompt for a detailed black-and-white ink sketch of the best silhouette from: {{LAST_RESULT}}.', piped: true },
      { title: 'Final Render Prompt', body: 'Create a high-fidelity rendering prompt in {{style}} style, including cinematic lighting, textures, and hero pose for: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-environment-forge',
    name: 'Environment Forge',
    description: 'Theme to atmosphere to layout to final scene.',
    tags: ['image', 'world-building'],
    steps: [
      { title: 'Atmosphere Study', body: 'Identify the lighting, color palette, and environmental mood for a {{theme}} world.', piped: false },
      { title: 'Layout Sketch Prompt', body: 'Generate an image prompt for a wide-angle architectural layout sketch using the mood from: {{LAST_RESULT}}.', piped: true },
      { title: 'Final Scene Prompt', body: 'Generate a high-detail photorealistic environment prompt for this scene. Include: {{LAST_RESULT}}. Camera: 35mm, f/8.', piped: true }
    ]
  },
  {
    id: 'chain-logo-iteration-v2',
    name: 'Logo Design Journey',
    description: 'Brand story to icons to typography to mockup.',
    tags: ['image', 'design'],
    steps: [
      { title: 'Visual Metaphors', body: 'Identify 3 visual metaphors for a brand named {{brand_name}} that does {{function}}.', piped: false },
      { title: 'Icon Sheet Prompt', body: 'Generate an image prompt for a minimalist vector logo icon set based on: {{LAST_RESULT}}.', piped: true },
      { title: 'Branding Mockup Prompt', body: 'Generate a premium product mockup prompt applying the logo from {{LAST_RESULT}} to a {{product_type}}.', piped: true }
    ]
  },
  {
    id: 'chain-comic-pipeline',
    name: 'Comic Page Pipeline',
    description: 'Script to panel layout to inks to color.',
    tags: ['image', 'creative'],
    steps: [
      { title: 'Panel Layout Prompt', body: 'Generate an image prompt for a dynamic comic book page panel layout for the script: {{script_line}}.', piped: false },
      { title: 'Rough Inks Prompt', body: 'Generate an image prompt for rough pencil inks of this layout. STYLE: {{artist_style}}.', piped: true },
      { title: 'Final Color Pass Prompt', body: 'Generate an image prompt for a final cell-shaded color pass on the inks from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-pbr-texture',
    name: 'PBR Texture Suite',
    description: 'Texture type to seamless base to PBR maps.',
    tags: ['image', '3d-assets'],
    steps: [
      { title: 'Seamless Base Prompt', body: 'Generate an image prompt for a seamless, top-down repeatable texture of {{texture_type}}. Set on a flat plane.', piped: false },
      { title: 'Normal/Height Map Prompt', body: 'Generate an image prompt for a blue/purple normal map and grayscale height map for the texture: {{LAST_RESULT}}.', piped: true },
      { title: 'Roughness Map Prompt', body: 'Generate an image prompt for a grayscale roughness/metallic map based on the details in: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-creature-concept',
    name: 'Creature Concept Forge',
    description: 'Anatomy to skin/fur to action pose.',
    tags: ['image', 'fantasy'],
    steps: [
      { title: 'Anatomy Study', body: 'Describe the skeletal and muscular structure of a creature that combines {{animal1}} and {{animal2}}.', piped: false },
      { title: 'Skin/Detail Prompt', body: 'Generate an image prompt showing the skin, scales, or fur texture for the creature described in: {{LAST_RESULT}}.', piped: true },
      { title: 'Action Pose Prompt', body: 'Generate a full-body action pose image prompt for this creature in its natural habitat. CONTEXT: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-fashion-runway',
    name: 'Fashion Sketch to Runway',
    description: 'Fabric/cut to sketch to model mockup.',
    tags: ['image', 'fashion'],
    steps: [
      { title: 'Design Sketch Prompt', body: 'Generate an image prompt for a avant-garde fashion sketch of a {{article_type}} made of {{fabric}}.', piped: false },
      { title: 'Fabric Detail Prompt', body: 'Generate a macro photography image prompt showing the weave and texture of: {{fabric}}.', piped: false },
      { title: 'Runway Model Prompt', body: 'Generate a high-fashion runway photography prompt showing a model wearing the design from {{results[0]}}.', piped: false }
    ]
  },
  {
    id: 'chain-book-cover',
    name: 'Book Cover Journey',
    description: 'Summary to metaphor to layout to mockup.',
    tags: ['image', 'creative'],
    steps: [
      { title: 'Visual Metaphor', body: 'Identify a striking visual metaphor for a {{genre}} book titled "{{title}}" about {{summary}}.', piped: false },
      { title: 'Cover Layout Prompt', body: 'Generate an image prompt for a book cover layout centering on the metaphor: {{LAST_RESULT}}. Include space for typography.', piped: true },
      { title: 'Wrap Mockup Prompt', body: 'Generate a high-resolution 3D book mockup showing the cover from {{LAST_RESULT}} on a physical book.', piped: true }
    ]
  },
  {
    id: 'chain-ui-blueprint',
    name: 'App UI Blueprint',
    description: 'Workflow to wireframe to high-fi mock.',
    tags: ['image', 'design'],
    steps: [
      { title: 'Wireframe Prompt', body: 'Generate an image prompt for a minimalist gray-scale wireframe of a {{app_type}} screen doing {{user_flow}}.', piped: false },
      { title: 'High-Fi Mock Prompt', body: 'Generate a high-fidelity glassmorphic UI mockup based on the wireframe layout from: {{LAST_RESULT}}.', piped: true },
      { title: 'Design System Prompt', body: 'Generate an image prompt showing a UI component kit (buttons, cards, inputs) based on the style from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-film-poster',
    name: 'Film Poster Reel',
    description: 'Tagline to keyart to color script to billing.',
    tags: ['image', 'creative'],
    steps: [
      { title: 'Keyart Prompt', body: 'Generate an image prompt for a cinematic keyart poster for a film titled "{{title}}" with the tagline: "{{tagline}}".', piped: false },
      { title: 'Color Script Prompt', body: 'Generate an image prompt showing the color palette and mood board for this keyart: {{LAST_RESULT}}.', piped: true },
      { title: 'Final Poster Prompt', body: 'Generate a final film poster prompt including a billing block and refined lighting based on: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-vehicle-interior',
    name: 'Vehicle Interior Forge',
    description: 'Vehicle type to chassis to dashboard to POV.',
    tags: ['image', 'sci-fi'],
    steps: [
      { title: 'Interior Layout', body: 'Describe the dashboard and seating layout for a futuristic {{vehicle_type}} that uses {{tech_type}}.', piped: false },
      { title: 'Dashboard Prompt', body: 'Generate an image prompt for the cockpit/dashboard of this vehicle. Include {{LAST_RESULT}}.', piped: true },
      { title: 'POV View Prompt', body: 'Generate a POV image prompt from the pilot seat looking out over an alien landscape. CONTEXT: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-magic-artifact',
    name: 'Magic Item Artifact',
    description: 'Lore to shape to VFX to shop card.',
    tags: ['image', 'fantasy'],
    steps: [
      { title: 'Artifact Shape', body: 'Describe the physical shape and material of the "{{item_name}}", an artifact from {{lore_origin}}.', piped: false },
      { title: 'VFX Glow Prompt', body: 'Generate an image prompt for the artifact from {{LAST_RESULT}} emitting a {{glow_color}} magical pulse.', piped: true },
      { title: 'Shop Entry Prompt', body: 'Generate an image prompt for a "Magic Item Catalog" card featuring the item from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-cyber-city',
    name: 'Cyberpunk District Forge',
    description: 'Function to block layout to neon detail.',
    tags: ['image', 'cyberpunk'],
    steps: [
      { title: 'District Block Prompt', body: 'Generate an image prompt for the architectural block layout of a {{district_type}} in a cyberpunk megacity.', piped: false },
      { title: 'Neon Detail Prompt', body: 'Generate a wide-angle image prompt with heavy neon signage and verticality for: {{LAST_RESULT}}.', piped: true },
      { title: 'POV Alleyway Prompt', body: 'Generate a gritty, rainy street-level pov image prompt for this district. CONTEXT: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-npc-grid',
    name: 'NPC Expression Grid',
    description: 'Base character to emotion sets to 9-grid.',
    tags: ['image', 'character-design'],
    steps: [
      { title: 'Base NPC Prompt', body: 'Generate an image prompt for a high-detail portrait of a {{race}} {{job}} with a neutral expression.', piped: false },
      { title: 'Emotion Sheet Prompt', body: 'Generate an image prompt for a 3x3 expression grid of the character from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-tilemap-engine',
    name: 'Game Level Tilemap',
    description: 'Biome to core tiles to decals to level preview.',
    tags: ['image', 'gamedev'],
    steps: [
      { title: 'Core Tile Set Prompt', body: 'Generate an image prompt for a 16x16 grid of seamless environment tiles for a {{biome}} world.', piped: false },
      { title: 'Level Preview Prompt', body: 'Generate a high-detail isometric game level preview using the style and tiles from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-cinematography-key',
    name: 'Storyboard to Cinematography',
    description: 'Script to pencil board to lighting key.',
    tags: ['image', 'creative'],
    steps: [
      { title: 'Pencil Layout Prompt', body: 'Generate an image prompt for a rough pencil storyboard for the scene: {{script_line}}.', piped: false },
      { title: 'Lighting Key Prompt', body: 'Generate an image prompt for a high-contrast lighting key of this layout. COLOR: {{mood_color}}.', piped: true }
    ]
  },
  {
    id: 'chain-package-design',
    name: 'Product Package Design',
    description: 'Product to logo/label to 3D mock.',
    tags: ['image', 'design'],
    steps: [
      { title: 'Label Design Prompt', body: 'Generate an image prompt for a flat vector label for a {{product_type}} following a {{style}} aesthetic.', piped: false },
      { title: 'Package Mockup Prompt', body: 'Generate a high-res 3D package design mockup for {{product_type}} using the label from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-mythical-sword',
    name: 'Mythical Sword Forge',
    description: 'Steel/hilt to blade profile to engraving.',
    tags: ['image', 'fantasy'],
    steps: [
      { title: 'Blade Profile Prompt', body: 'Generate an image prompt for a unique blade profile of a legendary sword forged from {{material}}.', piped: false },
      { title: 'Hilt Detail Prompt', body: 'Generate an image prompt for the ornate hilt and pommel of the sword from: {{LAST_RESULT}}.', piped: true },
      { title: 'Sheathed View Prompt', body: 'Generate an image prompt showing the full sword from {{LAST_RESULT}} in its scabbard.', piped: true }
    ]
  },
  {
    id: 'chain-abstract-series',
    name: 'Abstract Emotion Series',
    description: 'Emotion seed to symmetry to depth.',
    tags: ['image', 'art'],
    steps: [
      { title: 'Composition Rough Prompt', body: 'Generate an image prompt for a core abstract composition representing the emotion: {{emotion}}.', piped: false },
      { title: 'Texture Pass Prompt', body: 'Generate a high-detail texture and depth pass for the abstract from: {{LAST_RESULT}}.', piped: true }
    ]
  },
  {
    id: 'chain-history-reimagine',
    name: 'Historical Reimagining',
    description: 'Event to figure to context to style.',
    tags: ['image', 'history'],
    steps: [
      { title: 'Historical Figure Prompt', body: 'Generate a photorealistic portrait prompt for {{historical_figure}} in their prime.', piped: false },
      { title: 'Era Painting Prompt', body: 'Generate a digital oil painting prompt of the figure from {{LAST_RESULT}} during {{event}}.', piped: true }
    ]
  }
];
