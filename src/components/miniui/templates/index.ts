import type { ComponentType } from "react";
import { CalendarTemplate, calendarStamp } from "./calendar";
import { ChatTemplate, chatStamp } from "./chat";
import { EditorTemplate, editorStamp } from "./editor";
import { GenericTemplate, genericStamp } from "./generic";
import { PhoneTemplate, phoneStamp } from "./phone";
import { PipelineTemplate, pipelineStamp } from "./pipeline";
import { ScanTemplate, scanStamp } from "./scan";
import type { TemplateProps } from "./types";

export type TemplateName = "editor" | "chat" | "phone" | "calendar" | "scan" | "pipeline" | "app";

export type TemplateDef = {
  name: TemplateName;
  Component: ComponentType<TemplateProps>;
  /** Where the SHIPPED stamp lands: absolute position classes inside the MiniUI root, or "slot" (the template renders <StampSlot>). */
  stamp: string;
  /** What the picture shows (the MiniUI's accessible description). */
  describe: string;
};

/** Which template draws which project (DIRECTION section 3, "Mini-UI templates"). */
export const TEMPLATES: Record<string, TemplateDef> = {
  resumai: { name: "editor", Component: EditorTemplate, stamp: editorStamp, describe: "a job description beside a live A4 résumé preview" },
  "drone-intelligence": { name: "chat", Component: ChatTemplate, stamp: chatStamp, describe: "a question, the retrieved chunks and an answer with its sources" },
  "audify-ai": { name: "phone", Component: PhoneTemplate, stamp: phoneStamp, describe: "a list of call recordings with one being transcribed, beside the processing pipeline" },
  bookmyvenue: { name: "calendar", Component: CalendarTemplate, stamp: calendarStamp, describe: "a month of booked and free dates and an advance-paid ticket" },
  "brain-tumor-detection": { name: "scan", Component: ScanTemplate, stamp: scanStamp, describe: "an uploaded MRI scan, the CNN and its prediction" },
  "mcp-job-agent": { name: "pipeline", Component: PipelineTemplate, stamp: pipelineStamp, describe: "a job-application run from discovery to the audit log" },
};

export const GENERIC: TemplateDef = { name: "app", Component: GenericTemplate, stamp: genericStamp, describe: "the project's flow, step by step" };

export type { TemplateProps } from "./types";
