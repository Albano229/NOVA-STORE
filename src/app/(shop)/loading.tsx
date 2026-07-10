"use client";

export default function ShopLoading() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
      <div
        style={{
          width: 40,
          height: 40,
          border: "4px solid #e5e7eb",
          borderTopColor: "#7126b6",
          borderRadius: "50%",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
