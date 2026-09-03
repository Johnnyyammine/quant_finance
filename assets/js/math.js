/* Renders every \(...\) and \[...\] on the page with the vendored KaTeX.
   Fully offline: fonts and JS live in assets/vendor/katex/. */
(function () {
  'use strict';

  function run(root) {
    if (!window.renderMathInElement) return;
    window.renderMathInElement(root || document.body, {
      delimiters: [
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false },
      ],
      throwOnError: false,
      errorColor: getComputedStyle(document.documentElement).getPropertyValue('--neg').trim() || '#e0655f',
      strict: false,
      trust: false,
      macros: {
        '\\E': '\\mathbb{E}',
        '\\Var': '\\operatorname{Var}',
        '\\Cov': '\\operatorname{Cov}',
        '\\Corr': '\\operatorname{Corr}',
        '\\P': '\\mathbb{P}',
        // The risk-neutral measure. Content used \Q from the start; without it
        // declared here KaTeX rendered the literal text "\Q" in errorColor --
        // twenty red control sequences across four concept pages, and nothing
        // in the build noticed because the failure happens at render time.
        '\\Q': '\\mathbb{Q}',
        '\\R': '\\mathbb{R}',
        '\\d': '\\mathrm{d}',
        '\\1': '\\mathbf{1}',
        '\\argmin': '\\operatorname*{arg\\,min}',
        '\\argmax': '\\operatorname*{arg\\,max}',
      },
    });
  }

  function boot() {
    run(document.body);
    // Interactive modules and drill cards inject maths after first paint.
    window.KBMath = { render: run };
    document.addEventListener('kb:content', function (e) { run(e.detail || document.body); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
