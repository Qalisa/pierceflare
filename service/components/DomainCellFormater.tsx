import type { CellContext } from "@tanstack/react-table";

//
export const domainNameFormatter = <T,>({
  getValue,
}: CellContext<T, unknown>) => {
  //
  const domain = getValue() as string;
  const [sub, ...rest] = domain.split(".");

  return (
    <div className="flex items-center justify-start gap-0.5">
      <strong>{sub}</strong>
      <span className="opacity-50">{"." + rest.join(".")}</span>
    </div>
  );
};
