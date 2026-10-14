import { useState, type CSSProperties } from 'react';
import Dock from '@/components/Dock';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  Home01Icon,
  UserIcon,
  Notification01Icon,
  Store01Icon,
  AccountSetting02Icon
  
} from '@hugeicons/core-free-icons';

const glyph = (icon: typeof Home01Icon) => (
  <HugeiconsIcon icon={icon} size="1em" strokeWidth={1.8} />
);

const glassStyle = {
  '--dock-panel': 'rgba(255, 255, 255, 0.08)',
  '--dock-panel-edge': 'rgba(255, 255, 255, 0.15)',
  '--dock-panel-highlight': 'rgba(255, 255, 255, 0.2)',
  '--dock-dot': '#0a84ff',
} as CSSProperties;

/** The dock buttons: just icon and label, no selection logic here. */
const baseItems = [
  { icon: glyph(Home01Icon),         label: 'Home' },
  { icon: glyph(UserIcon),           label: 'Profile' },
  { icon: glyph(Notification01Icon), label: 'Notifications' },
  { icon: glyph(Store01Icon),        label: 'Marketplace' },
  { icon: glyph(AccountSetting02Icon), label: 'Settings' },
];

export default function AppDock() {
  const [activeIndex, setActiveIndex] = useState(0);

  const items = baseItems.map((item, index) => ({
    ...item,
    active: index === activeIndex,
    onClick: () => setActiveIndex(index),
  }));

  return (
    <Dock
      items={items}
      baseItemSize={40}
      magnification={62}
      panelHeight={58}
      gap={11}
      roundness={0.35}
      tiles={false}
      style={glassStyle}
    />
  );
}