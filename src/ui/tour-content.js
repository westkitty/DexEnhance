export const TOUR_VERSION = '2026-03-04-tour-v1';

export const TOUR_STEPS = [
  {
    id: 'anchor',
    title: 'Quick Action Is Your Anchor',
    description:
      'DexEnhance starts minimized by design. Use the Quick Action button in the bottom-right to open the central Quick Hub and reveal additional windows only when needed.',
    example:
      'Example: Click Quick Action, open Side Panel for folder work, then close it again to return to a clean page.',
    accent: 'linear-gradient(135deg, rgba(40,122,255,0.24), rgba(19,170,255,0.2))',
  },
  {
    id: 'folders',
    title: 'Organize Chats with Smart Folders',
    description:
      'Use folders to group conversations by project, client, or outcome. Assign the current chat instantly and keep context tidy across ChatGPT and Gemini.',
    example:
      'Example: Create folders "Hiring", "Q2 Launch", and "Support Escalations". Assign each active thread as you work to avoid context drift.',
    accent: 'linear-gradient(135deg, rgba(40,122,255,0.2), rgba(31,207,178,0.24))',
  },
  {
    id: 'queue',
    title: 'Queue Messages While the Model Is Busy',
    description:
      'If the assistant is generating, DexEnhance queues your next messages and sends them automatically in order once generation ends.',
    example:
      'Example: While response 1 is generating, draft prompt 2 and prompt 3. DexEnhance sends both in sequence without losing momentum.',
    accent: 'linear-gradient(135deg, rgba(19,170,255,0.2), rgba(14,101,217,0.22))',
  },
  {
    id: 'prompts',
    title: 'Prompt Library with Variables',
    description:
      'Store reusable prompts and insert them instantly. Use {{variables}} to customize prompts at insert time without rewriting templates.',
    example:
      'Example: "Write a launch plan for {{product}} targeting {{audience}}" becomes reusable for every project in seconds.',
    accent: 'linear-gradient(135deg, rgba(40,122,255,0.22), rgba(28,82,177,0.18))',
  },
  {
    id: 'export',
    title: 'Export Threads to PDF or DOCX',
    description:
      'Capture conversations into shareable artifacts for docs, reports, and decision logs. Keep your AI output portable.',
    example:
      'Example: Export a design debate to DOCX and attach it to your team RFC with clear user/assistant turn history.',
    accent: 'linear-gradient(135deg, rgba(19,170,255,0.2), rgba(0,135,206,0.2))',
  },
  {
    id: 'tokens',
    title: 'Live Token and Model Overlay',
    description:
      'See model and token metadata in-context so you can monitor cost signals and compare response behavior between providers.',
    example:
      'Example: Validate that a high-cost prompt actually improved output quality before adopting it in your workflow.',
    accent: 'linear-gradient(135deg, rgba(31,207,178,0.22), rgba(19,170,255,0.18))',
  },
  {
    id: 'cross-site',
    title: 'Cross-Site State, One Workflow',
    description:
      'Folders and prompt assets follow you across supported sites through service-worker-managed local storage.',
    example:
      'Example: Save prompts in ChatGPT, switch to Gemini, and continue with the same prompt toolkit immediately.',
    accent: 'linear-gradient(135deg, rgba(40,122,255,0.18), rgba(31,207,178,0.22))',
  },
];
