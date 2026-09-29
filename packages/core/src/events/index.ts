import { z } from "zod";
import type { Symbol, Timestamp } from "../types";

/**
 * Event types for AI Research Panel → Mechanics Canvas communication
 */
export const CanvasEventSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("highlight-time-range"),
    start: z.string().datetime(),
    end: z.string().datetime(),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("highlight-point"),
    timestamp: z.string().datetime(),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("set-comparison"),
    symbol: z.string(),
    comparisonSymbol: z.string().optional(),
  }),
  z.object({
    type: z.literal("set-view"),
    view: z.literal("price"),
  }),
  z.object({
    type: z.literal("clear-highlight"),
  }),
  z.object({
    type: z.literal("set-time-range"),
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
]);

export type CanvasEvent = z.infer<typeof CanvasEventSchema>;

/**
 * Research Panel → Canvas event creators
 */
export function createHighlightTimeRange(
  start: Timestamp,
  end: Timestamp,
  reason: string
): CanvasEvent {
  return {
    type: "highlight-time-range",
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
    reason,
  };
}

export function createHighlightPoint(timestamp: Timestamp, reason: string): CanvasEvent {
  return {
    type: "highlight-point",
    timestamp: new Date(timestamp * 1000).toISOString(),
    reason,
  };
}

export function createSetComparison(symbol: Symbol, comparisonSymbol?: Symbol): CanvasEvent {
  return {
    type: "set-comparison",
    symbol,
    comparisonSymbol,
  };
}

export function createSetView(
  view: "price"
): CanvasEvent {
  return { type: "set-view", view };
}

export function createClearHighlight(): CanvasEvent {
  return { type: "clear-highlight" };
}

export function createSetTimeRange(start: Timestamp, end: Timestamp): CanvasEvent {
  return {
    type: "set-time-range",
    start: new Date(start * 1000).toISOString(),
    end: new Date(end * 1000).toISOString(),
  };
}

/**
 * Canvas → Research Panel events (user interactions)
 */
export const CanvasInteractionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("time-range-selected"),
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  z.object({
    type: z.literal("point-hovered"),
    timestamp: z.string().datetime(),
    data: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("symbol-changed"),
    symbol: z.string(),
  }),
  z.object({
    type: z.literal("view-changed"),
    view: z.literal("price"),
  }),
]);

export type CanvasInteraction = z.infer<typeof CanvasInteractionSchema>;

/**
 * AI Research Panel message types
 */
export const ResearchMessageSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("question"),
    text: z.string(),
    timestamp: z.string().datetime(),
  }),
  z.object({
    type: z.literal("answer"),
    text: z.string(),
    sources: z.array(z.object({
      endpoint: z.string(),
      timestamp: z.string().datetime(),
      data: z.unknown(),
    })),
    canvasEvents: z.array(CanvasEventSchema).optional(),
    timestamp: z.string().datetime(),
  }),
  z.object({
    type: z.literal("error"),
    message: z.string(),
    timestamp: z.string().datetime(),
  }),
]);

export type ResearchMessage = z.infer<typeof ResearchMessageSchema>;

export function createResearchQuestion(text: string): ResearchMessage {
  return {
    type: "question",
    text,
    timestamp: new Date().toISOString(),
  };
}

export interface ResearchSource {
  endpoint: string;
  timestamp: string;
  data?: unknown;
};

export function createResearchAnswer(
  text: string,
  sources: ResearchSource[],
  canvasEvents?: CanvasEvent[]
): ResearchMessage {
  return {
    type: "answer",
    text,
    sources,
    canvasEvents,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Event bus type for decoupled communication
 */
export type EventHandler<T> = (event: T) => void;

export class TypedEventBus<T extends { type: string }> {
  private handlers = new Map<string, Set<EventHandler<T>>>();

  on(eventType: T["type"], handler: EventHandler<T>): () => void {
    const set = this.handlers.get(eventType) ?? new Set();
    set.add(handler as EventHandler<T>);
    this.handlers.set(eventType, set);
    return () => this.off(eventType, handler);
  }

  off(eventType: T["type"], handler: EventHandler<T>): void {
    this.handlers.get(eventType)?.delete(handler);
  }

  emit(event: T): void {
    this.handlers.get(event.type)?.forEach(h => h(event));
  }

  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Global event bus instances
 */
export const canvasEventBus = new TypedEventBus<CanvasEvent>();
export const canvasInteractionBus = new TypedEventBus<CanvasInteraction>();
export const researchMessageBus = new TypedEventBus<ResearchMessage>();
