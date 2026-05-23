import React, { useCallback } from 'react';
import { X } from 'lucide-react';
import { ICON_COMPONENTS, FOLDER_ICONS } from '../utils/folderIcons';

const FOLDER_COLORS = ['#9a9a97', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];

export default function FolderIconPicker({ onSelectIcon, onSelectColor, onRemoveIcon, currentColor, currentIcon }) {
  const accentColor = currentColor || '#9a9a97';

  const IconButton = useCallback(({ iconName }) => {
    const Comp = ICON_COMPONENTS[iconName];
    if (!Comp) return null;
    const isSelected = currentIcon === iconName;
    return (
      <button
        className="w-full aspect-square flex items-center justify-center rounded-lg transition-colors"
        style={{
          background: isSelected ? accentColor + '22' : 'transparent',
          color: isSelected ? accentColor : 'var(--color-text-muted)',
        }}
        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--color-bg-hover)'; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
        onClick={() => onSelectIcon(iconName)}
        title={iconName}
      >
        <Comp size={15} />
      </button>
    );
  }, [currentIcon, accentColor, onSelectIcon]);

  return (
    <div
      className="bg-[var(--color-bg-primary)] border border-[var(--color-border-primary)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      style={{ width: 272 }}
    >
      {/* Color swatches */}
      <div className="px-3 pt-3 pb-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-2">
          Color
        </p>
        <div className="flex items-center gap-2">
          {FOLDER_COLORS.map(color => {
            const isActive = currentColor === color;
            return (
              <button
                key={color}
                className="w-[22px] h-[22px] rounded-full flex-shrink-0"
                style={{
                  background: color,
                  boxShadow: isActive ? `0 0 0 2px var(--color-bg-primary), 0 0 0 3.5px ${color}` : 'none',
                  transform: isActive ? 'scale(1.18)' : 'scale(1)',
                  transition: 'transform 150ms ease, box-shadow 150ms ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1.1)'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.transform = 'scale(1)'; }}
                onClick={() => onSelectColor(color)}
              />
            );
          })}
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-primary)] mx-3" />

      {/* Remove icon */}
      {currentIcon && (
        <div className="px-2 pt-2">
          <button
            className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)] transition-colors"
            style={{ fontSize: 13 }}
            onClick={onRemoveIcon}
          >
            <X size={13} />
            Remove icon
          </button>
        </div>
      )}

      {/* Icon grid — flat, no categories */}
      <div
        className="overflow-y-auto px-2 pt-1.5 pb-2"
        style={{
          maxHeight: 264,
          scrollbarWidth: 'thin',
          scrollbarColor: 'var(--color-border-primary) transparent',
        }}
      >
        <div className="grid gap-0.5" style={{ gridTemplateColumns: 'repeat(8, 1fr)' }}>
          {FOLDER_ICONS.map(iconName => (
            <IconButton key={iconName} iconName={iconName} />
          ))}
        </div>
      </div>
    </div>
  );
}
