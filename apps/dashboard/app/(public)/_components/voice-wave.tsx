'use client';

import { useEffect, useState } from 'react';

export default function VoiceWave() {
  const [amplitude, setAmplitude] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAmplitude((prev) => (prev + 1) % 5);
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center items-center bg-white">
      <div className="relative flex items-center justify-center gap-1.5">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-full
              transition-all
              duration-300
              ease-in-out
              bg-gradient-to-b
              from-gray-50
              to-purple-500
              shadow-md"
            style={{
              width: '5px',
              height: `${10 + (i === amplitude ? 20 : 0)}px`,
              opacity: 0.4 + i * 0.1,
            }}
          />
        ))}
      </div>
    </div>
  );
}
