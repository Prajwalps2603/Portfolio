import { channel, channelForLayer, type Channel } from "@/lib/channels";

/** Channel for an architecture layer; anything unmapped is Σ (the shipped system). */
export function layerChannel(layer: string): Channel {
  return channelForLayer(layer) ?? channel("sigma");
}

/** Layer name of a scope channel (1 to 4). */
export const LAYER_OF_CHANNEL: Record<1 | 2 | 3 | 4, string> = {
  1: "Interface",
  2: "Services",
  3: "Data",
  4: "Intelligence",
};
