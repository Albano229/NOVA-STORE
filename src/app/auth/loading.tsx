"use client";

export default function AuthLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-11 w-11 animate-spin rounded-full border-4 border-gray-200 border-t-[#7126b6]" />
        <div className="mx-auto h-4 w-32 animate-pulse rounded bg-gray-200" />
      </div>
    </div>
  );
}
