"use client";

import { useState, useCallback } from "react";
import { createSpecStreamCompiler } from "@json-render/core";
import type { Spec } from "@json-render/core";

interface UseUIStreamOptions {
  api: string;
}

interface UseUIStreamResult {
  spec: Spec | null;
  isStreaming: boolean;
  send: (prompt: string, dataMeta?: string) => Promise<void>;
  error: string | null;
}

export function useUIStream({ api }: UseUIStreamOptions): UseUIStreamResult {
  const [spec, setSpec] = useState<Spec | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(
    async (prompt: string, dataMeta?: string) => {
      setIsStreaming(true);
      setError(null);
      setSpec(null);

      const compiler = createSpecStreamCompiler<Spec>();

      try {
        const response = await fetch(api, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, dataMeta }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const { result } = compiler.push(chunk);
          setSpec(result);
        }

        const finalResult = compiler.getResult();
        setSpec(finalResult);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsStreaming(false);
      }
    },
    [api]
  );

  return { spec, isStreaming, send, error };
}