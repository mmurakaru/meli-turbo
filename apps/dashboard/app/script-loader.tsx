import Script from 'next/script';

export default function ScriptLoader() {
  return (
    <>
      <Script>
        {`
        window.meli = window.meli || {};
        window.meli.url = 'https://meli-tour.vercel.app/bundle.min.js';

        (function(w, d, s, i) {
        var script = d.createElement('script');
        script.src = s;
        script.async = true;
        d.head.appendChild(script);
        })(window, document, window.meli.url);
        `}
      </Script>
    </>
  );
}
