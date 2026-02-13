import mermaid from 'mermaid';
import { icons as logos } from '@iconify-json/logos';
import { icons as carbon } from '@iconify-json/carbon';
import teleportIcons from "../../data/teleport-icons.json";

mermaid.registerIconPacks([
  // Custom icons loaded from src/mermaid-icons
  {
    name: teleportIcons.prefix,
    icons: teleportIcons,
  },
  // https://icones.js.org/collection/logos
  {
    name: logos.prefix,
    icons: logos,
  },
  // https://icones.js.org/collection/carbon
  {
    name: carbon.prefix,
    icons: carbon,
  },
]);

