"use client";

import { useState, useRef, useEffect } from "react";
import {
  Renderer,
  StateProvider,
  VisibilityProvider,
  ActionProvider,
  ValidationProvider,
  useUIStream,
} from "@json-render/react";
import { registry } from "@/lib/registry";

interface DataState {
  [key: string]: Record<string, unknown>[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [dataState, setDataState] = useState<DataState>({});
  const [input, setInput] = useState("");
  const { spec, isStreaming, send, error } = useUIStream({ api: "/api/generate" });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dataMetaRef = useRef<string>("");

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, spec]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      setDataState((prev) => ({ ...prev, ...data.state }));
      dataMetaRef.current = dataMetaRef.current
        ? `${dataMetaRef.current}\n\n${data.dataMeta}`
        : data.dataMeta;

      const rowCount = Object.values(data.state as Record<string, unknown[]>)[0]?.length ?? 0;
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `已加载数据文件「${file.name}」，共 ${rowCount} 行。你可以开始提问了。`,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: `文件上传失败: ${err instanceof Error ? err.message : "未知错误"}`,
        },
      ]);
    }

    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    await send(userMessage.content, { dataMeta: dataMetaRef.current });
  };

  return (
    <StateProvider initialState={dataState}>
      <VisibilityProvider>
        <ActionProvider handlers={{}}>
          <ValidationProvider customFunctions={{}}>
            <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
              <header className="flex items-center justify-between border-b bg-white px-6 py-4 dark:bg-gray-900">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  AnyViz
                </h1>
                <div className="flex items-center gap-3">
                  {Object.keys(dataState).length > 0 && (
                    <span className="text-sm text-gray-500">
                      已加载 {Object.keys(dataState).length} 个数据集
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    上传数据
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    className="hidden"
                    onChange={handleUpload}
                  />
                </div>
              </header>

              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messages.length === 0 && !spec && (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                        上传数据，开始提问
                      </h2>
                      <p className="mt-2 text-gray-500">
                        支持 CSV、Excel 文件，自然语言提问即可生成图表
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
                      >
                        上传数据文件
                      </button>
                    </div>
                  </div>
                )}

                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`mb-4 flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white"
                          : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {spec && (
                  <div className="mb-4 flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-white p-4 shadow-sm dark:bg-gray-800">
                      <Renderer
                        spec={spec}
                        registry={registry}
                        loading={isStreaming}
                      />
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 flex justify-start">
                    <div className="max-w-[80%] rounded-2xl bg-red-50 px-4 py-3 text-red-700">
                      出错了: {error.message}
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              <div className="border-t bg-white px-6 py-4 dark:bg-gray-900">
                <form onSubmit={handleSubmit} className="flex gap-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={
                      Object.keys(dataState).length > 0
                        ? "提问关于你的数据..."
                        : "请先上传数据文件"
                    }
                    disabled={isStreaming || Object.keys(dataState).length === 0}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    type="submit"
                    disabled={isStreaming || !input.trim()}
                    className="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isStreaming ? "生成中..." : "发送"}
                  </button>
                </form>
              </div>
            </div>
          </ValidationProvider>
        </ActionProvider>
      </VisibilityProvider>
    </StateProvider>
  );
}