"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mic,
  Languages,
  FileText,
  Image as ImageIcon,
  Cpu,
  Sparkles,
} from "lucide-react";
import { useAiSettings, useSaveAiSettings } from "@/lib/hooks/useAiSettings";
import type {
  AiClassProvider,
  AiIdProvider,
  AiSettings,
} from "@/lib/api/aiSettings";

// Built-in text-processing task types are hidden from the per-task selectors,
// matching the upstream admin component.
const BUILTIN_TEXT_PROCESSING_TASK_TYPES = new Set([
  "OCP\\TextProcessing\\FreePromptTaskType",
  "OCP\\TextProcessing\\HeadlineTaskType",
  "OCP\\TextProcessing\\SummaryTaskType",
  "OCP\\TextProcessing\\TopicsTaskType",
]);

function NoProviders({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

export default function AdminAIPage() {
  const { data, isLoading } = useAiSettings();
  const save = useSaveAiSettings();

  if (isLoading || !data) {
    return (
      <div className="space-y-6 max-w-3xl">
        <Header />
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-72" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-9 w-full max-w-sm" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const everythingEmpty =
    data.sttProviders.length === 0 &&
    data.translationProviders.length === 0 &&
    data.textProcessingProviders.length === 0 &&
    data.text2imageProviders.length === 0 &&
    data.taskProcessingProviders.length === 0 &&
    data.taskProcessingTaskTypes.length === 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <Header />

      {everythingEmpty && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              No AI providers installed
            </CardTitle>
            <CardDescription>
              None of your currently installed apps provide AI functionality.
              Install an AI provider app to configure speech-to-text,
              translation, text processing, image generation, or task
              processing here.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <TaskProcessingCard data={data} save={save.mutate} disabled={save.isPending} />
      <TranslationCard data={data} />
      <Text2ImageCard data={data} save={save.mutate} disabled={save.isPending} />
      <TextProcessingCard data={data} save={save.mutate} disabled={save.isPending} />
      <SpeechToTextCard data={data} save={save.mutate} disabled={save.isPending} />
    </div>
  );
}

function Header() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Artificial intelligence</h1>
      <p className="text-muted-foreground text-sm">
        AI tasks can be implemented by different apps. Pick which provider
        handles each capability.
      </p>
    </div>
  );
}

type SaveFn = ReturnType<typeof useSaveAiSettings>["mutate"];

// ── Unified task processing ───────────────────────────────────────────────────

function TaskProcessingCard({
  data,
  save,
  disabled,
}: {
  data: AiSettings;
  save: SaveFn;
  disabled: boolean;
}) {
  const prefs = data.settings["ai.taskprocessing_provider_preferences"];
  const hasTaskProcessing =
    Object.keys(prefs).length > 0 && data.taskProcessingTaskTypes.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Cpu className="h-4 w-4" />
          Unified task processing
        </CardTitle>
        <CardDescription>
          Set which app should be used for which task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {!hasTaskProcessing ? (
          <NoProviders>
            None of your currently installed apps provide task processing
            functionality.
          </NoProviders>
        ) : (
          data.taskProcessingTaskTypes.map((type) => {
            const options = data.taskProcessingProviders.filter(
              (p) => p.taskType === type.id
            );
            if (options.length === 0) return null;
            return (
              <ProviderRow
                key={type.id}
                name={type.name}
                description={type.description}
                value={prefs[type.id]}
                options={options.map((p) => ({ value: p.id, label: p.name }))}
                disabled={disabled}
                onChange={(value) =>
                  save({
                    "ai.taskprocessing_provider_preferences": {
                      ...prefs,
                      [type.id]: value,
                    },
                  })
                }
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ── Machine translation ───────────────────────────────────────────────────────

function TranslationCard({ data }: { data: AiSettings }) {
  const order = data.settings["ai.translation_provider_preferences"];
  const providers = data.translationProviders;

  function nameFor(cls: string): string {
    return providers.find((p) => p.class === cls)?.name ?? cls;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Languages className="h-4 w-4" />
          Machine translation
        </CardTitle>
        <CardDescription>
          The precedence of the installed machine translation apps. The first
          available provider is used.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <NoProviders>
            None of your currently installed apps provide machine translation
            functionality.
          </NoProviders>
        ) : (
          <ol className="space-y-2">
            {order.map((cls, i) => (
              <li
                key={cls}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium">
                  {i + 1}
                </span>
                <span className="truncate">{nameFor(cls)}</span>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

// ── Image generation ───────────────────────────────────────────────────────────

function Text2ImageCard({
  data,
  save,
  disabled,
}: {
  data: AiSettings;
  save: SaveFn;
  disabled: boolean;
}) {
  const providers: AiIdProvider[] = data.text2imageProviders;
  const value = data.settings["ai.text2image_provider"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ImageIcon className="h-4 w-4" />
          Image generation
        </CardTitle>
        <CardDescription>
          Set which app should be used for image generation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <NoProviders>
            None of your currently installed apps provide image generation
            functionality.
          </NoProviders>
        ) : (
          <Select
            value={value ?? undefined}
            disabled={disabled}
            onValueChange={(v) => save({ "ai.text2image_provider": v })}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}

// ── Text processing ────────────────────────────────────────────────────────────

function TextProcessingCard({
  data,
  save,
  disabled,
}: {
  data: AiSettings;
  save: SaveFn;
  disabled: boolean;
}) {
  const prefs = data.settings["ai.textprocessing_provider_preferences"];
  const taskTypeFor = (cls: string) =>
    data.textProcessingTaskTypes.find((t) => t.class === cls);

  const taskTypes = Object.keys(prefs)
    .filter((cls) => !!taskTypeFor(cls))
    .filter((cls) => !BUILTIN_TEXT_PROCESSING_TASK_TYPES.has(cls));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4" />
          Text processing
        </CardTitle>
        <CardDescription>
          Set which app should be used for which text processing task.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {taskTypes.length === 0 ? (
          <NoProviders>
            None of your currently installed apps provide text processing
            functionality using the Text Processing API.
          </NoProviders>
        ) : (
          taskTypes.map((cls) => {
            const type = taskTypeFor(cls)!;
            const options: AiClassProvider[] = data.textProcessingProviders.filter(
              (p) => p.taskType === cls
            );
            if (options.length === 0) return null;
            return (
              <ProviderRow
                key={cls}
                name={type.name}
                description={type.description}
                value={prefs[cls]}
                options={options.map((p) => ({ value: p.class, label: p.name }))}
                disabled={disabled}
                onChange={(value) =>
                  save({
                    "ai.textprocessing_provider_preferences": {
                      ...prefs,
                      [cls]: value,
                    },
                  })
                }
              />
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

// ── Speech to text ─────────────────────────────────────────────────────────────

function SpeechToTextCard({
  data,
  save,
  disabled,
}: {
  data: AiSettings;
  save: SaveFn;
  disabled: boolean;
}) {
  const providers = data.sttProviders;
  const value = data.settings["ai.stt_provider"];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Mic className="h-4 w-4" />
          Speech-to-text
        </CardTitle>
        <CardDescription>
          Set which app should be used for speech-to-text transcription.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {providers.length === 0 ? (
          <NoProviders>
            None of your currently installed apps provide speech-to-text
            functionality.
          </NoProviders>
        ) : (
          <Select
            value={value ?? undefined}
            disabled={disabled}
            onValueChange={(v) => save({ "ai.stt_provider": v })}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Select a provider" />
            </SelectTrigger>
            <SelectContent>
              {providers.map((p) => (
                <SelectItem key={p.class} value={p.class}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardContent>
    </Card>
  );
}

// ── Shared per-task-type selector row ──────────────────────────────────────────

function ProviderRow({
  name,
  description,
  value,
  options,
  disabled,
  onChange,
}: {
  name: string;
  description: string;
  value: string | undefined;
  options: { value: string; label: string }[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium">{name}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <Select
        value={value ?? undefined}
        disabled={disabled}
        onValueChange={onChange}
      >
        <SelectTrigger className="max-w-sm">
          <SelectValue placeholder="Select a provider" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
