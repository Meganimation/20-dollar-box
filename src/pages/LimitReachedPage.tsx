import React from 'react';

export default function LimitReachedPage() {
  return (
    <div>
      {' '}
      limit reached- check again in 20:00 mins 
      <button
      onClick={() => {
          window.location.reload();
      }}
      >
        {' '}
        refresh page
      </button>
    </div>
  );
}
