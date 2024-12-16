'use client';

import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

export function Terminal({ tourId }: { tourId: string }) {
  const [copied, setCopied] = useState(false);
  const terminalSteps = [
    '<link rel="stylesheet" href="https://tour-meli-ai.vercel.app/bundle.css" />',
    `<script defer>
      window.tourMeli = window.tourMeli || {};
      window.tourMeli.scriptUrl = 'https://tour-meli-ai.vercel.app/bundle.min.js';
      window.tourMeli.configUrl = 'https://meli-ai.com/api/tours/${tourId}';

      (function(w, d, s, c) {
        var script = d.createElement('script');
        script.src = s;
        script.async = true;
        script.onload = () => w.initProductTour(c);
        d.head.appendChild(script);
      })(window, document, window.tourMeli.scriptUrl, window.tourMeli.configUrl);
  </script>`,
  ];

  const copyToClipboard = () => {
    navigator.clipboard.writeText(terminalSteps.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full rounded-lg shadow-sm overflow-hidden bg-gray-50 text-white font-mono text-sm relative">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <p className="font-semibold text-sm text-gray-900">
            Add this snippet the head of your application to render the tour
          </p>
          <button
            onClick={copyToClipboard}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Copy to clipboard"
          >
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </button>
        </div>
        <div className="space-y-2 text-gray-900">
          {terminalSteps.map((step, index) => (
            <div
              key={index}
              className="opacity-100 transition-opacity duration-300"
            >
              {step}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
