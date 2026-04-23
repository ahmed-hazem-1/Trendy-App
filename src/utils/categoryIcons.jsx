import { 
  Globe, 
  HeartPulse, 
  Trophy, 
  Clapperboard, 
  MapPin, 
  Cpu, 
  Moon, 
  ShoppingBag, 
  MoreHorizontal,
  Hash
} from "lucide-react";

const iconMap = {
  'politics': Globe,
  'سياسة': Globe,
  'health': HeartPulse,
  'صحة': HeartPulse,
  'sports': Trophy,
  'رياضة': Trophy,
  'entertainment': Clapperboard,
  'ترفيه': Clapperboard,
  'local': MapPin,
  'محليات': MapPin,
  'technology': Cpu,
  'تكنولوجيا': Cpu,
  'religion': Moon,
  'دين': Moon,
  'fashion': ShoppingBag,
  'موضة': ShoppingBag,
  'other': MoreHorizontal,
  'أخرى': MoreHorizontal,
};

export function getCategoryIcon(slugOrName, className = "h-4 w-4") {
  const IconComponent = iconMap[slugOrName?.toLowerCase()] || Hash;
  return <IconComponent className={className} />;
}
