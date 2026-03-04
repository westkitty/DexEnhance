import { h } from 'preact';
import { useEffect, useMemo, useState } from 'preact/hooks';
import { TOUR_STEPS } from '../tour-content.js';
import { PanelFrame } from './PanelFrame.jsx';

export function FeatureTourModal({
  visible,
  site,
  iconUrl = '',
  onClose,
  onComplete,
  onOpenPrompts,
  windowState,
  defaultWindowState,
  onWindowStateChange,
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const steps = useMemo(() => TOUR_STEPS, []);
  const step = steps[stepIndex] || steps[0];

  useEffect(() => {
    if (!visible) return;
    setStepIndex(0);
  }, [visible]);

  useEffect(() => {
    if (!visible) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
      if (event.key === 'ArrowRight') {
        setStepIndex((value) => Math.min(value + 1, steps.length - 1));
      }
      if (event.key === 'ArrowLeft') {
        setStepIndex((value) => Math.max(value - 1, 0));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, onClose, steps.length]);

  if (!visible || !step) return null;

  const isLastStep = stepIndex === steps.length - 1;

  return h(
    PanelFrame,
    {
      panelId: 'tour',
      title: `Feature Tour • ${site}`,
      iconUrl,
      panelState: windowState,
      defaultState: defaultWindowState,
      onPanelStateChange: onWindowStateChange,
      onClose,
      minWidth: 560,
      minHeight: 320,
      zIndex: 2147483647,
      showPin: true,
      showClose: true,
      allowResize: true,
    },
    [
      h('div', { class: 'dex-tour__layout' }, [
        h(
          'aside',
          { class: 'dex-tour__steps', 'aria-label': 'Feature tour steps' },
          steps.map((item, index) =>
            h(
              'button',
              {
                key: item.id,
                type: 'button',
                class: `dex-tour__step${index === stepIndex ? ' is-active' : ''}`,
                onClick: () => setStepIndex(index),
              },
              [
                h('span', { class: 'dex-tour__step-index' }, String(index + 1).padStart(2, '0')),
                h('span', { class: 'dex-tour__step-title' }, item.title),
              ]
            )
          )
        ),

        h('div', { class: 'dex-tour__panel' }, [
          h('div', {
            class: 'dex-tour__accent',
            style: `background:${step.accent};`,
          }),
          h('h3', { class: 'dex-tour__title' }, step.title),
          h('p', { class: 'dex-tour__description' }, step.description),
          h('div', { class: 'dex-tour__example-box' }, [
            h('div', { class: 'dex-tour__example-label' }, 'Example'),
            h('p', { class: 'dex-tour__example' }, step.example),
          ]),

          step.id === 'prompts'
            ? h(
                'button',
                {
                  type: 'button',
                  class: 'dex-link-btn dex-tour__cta',
                  onClick: () => onOpenPrompts?.(),
                },
                'Open Prompt Library Now'
              )
            : null,

          h('footer', { class: 'dex-tour__footer' }, [
            h('span', { class: 'dex-tour__progress' }, `Step ${stepIndex + 1} of ${steps.length}`),
            h('div', { class: 'dex-tour__actions' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: 'dex-link-btn',
                  disabled: stepIndex === 0,
                  onClick: () => setStepIndex((value) => Math.max(value - 1, 0)),
                },
                'Back'
              ),
              h(
                'button',
                {
                  type: 'button',
                  class: 'dex-link-btn dex-tour__next',
                  onClick: () => {
                    if (isLastStep) {
                      onComplete?.();
                      return;
                    }
                    setStepIndex((value) => Math.min(value + 1, steps.length - 1));
                  },
                },
                isLastStep ? 'Finish Tour' : 'Next'
              ),
            ]),
          ]),
        ]),
      ]),
    ]
  );
}
