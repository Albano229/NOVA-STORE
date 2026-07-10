"use client";

export default function CartLoading() {
  return (
    <div className="mx-auto w-full max-w-2xl p-4 sm:p-8">
      <div className="mb-8 h-8 w-40 animate-pulse rounded bg-gray-200" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="mb-4 flex gap-4 rounded-xl bg-gray-50 p-4 animate-pulse dark:bg-gray-800"
        >
          <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-200 sm:h-20 sm:w-20" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-4 w-3/5 rounded bg-gray-200" />
            <div className="h-3 w-2/5 rounded bg-gray-200" />
            <div className="mt-auto h-3 w-24 rounded bg-[#7126b6]/40" />
          </div>
        </div>
      ))}
    </div>
  );
}
