import {
  Star, Heart, Gift, Award, Crown, Trophy, Coffee, Pizza,
  Scissors, Dog, Cat, Car, BookOpen, Palette, Music, Camera,
  Dumbbell, Flower2, Diamond, Sparkles, Check, Ticket,
  Zap, Flame, Sun, Moon, Leaf, Store, ShoppingBag, Shirt,
  Watch, Smile, Cake, Wine, UtensilsCrossed, ChefHat,
  Stethoscope, Pill, Glasses, Wrench, Home, Rocket, BadgeCheck,
  PartyPopper, HandHeart, Gem, CircleDot, Footprints, Bike,
  IceCream, GlassWater, Baby, Brush, Pen, MapPin, Plane, Anchor
} from 'lucide-react';

// Icon registry: key -> { component, label, category }
export const iconRegistry = {
  // General
  'check': { component: Check, label: 'Checkmark', category: 'General' },
  'star': { component: Star, label: 'Star', category: 'General' },
  'heart': { component: Heart, label: 'Heart', category: 'General' },
  'sparkles': { component: Sparkles, label: 'Sparkles', category: 'General' },
  'flame': { component: Flame, label: 'Flame', category: 'General' },
  'zap': { component: Zap, label: 'Lightning', category: 'General' },
  'diamond': { component: Diamond, label: 'Diamond', category: 'General' },
  'gem': { component: Gem, label: 'Gem', category: 'General' },
  'smile': { component: Smile, label: 'Smile', category: 'General' },
  'sun': { component: Sun, label: 'Sun', category: 'General' },
  'moon': { component: Moon, label: 'Moon', category: 'General' },
  'rocket': { component: Rocket, label: 'Rocket', category: 'General' },
  'circle-dot': { component: CircleDot, label: 'Dot', category: 'General' },

  // Rewards
  'gift': { component: Gift, label: 'Gift', category: 'Rewards' },
  'award': { component: Award, label: 'Award', category: 'Rewards' },
  'crown': { component: Crown, label: 'Crown', category: 'Rewards' },
  'trophy': { component: Trophy, label: 'Trophy', category: 'Rewards' },
  'ticket': { component: Ticket, label: 'Ticket', category: 'Rewards' },
  'badge': { component: BadgeCheck, label: 'Badge', category: 'Rewards' },
  'party': { component: PartyPopper, label: 'Party', category: 'Rewards' },
  'hand-heart': { component: HandHeart, label: 'Care', category: 'Rewards' },

  // Food & Drink
  'coffee': { component: Coffee, label: 'Coffee', category: 'Food & Drink' },
  'pizza': { component: Pizza, label: 'Pizza', category: 'Food & Drink' },
  'cake': { component: Cake, label: 'Cake', category: 'Food & Drink' },
  'wine': { component: Wine, label: 'Wine', category: 'Food & Drink' },
  'utensils': { component: UtensilsCrossed, label: 'Dining', category: 'Food & Drink' },
  'chef': { component: ChefHat, label: 'Chef', category: 'Food & Drink' },
  'ice-cream': { component: IceCream, label: 'Ice Cream', category: 'Food & Drink' },
  'glass': { component: GlassWater, label: 'Drink', category: 'Food & Drink' },

  // Pets
  'paw': { component: Footprints, label: 'Paw', category: 'Pets' },
  'dog': { component: Dog, label: 'Dog', category: 'Pets' },
  'cat': { component: Cat, label: 'Cat', category: 'Pets' },
  'baby': { component: Baby, label: 'Baby', category: 'Pets' },

  // Beauty & Wellness
  'scissors': { component: Scissors, label: 'Scissors', category: 'Beauty' },
  'brush': { component: Brush, label: 'Brush', category: 'Beauty' },
  'flower': { component: Flower2, label: 'Flower', category: 'Beauty' },
  'leaf': { component: Leaf, label: 'Leaf', category: 'Beauty' },

  // Fitness & Sports
  'dumbbell': { component: Dumbbell, label: 'Fitness', category: 'Fitness' },
  'bike': { component: Bike, label: 'Cycling', category: 'Fitness' },

  // Professional
  'stethoscope': { component: Stethoscope, label: 'Medical', category: 'Professional' },
  'pill': { component: Pill, label: 'Pharmacy', category: 'Professional' },
  'glasses': { component: Glasses, label: 'Optical', category: 'Professional' },
  'book': { component: BookOpen, label: 'Books', category: 'Professional' },
  'pen': { component: Pen, label: 'Writing', category: 'Professional' },
  'palette': { component: Palette, label: 'Art', category: 'Professional' },
  'wrench': { component: Wrench, label: 'Repair', category: 'Professional' },

  // Shopping & Lifestyle
  'store': { component: Store, label: 'Store', category: 'Lifestyle' },
  'shopping': { component: ShoppingBag, label: 'Shopping', category: 'Lifestyle' },
  'shirt': { component: Shirt, label: 'Fashion', category: 'Lifestyle' },
  'watch': { component: Watch, label: 'Watch', category: 'Lifestyle' },
  'home': { component: Home, label: 'Home', category: 'Lifestyle' },
  'car': { component: Car, label: 'Auto', category: 'Lifestyle' },

  // Entertainment & Travel
  'music': { component: Music, label: 'Music', category: 'Entertainment' },
  'camera': { component: Camera, label: 'Photo', category: 'Entertainment' },
  'map-pin': { component: MapPin, label: 'Location', category: 'Entertainment' },
  'plane': { component: Plane, label: 'Travel', category: 'Entertainment' },
  'anchor': { component: Anchor, label: 'Marine', category: 'Entertainment' },
};

// Get all icon keys
export const iconKeys = Object.keys(iconRegistry);

// Get categories
export const iconCategories = [...new Set(Object.values(iconRegistry).map(i => i.category))];

// Render icon by key — returns Lucide component or emoji fallback
export function renderIcon(key, size, color) {
  size = size || 16;
  color = color || 'currentColor';
  
  if (!key) return null;
  
  // Check if it's a Lucide key
  var entry = iconRegistry[key];
  if (entry) {
    var IconComp = entry.component;
    return <IconComp size={size} color={color} />;
  }
  
  // Fallback: render as emoji (backward compat)
  return <span style={{ fontSize: size * 0.8 + 'px', lineHeight: 1 }}>{key}</span>;
}
