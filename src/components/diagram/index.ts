/**
 * THE LIVING SYSTEM DIAGRAM ENGINE (the diagram grammar). Client module: load it lazily.
 *
 *   const Diagram = dynamic(() => import("@/components/diagram").then((m) => m.SystemDiagram), { ssr: false });
 *   <Diagram spec={projectDiagram(project)} state="sketch" fit="fill" onStep={setStep} />
 *
 * - spec:     buildSpec() from labels, or projectDiagram(project) from src/content (layers + flow).
 * - geometry: pure layout + routing (lane order, CSS grid plan, edges, packet tracks).
 * - SystemDiagram: the reveal (first time: draw -> compile -> the first request at speed, inking
 *   the route in for good -> journey 1, ~3s; a spec drawn earlier this session: a 0.7s
 *   cross-wipe, the route inks in, no redraw; a click / tap / Enter skips) -> compiled once per
 *   view: the loop moves packets only (an ink pulse on the card each step reaches, each step held
 *   >= 1.7s for the narration); hover / focus / tap-to-pin notes placed where they bury no part;
 *   reduced motion; sketch mode; pauses offscreen, in hidden tabs, while the pointer is over it,
 *   on inspect and with `paused`.
 * - playGate: the shared "on screen and tab visible" gate for every loop. It is dependency-free:
 *   import it from "@/components/diagram/playGate" (not this barrel) so a caller's chunk does not
 *   pull the diagram in.
 */
export { SystemDiagram, hasDrawn, hasShipped, type SystemDiagramProps, type DiagramState, type DiagramPhase } from "./SystemDiagram";
export { buildSpec, stepsAt, neighbours, microFor, type DiagramSpec, type DiagramNode, type DiagramLane, type DiagramEdge, type DiagramStep, type DiagramHop, type PacketKind } from "./spec";
export { projectDiagram, hasArchitecture } from "./projects";
export { orderLanes, layoutLanes, planGrid, routeEdges, chooseOrientation, trackPoint, placeNote, type Orientation, type Box, type Track, type EdgeGeom, type GridPlan, type NoteSize } from "./geometry";
export { gatePlay, usePlayGate, useSeen, inSight, useTabVisible, subscribeTab, isTabHidden, type GateOptions } from "./playGate";
