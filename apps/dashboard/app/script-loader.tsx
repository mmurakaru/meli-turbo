import Script from 'next/script';

export default function ScriptLoader() {
  return (
    <>
      <link
        rel="stylesheet"
        href="https://tour-meli-ai.vercel.app/bundle.min.css"
      />
      <Script>
        {`
        window.tourMeli = window.tourMeli || {};
        window.tourMeli.scriptUrl = 'https://tour-meli-ai.vercel.app/bundle.min.js'
        window.tourMeli.configUrl = 'https://meli-ai.com/api/tours/1';

        (function(w, d, s, c) {
        var script = d.createElement('script');
        script.src = s;
        script.async = true;
        script.onload = () => w.initProductTour(c);
        d.head.appendChild(script);
        })(window, document, window.tourMeli.scriptUrl, window.tourMeli.configUrl);
        `}
      </Script>
    </>
  );
}
