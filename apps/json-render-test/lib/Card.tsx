import { type BaseComponentProps } from "@json-render/react";
import { type ShadcnProps } from "@json-render/shadcn";

type CardProps = ShadcnProps<"Card">;

export function Card({ props, children }: BaseComponentProps<CardProps>) {
  const maxWidthClass =
    props.maxWidth === "sm"
      ? "max-w-xs sm:min-w-[280px]"
      : props.maxWidth === "md"
        ? "max-w-sm sm:min-w-[320px]"
        : props.maxWidth === "lg"
          ? "max-w-md sm:min-w-[360px]"
          : "w-full";

  const centeredClass = props.centered ? "mx-auto" : "";

  return (
    <div
      className={[
        "rounded-xl border border-gray-200 bg-white shadow-sm p-6",
        maxWidthClass,
        centeredClass,
        props.className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {(props.title || props.description) && (
        <div className="mb-4">
          {props.title && (
            <h3 className="text-lg font-semibold text-gray-900">{props.title}</h3>
          )}
          {props.description && (
            <p className="text-sm text-gray-500 mt-1">{props.description}</p>
          )}
        </div>
      )}
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}