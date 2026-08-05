// src/components/icons.jsx
//
// One icon family for the whole screen: lucide-react at stroke-width 1.9 with the
// library's default round caps/joins. The only non-hairline marks are the cart
// (brand) and the checkbox checkmark, which are heavier by design.

import {
  Search,
  ListPlus,
  RefreshCw,
  MoreHorizontal,
  MoreVertical,
  Pin,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Plus,
  ShoppingCart,
} from "lucide-react";
import { tokens } from "../theme/tokens";

const STROKE = 1.9;

// Wrap a lucide icon so every instance shares stroke 1.9 (scaled to size, lucide default).
const wrap = (LucideIcon) =>
  function WrappedIcon({ size = 18, strokeWidth = STROKE, ...rest }) {
    return <LucideIcon size={size} strokeWidth={strokeWidth} {...rest} />;
  };

export const SearchIcon = wrap(Search);
export const AddSectionIcon = wrap(ListPlus);
export const ResetIcon = wrap(RefreshCw);
export const MoreIcon = wrap(MoreHorizontal);
export const MoreVerticalIcon = wrap(MoreVertical);
export const PinIcon = wrap(Pin);
export const EditIcon = wrap(Pencil);
export const DeleteIcon = wrap(Trash2);
export const MoveUpIcon = wrap(ChevronUp);
export const MoveDownIcon = wrap(ChevronDown);
export const PlusIcon = wrap(Plus);

// Brand cart — slightly heavier stroke, sits white inside the accent square.
export function CartIcon({ size = 15, color = "#fff" }) {
  return <ShoppingCart size={size} strokeWidth={2} color={color} />;
}

// 2x3 grid of dots for the drag handle (custom — lucide has no matching mark).
export function DragDots({ color = tokens.color.dragDot }) {
  const cols = [1.25, 6.25];
  const rows = [1.25, 6.25, 11.25];
  return (
    <svg width="8" height="13" viewBox="0 0 8 13" aria-hidden="true" focusable="false">
      {rows.flatMap((cy) =>
        cols.map((cx) => (
          <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.25" fill={color} />
        ))
      )}
    </svg>
  );
}

// White checkmark inside the checkbox — one of the two allowed heavier marks.
export function CheckmarkIcon({ size = 12, color = "#fff" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M5 12.5l4.5 4.5L19 7"
        stroke={color}
        strokeWidth="3.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
