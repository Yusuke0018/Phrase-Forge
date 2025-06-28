import React from 'react';
import { FiPlus } from 'react-icons/fi';

interface FloatingAddButtonProps {
  onClick: () => void;
  ariaLabel?: string;
}

export function FloatingAddButton({ onClick, ariaLabel = '新しいカードを追加' }: FloatingAddButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-40 p-4 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700"
      aria-label={ariaLabel}
    >
      <FiPlus className="w-6 h-6" />
    </button>
  );
}
