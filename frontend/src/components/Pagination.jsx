import React from "react";

export function Pagination({ page, totalPages, setPage }) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button 
        disabled={page <= 1} 
        onClick={() => setPage((p) => Math.max(1, p - 1))}
      >
        Previous
      </button>
      <span>Page {page} of {totalPages}</span>
      <button 
        disabled={page >= totalPages} 
        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
      >
        Next
      </button>
    </div>
  );
}
