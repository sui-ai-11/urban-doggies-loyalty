import {
  Star, Heart, Gift, Award, Crown, Trophy, Coffee,
  Scissors, Dog, Cat, Car, BookOpen, Palette, Music, Camera,
  Dumbbell, Diamond, Sparkles, Check, Ticket,
  Zap, Flame, Sun, Moon, Leaf, Store, ShoppingBag, Shirt,
  Watch, Smile, Cake, Wine, Utensils,
  Wrench, Home, Rocket, Badge,
  Gem, Flower, Bike, Brush, Pen, MapPin, Plane, Anchor,
  Pizza, Glasses, Pill
} from 'lucide-react';

export var iconRegistry = {
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

  'gift': { component: Gift, label: 'Gift', category: 'Rewards' },
  'award': { component: Award, label: 'Award', category: 'Rewards' },
  'crown': { component: Crown, label: 'Crown', category: 'Rewards' },
  'trophy': { component: Trophy, label: 'Trophy', category: 'Rewards' },
  'ticket': { component: Ticket, label: 'Ticket', category: 'Rewards' },
  'badge': { component: Badge, label: 'Badge', category: 'Rewards' },

  'coffee': { component: Coffee, label: 'Coffee', category: 'Food & Drink' },
  'pizza': { component: Pizza, label: 'Pizza', category: 'Food & Drink' },
  'cake': { component: Cake, label: 'Cake', category: 'Food & Drink' },
  'wine': { component: Wine, label: 'Wine', category: 'Food & Drink' },
  'utensils': { component: Utensils, label: 'Dining', category: 'Food & Drink' },

  'dog': { component: Dog, label: 'Dog', category: 'Pets' },
  'cat': { component: Cat, label: 'Cat', category: 'Pets' },

  'scissors': { component: Scissors, label: 'Scissors', category: 'Beauty' },
  'brush': { component: Brush, label: 'Brush', category: 'Beauty' },
  'flower': { component: Flower, label: 'Flower', category: 'Beauty' },
  'leaf': { component: Leaf, label: 'Leaf', category: 'Beauty' },

  'dumbbell': { component: Dumbbell, label: 'Fitness', category: 'Fitness' },
  'bike': { component: Bike, label: 'Cycling', category: 'Fitness' },

  'pill': { component: Pill, label: 'Pharmacy', category: 'Professional' },
  'glasses': { component: Glasses, label: 'Optical', category: 'Professional' },
  'book': { component: BookOpen, label: 'Books', category: 'Professional' },
  'pen': { component: Pen, label: 'Writing', category: 'Professional' },
  'palette': { component: Palette, label: 'Art', category: 'Professional' },
  'wrench': { component: Wrench, label: 'Repair', category: 'Professional' },

  'store': { component: Store, label: 'Store', category: 'Lifestyle' },
  'shopping': { component: ShoppingBag, label: 'Shopping', category: 'Lifestyle' },
  'shirt': { component: Shirt, label: 'Fashion', category: 'Lifestyle' },
  'watch': { component: Watch, label: 'Watch', category: 'Lifestyle' },
  'home': { component: Home, label: 'Home', category: 'Lifestyle' },
  'car': { component: Car, label: 'Auto', category: 'Lifestyle' },

  'music': { component: Music, label: 'Music', category: 'Entertainment' },
  'camera': { component: Camera, label: 'Photo', category: 'Entertainment' },
  'map-pin': { component: MapPin, label: 'Location', category: 'Entertainment' },
  'plane': { component: Plane, label: 'Travel', category: 'Entertainment' },
  'anchor': { component: Anchor, label: 'Marine', category: 'Entertainment' },
};

export var iconKeys = Object.keys(iconRegistry);

// Map old emojis to Lucide keys for backward compat
var emojiMap = {
  '✓': 'check', '⭐': 'star', '❤️': 'heart', '✨': 'sparkles',
  '🔥': 'flame', '💎': 'diamond', '🌟': 'star', '😊': 'smile',
  '☀️': 'sun', '🌙': 'moon', '🚀': 'rocket',
  '🎁': 'gift', '🏅': 'award', '👑': 'crown', '🏆': 'trophy',
  '🎫': 'ticket', '🎖️': 'badge', '🎉': 'party',
  '☕': 'coffee', '🍕': 'pizza', '🍰': 'cake', '🎂': 'cake',
  '🍷': 'wine', '🍴': 'utensils', '🍽️': 'utensils',
  '🐕': 'dog', '🐶': 'dog', '🐾': 'dog', '🐱': 'cat', '🐈': 'cat',
  '✂️': 'scissors', '🖌️': 'brush', '🌸': 'flower', '🌺': 'flower',
  '🌿': 'leaf', '🍃': 'leaf', '💐': 'flower',
  '🏋️': 'dumbbell', '💪': 'dumbbell', '🚴': 'bike',
  '💊': 'pill', '👓': 'glasses', '🦷': 'glasses',
  '📚': 'book', '📖': 'book', '✏️': 'pen', '🖊️': 'pen',
  '🎨': 'palette', '🔧': 'wrench', '🛠️': 'wrench',
  '🏪': 'store', '🛍️': 'shopping', '👕': 'shirt', '👗': 'shirt',
  '⌚': 'watch', '🏠': 'home', '🚗': 'car',
  '🎵': 'music', '🎶': 'music', '📷': 'camera', '📸': 'camera',
  '📍': 'map-pin', '✈️': 'plane', '⚓': 'anchor',
  '💰': 'gift', '🎯': 'award', '🎪': 'gift', '🌈': 'sparkles',
  '💝': 'heart', '🦴': 'dog', '👟': 'shirt',
};

export function renderIcon(key, size, color) {
  size = size || 16;
  color = color || 'currentColor';
  if (!key) return null;
  
  // Try direct Lucide key first
  var entry = iconRegistry[key];
  if (entry) {
    var IconComp = entry.component;
    return <IconComp size={size} color={color} />;
  }
  
  // Try emoji-to-Lucide mapping
  var mapped = emojiMap[key];
  if (mapped && iconRegistry[mapped]) {
    var MappedComp = iconRegistry[mapped].component;
    return <MappedComp size={size} color={color} />;
  }
  
  // Final fallback: render as text
  return <span style={{ fontSize: Math.round(size * 0.8) + 'px', lineHeight: 1 }}>{key}</span>;
}
