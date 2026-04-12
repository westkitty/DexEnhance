import { h, render } from 'preact';
import htm from 'htm';

const html = htm.bind(h);

const root = document.getElementById('root');

function renderCode(code) {
  try {
    // We expect the code to be something like:
    // () => html`<div>Hello ${props.name}</div>`
    // Or a set of constants/hooks + a default export or a final expression.
    
    // For simplicity in Wave 7, we take a function string that returns htm
    const runner = new Function('html', 'h', 'hooks', `return (${code})`);
    const Component = runner(html, h, require('preact/hooks'));
    
    render(html`<${Component} />`, root);
  } catch (error) {
    console.error('Sandbox Render Error:', error);
    render(html`<div class="dex-error"><strong>Render Error:</strong><br/>${error.message}</div>`, root);
  }
}

window.addEventListener('message', (event) => {
  if (event.data && typeof event.data.code === 'string') {
    // Clear root before re-render
    root.innerHTML = '';
    renderCode(event.data.code);
  }
});

// Signal that we are ready
window.parent.postMessage({ type: 'SANDBOX_READY' }, '*');
