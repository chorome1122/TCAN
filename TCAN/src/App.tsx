import React, { useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Cat,
  Download,
  Eye,
  Image as ImageIcon,
  PlusCircle,
  Ribbon,
  RotateCcw,
  Scissors,
  Settings,
  Shirt,
  Shuffle,
  Smile,
  Sparkles,
  Upload,
  Waves,
} from "lucide-react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline";
};

function Button({ className = "", variant = "default", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50";
  const style = variant === "outline" ? "border" : "";
  return <button className={`${base} ${style} ${className}`} {...props} />;
}

function Card({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

function CardContent({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={className} {...props} />;
}

type Part = {
  id: string;
  name: string;
  src: string;
};

type PartCategory =
  | "faceBase"
  | "faceLine"
  | "cheek"
  | "eyebrows"
  | "nose"
  | "hairBack"
  | "hairSide"
  | "hairFront"
  | "hairExtension"
  | "hairAhoge"
  | "hairAccessory"
  | "eyes"
  | "mouth"
  | "clothes"
  | "accessory"
  | "hat";

type EditableCategory = PartCategory;
type Selected = Record<PartCategory, Part>;
type PartsMap = Record<PartCategory, Part[]>;
type ImportedPartsMap = Partial<Record<EditableCategory, Part[]>>;
type ColorVariantMap = Partial<Record<EditableCategory, Record<string, Part[]>>>;
type SelectedVariantMap = Partial<Record<EditableCategory, Part>>;
type IconComponent = React.ElementType<{ className?: string }>;

type CategoryChild = {
  key: EditableCategory | "background" | "settings";
  label: string;
  icon: IconComponent;
  disabled?: boolean;
};

type CategoryGroup = {
  key: string;
  label: string;
  icon: IconComponent;
  children: CategoryChild[];
};

const CANVAS_SIZE = 1024;

const makeSvgDataUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
const makeLayerSvg = (content: string) =>
  makeSvgDataUrl(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
      ${content}
    </svg>
  `);

const transparent = makeLayerSvg("");
const nonePart: Part = { id: "none", name: "なし", src: transparent };

const categories: PartCategory[] = [
  "faceBase",
  "faceLine",
  "cheek",
  "eyebrows",
  "nose",
  "hairBack",
  "hairSide",
  "hairFront",
  "hairExtension",
  "hairAhoge",
  "hairAccessory",
  "eyes",
  "mouth",
  "clothes",
  "hat",
  "accessory",
];

const createEmptyParts = (): PartsMap => ({
  faceBase: [nonePart],
  faceLine: [nonePart],
  cheek: [nonePart],
  eyebrows: [nonePart],
  nose: [nonePart],
  hairBack: [nonePart],
  hairSide: [nonePart],
  hairFront: [nonePart],
  hairExtension: [nonePart],
  hairAhoge: [nonePart],
  hairAccessory: [nonePart],
  eyes: [nonePart],
  mouth: [nonePart],
  clothes: [nonePart],
  hat: [nonePart],
  accessory: [nonePart],
});

const imageModules = import.meta.glob("./parts/**/*.{png,jpg,jpeg,webp}", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

function filenameToName(filename: string) {
  return decodeURIComponent(filename)
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]/g, " ");
}

function buildPartsFromFiles(): PartsMap {
  const next = createEmptyParts();

  for (const [path, src] of Object.entries(imageModules)) {
    const match = path.match(/^\.\/parts\/([^/]+)\/(.+)$/);
    if (!match) continue;

    const category = match[1] as PartCategory;
    const filename = match[2];

    if (!categories.includes(category)) continue;

    next[category].push({
      id: `${category}-${filename}`,
      name: filenameToName(filename),
      src,
    });
  }

  return next;
}

const baseParts = buildPartsFromFiles();

const layerOrder: PartCategory[] = [
  "hairBack",
  "hairExtension",
  "clothes",
  "faceBase",
  "faceLine",
  "cheek",
  "eyebrows",
  "nose",
  "hairSide",
  "hairFront",
  "hairAhoge",
  "eyes",
  "mouth",
  "hairAccessory",
  "hat",
  "accessory",
];

const categoryGroups: CategoryGroup[] = [
  {
    key: "hair",
    label: "髪",
    icon: Scissors,
    children: [
      { key: "hairFront", label: "前髪", icon: Scissors },
      { key: "hairBack", label: "後ろ髪", icon: Waves },
      { key: "hairSide", label: "横髪", icon: Scissors },
      { key: "hairExtension", label: "付け髪", icon: PlusCircle },
      { key: "hairAhoge", label: "アホ毛", icon: Sparkles },
      { key: "hairAccessory", label: "髪アクセ", icon: Cat },
    ],
  },
  {
    key: "face",
    label: "顔",
    icon: Smile,
    children: [
      { key: "faceBase", label: "顔", icon: Smile },
      { key: "faceLine", label: "輪郭", icon: Smile },
      { key: "cheek", label: "チーク", icon: Sparkles },
      { key: "eyebrows", label: "眉毛", icon: Eye },
      { key: "nose", label: "鼻", icon: Smile },
      { key: "eyes", label: "目", icon: Eye },
      { key: "mouth", label: "口", icon: Smile },
    ],
  },
  {
    key: "fashion",
    label: "服・小物",
    icon: Shirt,
    children: [
      { key: "clothes", label: "服", icon: Shirt },
      { key: "hat", label: "帽子", icon: Cat },
      { key: "accessory", label: "アクセサリー", icon: Ribbon },
    ],
  },
  {
    key: "other",
    label: "その他",
    icon: Settings,
    children: [
      { key: "background", label: "背景", icon: ImageIcon, disabled: true },
      { key: "settings", label: "全体設定", icon: Settings, disabled: true },
    ],
  },
];

const categoryLabels: Record<EditableCategory, string> = {
  faceBase: "顔",
  faceLine: "輪郭",
  cheek: "チーク",
  eyebrows: "眉毛",
  nose: "鼻",
  hairFront: "前髪",
  hairBack: "後ろ髪",
  hairSide: "横髪",
  hairExtension: "付け髪",
  hairAhoge: "アホ毛",
  hairAccessory: "髪アクセ",
  eyes: "目",
  mouth: "口",
  clothes: "服",
  hat: "帽子",
  accessory: "アクセサリー",
};

const isEditableCategory = (key: CategoryChild["key"]): key is EditableCategory => {
  return key !== "background" && key !== "settings";
};

const supportsColorVariantCategory = (category: EditableCategory) => {
  return ["hairFront", "hairBack", "hairSide", "hairExtension", "hairAhoge", "eyes", "clothes"].includes(category);
};

const makeInitialSelected = (parts: PartsMap): Selected => ({
  faceBase: parts.faceBase[0],
  faceLine: parts.faceLine[0],
  cheek: parts.cheek[0],
  eyebrows: parts.eyebrows[0],
  nose: parts.nose[0],
  hairBack: parts.hairBack[0],
  hairSide: parts.hairSide[0],
  hairFront: parts.hairFront[0],
  hairExtension: parts.hairExtension[0],
  hairAhoge: parts.hairAhoge[0],
  hairAccessory: parts.hairAccessory[0],
  eyes: parts.eyes[0],
  mouth: parts.mouth[0],
  clothes: parts.clothes[0],
  hat: parts.hat[0],
  accessory: parts.accessory[0],
});

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function AvatarLayer({ part }: { part: Part }) {
  if (!part.src || part.id === "none") return null;

  return (
    <img
      src={part.src}
      alt={part.name}
      draggable={false}
      className="absolute inset-0 h-full w-full select-none object-contain"
    />
  );
}

function AvatarPreview({ selected }: { selected: Selected }) {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[min(620px,92vw)] overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-inner">
      <div className="absolute inset-0">
        {layerOrder.map((category) => (
          <AvatarLayer key={`${category}-${selected[category].id}`} part={selected[category]} />
        ))}
      </div>
    </div>
  );
}

export default function PicrewLikeAvatarMaker() {
  const [selected, setSelected] = useState<Selected>(() => makeInitialSelected(baseParts));
  const [activeGroup, setActiveGroup] = useState<string>("hair");
  const [activeCategory, setActiveCategory] = useState<EditableCategory>("hairFront");
  const [importedParts, setImportedParts] = useState<ImportedPartsMap>({});
  const [colorVariants, setColorVariants] = useState<ColorVariantMap>({});
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariantMap>({});
  const [saveMessage, setSaveMessage] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const colorFileInputRef = useRef<HTMLInputElement | null>(null);

  const visibleOptions = useMemo(() => {
    return [...baseParts[activeCategory], ...(importedParts[activeCategory] ?? [])];
  }, [activeCategory, importedParts]);

  const displaySelected: Selected = useMemo(() => {
    return { ...selected, ...selectedVariants } as Selected;
  }, [selected, selectedVariants]);

  const activeBasePart = selected[activeCategory];
  const activeColorVariants = colorVariants[activeCategory]?.[activeBasePart.id] ?? [];
  const activeDisplayVariants = [activeBasePart, ...activeColorVariants];
  const canUseColorVariants = supportsColorVariantCategory(activeCategory) && activeBasePart.id !== "none";

  const resetAll = () => {
    setSelected(makeInitialSelected(baseParts));
    setSelectedVariants({});
    setSaveMessage("");
  };

  const randomize = () => {
    const next: Selected = { ...selected };

    for (const category of layerOrder) {
      const options = [...baseParts[category], ...(importedParts[category] ?? [])];
      next[category] = pickRandom(options.length > 0 ? options : [nonePart]);
    }

    setSelected(next);
    setSelectedVariants({});
  };

  const setOption = (part: Part) => {
    setSelected((prev) => ({ ...prev, [activeCategory]: part }));
    setSelectedVariants((prev) => {
      const next = { ...prev };
      delete next[activeCategory];
      return next;
    });
  };

  const handleImportFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;

    const newParts: Part[] = await Promise.all(
      files.map(async (file, index) => ({
        id: `import-${activeCategory}-${Date.now()}-${index}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        src: await readFileAsDataUrl(file),
      }))
    );

    setImportedParts((prev) => ({
      ...prev,
      [activeCategory]: [...(prev[activeCategory] ?? []), ...newParts],
    }));
    setSelected((prev) => ({ ...prev, [activeCategory]: newParts[0] }));
    setSelectedVariants((prev) => {
      const next = { ...prev };
      delete next[activeCategory];
      return next;
    });

    event.target.value = "";
  };

  const handleImportColorVariants = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter((file) => file.type.startsWith("image/"));
    if (files.length === 0) return;

    const basePart = selected[activeCategory];
    if (basePart.id === "none") {
      setSaveMessage("先に色違いを追加したいパーツを選んでください");
      event.target.value = "";
      return;
    }

    const newVariants: Part[] = await Promise.all(
      files.map(async (file, index) => ({
        id: `color-${activeCategory}-${basePart.id}-${Date.now()}-${index}`,
        name: file.name.replace(/\.[^/.]+$/, ""),
        src: await readFileAsDataUrl(file),
      }))
    );

    setColorVariants((prev) => ({
      ...prev,
      [activeCategory]: {
        ...(prev[activeCategory] ?? {}),
        [basePart.id]: [...(prev[activeCategory]?.[basePart.id] ?? []), ...newVariants],
      },
    }));
    setSelectedVariants((prev) => ({ ...prev, [activeCategory]: newVariants[0] }));

    event.target.value = "";
  };

  const getLayerPart = (category: PartCategory) => {
    return selectedVariants[category] ?? selected[category];
  };

  const saveImage = async () => {
    try {
      setSaveMessage("PNGを生成中...");

      const canvas = document.createElement("canvas");
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setSaveMessage("Canvasの取得に失敗しました");
        return;
      }

      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      for (const category of layerOrder) {
        const part = getLayerPart(category);
        if (!part || part.id === "none" || !part.src) continue;

        const img = await loadImage(part.src);
        ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }

      canvas.toBlob((blob) => {
        if (!blob) {
          setSaveMessage("PNG生成に失敗しました");
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `takuan-avatar-${Date.now()}.png`;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);
        setSaveMessage("PNGをダウンロードしました");
      }, "image/png");
    } catch (error) {
      console.error(error);
      setSaveMessage("画像保存に失敗しました。素材画像が大きすぎる場合は1024x1024のPNGで試してください。");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff8fb] text-[#3f3038]">
      <main className="mx-auto max-w-[1480px] px-3 py-4 sm:px-5 sm:py-6">
        <header className="mb-4 flex flex-col gap-4 md:mb-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-100 text-3xl">🎀</div>
            <div>
              <h1 className="text-2xl font-black tracking-tight sm:text-3xl">たくあん</h1>
              <p className="text-xs text-zinc-500 sm:text-sm">PNGレイヤーを重ねるキャラメーカー</p>
            </div>
            <Sparkles className="ml-1 h-5 w-5 text-pink-300" />
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3">
            <Button
              onClick={randomize}
              variant="outline"
              className="h-11 rounded-xl border-pink-100 bg-white px-3 text-xs text-[#5a4650] shadow-sm hover:bg-pink-50 sm:h-12 sm:px-6 sm:text-sm"
            >
              <Shuffle className="mr-2 h-4 w-4 text-pink-500" /> ランダム
            </Button>
            <Button
              onClick={resetAll}
              variant="outline"
              className="h-11 rounded-xl border-pink-100 bg-white px-3 text-xs text-[#5a4650] shadow-sm hover:bg-pink-50 sm:h-12 sm:px-6 sm:text-sm"
            >
              <RotateCcw className="mr-2 h-4 w-4 text-pink-500" /> リセット
            </Button>
            <Button
              onClick={saveImage}
              className="h-11 rounded-xl bg-pink-400 px-3 text-xs text-white shadow-lg shadow-pink-200 hover:bg-pink-500 sm:h-12 sm:px-7 sm:text-sm"
            >
              <Download className="mr-2 h-4 w-4" /> 保存
            </Button>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[240px_minmax(460px,1fr)_520px] lg:gap-5">
          <Card className="order-2 rounded-3xl border-pink-100 bg-white shadow-sm lg:order-1">
            <CardContent className="p-0">
              {categoryGroups.map((group) => {
                const GroupIcon = group.icon;
                const active = group.key === activeGroup;

                return (
                  <div key={group.key} className="border-b border-pink-50 last:border-b-0">
                    <button
                      onClick={() => {
                        setActiveGroup(group.key);
                        const firstEnabledChild = group.children.find((child) => !child.disabled && isEditableCategory(child.key));
                        if (firstEnabledChild && isEditableCategory(firstEnabledChild.key)) {
                          setActiveCategory(firstEnabledChild.key);
                        }
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-base transition sm:gap-4 sm:px-5 sm:py-5 sm:text-lg ${
                        active ? "bg-pink-50 text-pink-500" : "text-[#4b3b44] hover:bg-pink-50/60"
                      }`}
                    >
                      <span className="flex items-center gap-4">
                        <GroupIcon className={`h-6 w-6 ${active ? "text-pink-500" : "text-[#7c6872]"}`} />
                        <span className="font-black">{group.label}</span>
                      </span>
                      <span className={`text-sm transition ${active ? "rotate-90 text-pink-400" : "text-zinc-300"}`}>›</span>
                    </button>

                    <AnimatePresence initial={false}>
                      {active && (
                        <motion.div
                          initial={{ height: 0, opacity: 0, y: -6 }}
                          animate={{ height: "auto", opacity: 1, y: 0 }}
                          exit={{ height: 0, opacity: 0, y: -6 }}
                          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden bg-white"
                        >
                          <div className="grid grid-cols-2 gap-2 px-3 pb-3 sm:block sm:space-y-1">
                            {group.children.map((category) => {
                              const Icon = category.icon;
                              const isActiveCategory = category.key === activeCategory;
                              const disabled = Boolean(category.disabled);

                              return (
                                <button
                                  key={category.key}
                                  disabled={disabled}
                                  onClick={() => {
                                    if (!disabled && isEditableCategory(category.key)) {
                                      setActiveCategory(category.key);
                                    }
                                  }}
                                  className={`flex w-full items-center gap-2 rounded-2xl border-l-4 px-3 py-3 text-left text-sm transition sm:ml-3 sm:w-[calc(100%-0.75rem)] sm:gap-3 sm:px-4 ${
                                    isActiveCategory
                                      ? "border-pink-400 bg-pink-100 text-pink-600"
                                      : "border-transparent text-[#6b5560] hover:bg-pink-50"
                                  } ${disabled ? "opacity-50" : ""}`}
                                >
                                  <Icon className="h-5 w-5" />
                                  <span className="font-semibold">{category.label}</span>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="order-1 rounded-3xl border-pink-100 bg-white shadow-sm lg:order-2">
            <CardContent className="p-3 sm:p-4">
              <AvatarPreview selected={displaySelected} />
              {saveMessage && <div className="mt-3 rounded-2xl bg-pink-50 p-3 text-sm font-bold text-pink-500">{saveMessage}</div>}
            </CardContent>
          </Card>

          <Card className="order-3 rounded-3xl border-pink-100 bg-white shadow-sm">
            <CardContent className="max-h-none overflow-y-visible p-4 sm:p-5 lg:max-h-[760px] lg:overflow-y-auto">
              <section>
                <div className="mb-4 flex items-start justify-between gap-3 sm:mb-5">
                  <div>
                    <p className="text-sm font-bold text-pink-400">SELECT PARTS</p>
                    <h2 className="text-xl font-black sm:text-2xl">{categoryLabels[activeCategory]}</h2>
                  </div>
                  <div className="rounded-full bg-pink-50 px-3 py-2 text-xs font-bold text-pink-500 sm:px-4 sm:text-sm">
                    {visibleOptions.length} items
                  </div>
                </div>

                {canUseColorVariants && (
                  <div className="mb-5 rounded-2xl bg-pink-50 p-3 sm:mb-6 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-[#5b4650]">色違い素材</div>
                        <div className="mt-1 text-xs text-[#8a6b78]">選択中パーツの色違いPNGを追加</div>
                      </div>
                      <div>
                        <input
                          ref={colorFileInputRef}
                          type="file"
                          accept="image/png,image/webp,image/jpeg"
                          multiple
                          className="hidden"
                          onChange={handleImportColorVariants}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => colorFileInputRef.current?.click()}
                          className="h-9 rounded-xl border-pink-100 bg-white px-3 text-xs font-bold text-pink-500 shadow-sm hover:bg-pink-50"
                        >
                          <Upload className="mr-1.5 h-3.5 w-3.5" /> 色違いをインポート
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                      {activeDisplayVariants.map((variant) => {
                        const activeVariant = displaySelected[activeCategory].id === variant.id;

                        return (
                          <button
                            key={variant.id}
                            onClick={() => {
                              if (variant.id === activeBasePart.id) {
                                setSelectedVariants((prev) => {
                                  const next = { ...prev };
                                  delete next[activeCategory];
                                  return next;
                                });
                              } else {
                                setSelectedVariants((prev) => ({ ...prev, [activeCategory]: variant }));
                              }
                            }}
                            className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 ${
                              activeVariant ? "border-pink-400 ring-2 ring-pink-100" : "border-white"
                            }`}
                          >
                            <div className="aspect-square bg-white">
                              <img src={variant.src} alt={variant.name} className="h-full w-full object-contain p-2" />
                            </div>
                            <div className="border-t border-pink-50 px-2 py-2 text-center text-xs font-bold text-[#6b5560]">
                              {variant.id === activeBasePart.id ? "基本色" : variant.name}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-sm font-black text-[#5b4650]">パーツを選択</div>
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/webp,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={handleImportFiles}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 rounded-xl border-pink-100 bg-white px-3 text-xs font-bold text-pink-500 shadow-sm hover:bg-pink-50"
                    >
                      <Upload className="mr-1.5 h-3.5 w-3.5" /> インポート
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 xl:grid-cols-5">
                  {visibleOptions.map((part) => {
                    const active = selected[activeCategory].id === part.id;

                    return (
                      <button
                        key={part.id}
                        onClick={() => setOption(part)}
                        className={`group overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
                          active ? "border-pink-400 ring-2 ring-pink-100" : "border-zinc-100 hover:bg-pink-50"
                        }`}
                      >
                        <div className="relative aspect-square overflow-hidden bg-[#fff8fb]">
                          <img
                            src={part.src}
                            alt={part.name}
                            className="h-full w-full object-contain p-1.5 transition duration-300 group-hover:scale-105 sm:p-2"
                          />
                          <div className="absolute inset-x-0 bottom-0 border-t border-pink-100 bg-white/95 px-2 py-2 text-xs font-bold text-[#5b4650]">
                            {part.name}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className="mt-5 rounded-2xl bg-pink-50 p-3 text-xs leading-6 text-[#6b5560] sm:mt-6 sm:p-4 sm:text-sm">
                素材は src/parts/カテゴリ名/画像.png に置くだけで自動表示されます。manifest.json は不要です。
              </section>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
