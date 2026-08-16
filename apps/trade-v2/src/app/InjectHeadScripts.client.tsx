'use client';

import { useServerInsertedHTML } from 'next/navigation';

interface InjectHeadScriptsProps {
  bootstrapScript: string;
  jsonLdPayloads: ReadonlyArray<{ id: string; payload: unknown }>;
}

// Emits inline scripts into the SSR HTML stream outside of React's reconciliation.
// Avoids the React 19 "Encountered a script tag while rendering" warning that
// occurs when <script> elements are rendered as JSX in client-side trees.
export function InjectHeadScripts({
  bootstrapScript,
  jsonLdPayloads,
}: InjectHeadScriptsProps) {
  useServerInsertedHTML(() => (
    <>
      <script dangerouslySetInnerHTML={{ __html: bootstrapScript }} />
      {jsonLdPayloads.map(({ id, payload }) => (
        <script
          key={id}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
        />
      ))}
    </>
  ));

  return null;
}
