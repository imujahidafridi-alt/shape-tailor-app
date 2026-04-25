import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { db, CustomerMeasurement } from "@/db/database";
import {
  Save,
  Printer,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { useAutosave } from "@/hooks/useAutosave";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import toast from "react-hot-toast";
import {
  parseMeasurementInput,
  formatMeasurementDisplay,
} from "@/utils/fractionUtils";
import {
  LayoutElement,
  DEFAULT_LAYOUT,
  DEFAULT_WAISTCOAT_LAYOUT,
  DEFAULT_COAT_LAYOUT,
  DAMAN_OPTIONS,
  SILAI_OPTIONS,
  BAN_OPTIONS,
  WC_COLLAR_OPTIONS,
  WC_GERA_OPTIONS,
  COAT_BUTTON_OPTIONS,
  COAT_CHAAK_OPTIONS,
  CUFF_OPTIONS,
  BUTTON_DESIGN_OPTIONS,
} from "@/utils/slipLayout";
import asset12GhumRaw from "/SVG/Asset_12_Ghum.svg?raw";
import asset6SadaBukramRaw from "/SVG/Asset_6_Sada_Bukram.svg?raw";
import asset6KaniAsteenRaw from "/SVG/Asset_6_Kani_Asteen.svg?raw";
import asset6BaghairBukramFoldRaw from "/SVG/Asset_6_Baghair_Bukram_Fold.svg?raw";

interface CustomerMeasurementFormProps {
  customerId: number | string;
  customerName?: string;
  onPrint?: (
    measurement: CustomerMeasurement,
    layoutToPrint: LayoutElement[],
  ) => void;
  onPreview?: (
    measurement: CustomerMeasurement,
    layoutToPreview: LayoutElement[],
  ) => void;
}

export default function CustomerMeasurementForm({
  customerId,
  customerName,
  onPrint,
  onPreview,
}: CustomerMeasurementFormProps) {
  const { i18n } = useTranslation();
  const isUrdu = i18n.language === "ur";

  const [activeGarment, setActiveGarment] = useState<
    "shalwar_kameez" | "waistcoat" | "coat"
  >("shalwar_kameez");

  const [fields, setFields] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<Record<string, boolean>>({});
  const [existingId, setExistingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    fieldKey: string;
    options: { key: string; labelUr?: string; label?: string }[];
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, fieldKey: string, options: any[]) => {
      e.preventDefault();
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        fieldKey,
        options,
      });
    },
    [],
  );

  // Dynamic Layout State
  const [layout, setLayout] = useState<LayoutElement[]>(DEFAULT_LAYOUT);
  const [shopSettings, setShopSettings] = useState<any>(null);

  // Stable change handler
  const handleFieldChange = useCallback((key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: parseMeasurementInput(value) }));
  }, []);

  // Load existing measurements & layout on mount or garment change
  useEffect(() => {
    loadMeasurementsAndLayout();
  }, [customerId, activeGarment]);

  async function loadMeasurementsAndLayout() {
    setLoading(true);
    try {
      // Load Settings for layout
      const settings = await db.settings.toCollection().first();
      if (settings) {
        setShopSettings(settings);
        let defaultForGarment = DEFAULT_LAYOUT;
        let savedForGarment: any[] | undefined = undefined;

        if (activeGarment === "shalwar_kameez") {
          defaultForGarment = DEFAULT_LAYOUT;
          savedForGarment = settings.slipLayout;
        } else if (activeGarment === "waistcoat") {
          defaultForGarment = DEFAULT_WAISTCOAT_LAYOUT;
          savedForGarment = settings.slipLayoutWaistcoat;
        } else if (activeGarment === "coat") {
          defaultForGarment = DEFAULT_COAT_LAYOUT;
          savedForGarment = settings.slipLayoutCoat;
        }

        const normalizedSavedLayout = (
          savedForGarment && savedForGarment.length > 0
            ? savedForGarment
            : defaultForGarment
        ).map((el: any) => {
          if (!el.content) return el;

          // Migrate old customer phone fields to suitQty for new layout behavior.
          if (el.content.field === "phone") {
            const migrated: any = {
              ...el,
              content: {
                ...el.content,
                field: "suitQty",
              },
            };

            if (el.id === "header_label_phone") {
              migrated.id = "header_label_suitQty";
              migrated.content = "Suit Qty";
            }
            if (el.id === "header_val_phone") {
              migrated.id = "header_val_suitQty";
            }

            return migrated;
          }

          if (el.id === "header_label_phone") {
            return { ...el, id: "header_label_suitQty", content: "Suit Qty" };
          }

          return el;
        });

        const savedLayout = normalizedSavedLayout;
        const mergedLayout = defaultForGarment.map((defaultEl) => {
          if (defaultEl.isFixed) return defaultEl;
          const savedEl = savedLayout.find((el: any) => el.id === defaultEl.id);

          // Auto-migrate banGroup if it has old massive width
          if (savedEl && savedEl.id === "banGroup" && savedEl.width > 40) {
            return {
              ...savedEl,
              width: defaultEl.width,
              height: defaultEl.height,
              x: defaultEl.x,
              y: defaultEl.y,
            };
          }

          // Auto-migrate cuffGroup if it has old massive width
          if (savedEl && savedEl.id === "cuffGroup" && savedEl.width > 40) {
            return {
              ...savedEl,
              width: defaultEl.width,
              height: defaultEl.height,
              x: defaultEl.x,
              y: defaultEl.y,
            };
          }

          return savedEl || defaultEl;
        });
        setLayout(mergedLayout);
      } else {
        setLayout(activeGarment === "shalwar_kameez" ? DEFAULT_LAYOUT : []); // We'll assume default config later if settings null
      }

      // Load Measurements
      const existing = await db.customerMeasurements
        .where("customerId")
        .equals(customerId)
        .first();

      if (existing) {
        const loaded = existing.fields || {};
        if (loaded.phone && !loaded.suitQty) {
          loaded.suitQty = loaded.phone;
          delete loaded.phone;
        }
        loaded.sNo = String(customerId);
        loaded.customerName = customerName || "";
        setFields(loaded);
        setOptions(existing.designOptions || {});
        setExistingId(existing.id || null);
      } else {
        const emptyFields: Record<string, string> = {};
        emptyFields["sNo"] = String(customerId);
        emptyFields["customerName"] = customerName || "";
        emptyFields["suitQty"] = "";
        setFields(emptyFields);
      }
    } catch (error) {
      console.error("Error loading measurements:", error);
    }
    setLoading(false);
  }

  const saveData = useCallback(
    async (data: {
      fields: Record<string, string>;
      options: Record<string, boolean>;
    }) => {
      const now = new Date();
      try {
        if (existingId) {
          // Update existing
          await db.customerMeasurements.update(existingId, {
            fields: data.fields,
            designOptions: data.options,
            updatedAt: now,
          });
        } else {
          // Create new
          const id = await db.customerMeasurements.add({
            customerId,
            fields: data.fields,
            designOptions: data.options,
            createdAt: now,
            updatedAt: now,
          });
          setExistingId(id);
        }
      } catch (error) {
        console.error("Error saving measurements:", error);
        throw error;
      }
    },
    [existingId, customerId],
  );

  const saveStatus = useAutosave({ fields, options }, saveData, 1000);

  function handleReset() {
    setShowResetConfirm(true);
  }

  function confirmReset() {
    const emptyFields: Record<string, string> = {};
    setFields(emptyFields);

    setOptions({});
    setShowResetConfirm(false);
    toast.success(
      isUrdu ? "ناپ صاف کر دیئے گئے" : "Measurements cleared successfully",
    );
  }

  function handlePrint() {
    if (onPrint) {
      const measurement: CustomerMeasurement = {
        id: existingId || undefined,
        customerId,
        fields,
        designOptions: options,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onPrint(measurement, layout); // Pass layout here
    }
  }

  function handlePreview() {
    if (onPreview) {
      const measurement: CustomerMeasurement = {
        id: existingId || undefined,
        customerId,
        fields,
        designOptions: options,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      onPreview(measurement, layout); // Pass layout here
    } else {
      console.error("onPreview prop is missing");
      toast.error("Preview feature not connected");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Garment Tabs */}
      <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-sm border border-slate-200/60 w-fit">
        <button
          onClick={() => setActiveGarment("shalwar_kameez")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeGarment === "shalwar_kameez" ? "bg-white shadow text-primary-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}
        >
          {isUrdu ? "شلوار قمیض" : "Shalwar Kameez"}
        </button>
        <button
          onClick={() => setActiveGarment("waistcoat")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeGarment === "waistcoat" ? "bg-white shadow text-primary-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}
        >
          {isUrdu ? "واسکٹ" : "Waistcoat"}
        </button>
        <button
          onClick={() => setActiveGarment("coat")}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeGarment === "coat" ? "bg-white shadow text-primary-700" : "text-slate-500 hover:text-slate-800 hover:bg-slate-200/50"}`}
        >
          {isUrdu ? "کوٹ" : "Coat"}
        </button>
      </div>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-3">
          {isUrdu ? "ناپ پرچی" : "Measurement Slip"}
          {saveStatus === "saving" && (
            <span className="text-xs font-normal text-gray-500 flex items-center gap-1 animate-pulse bg-gray-100 px-2 py-1 rounded-full">
              <Save className="w-3 h-3" />{" "}
              {isUrdu ? "Ù…Ø­ÙÙˆØ¸ ÛÙˆ Ø±ÛØ§ ÛÛ’..." : "Saving..."}
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="text-xs font-normal text-green-600 flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />{" "}
              {isUrdu ? "Ù…Ø­ÙÙˆØ¸" : "Saved"}
            </span>
          )}
          {saveStatus === "error" && (
            <span className="text-xs font-normal text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded-full">
              <AlertCircle className="w-3 h-3" /> {isUrdu ? "خرابی" : "Error"}
            </span>
          )}
        </h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="btn btn-danger text-sm flex items-center gap-1"
          >
            <RotateCcw className="w-4 h-4" />
            {isUrdu ? "ری سیٹ" : "Reset"}
          </button>
          <button
            type="button"
            onClick={handlePreview}
            className="btn btn-secondary text-sm flex items-center gap-2"
            title={isUrdu ? "پریویو" : "Preview"}
          >
            <Eye className="w-4 h-4" />
            {isUrdu ? "پریویو" : "Preview"}
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="btn btn-primary text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            {isUrdu ? "پرنٹ" : "Print"}
          </button>
        </div>
      </div>

      {/* Simulated physical measurement slip layout */}
      <div className="flex justify-center w-full overflow-x-auto pb-4">
        <div
          className="bg-white relative shadow-inner transition-all duration-300"
          style={{
            width: "500px",
            height: shopSettings?.slipPageSize === "A4" ? "707px" : "700px", // Adjust height based on page size
            border: "1px solid #cbd5e1",
            fontFamily: "sans-serif",
            color: "#0f172a",
          }}
          dir="ltr"
        >
          {layout.map((element) => {
            const style: React.CSSProperties = {
              position: "absolute",
              top: `${element.y}%`,
              left: `${element.x}%`,
              width: element.width ? `${element.width}%` : "auto",
              height: element.height ? `${element.height}%` : "auto",
            };

            if (element.type === "textBlock") {
              let contentStr = element.content;
              if (element.id === "header_title" && shopSettings?.shopName) {
                contentStr = shopSettings.shopName;
              }
              if (element.id === "header_subtitle" && shopSettings?.phone1) {
                contentStr = `Contact No: ${shopSettings.phone1}`;
              }

              if (element.id === "header_divider") {
                return (
                  <div
                    key={element.id}
                    style={{
                      ...style,
                      backgroundColor: element.color || "#cbd5e1",
                    }}
                  />
                );
              }

              const fontFamily =
                element.direction === "rtl"
                  ? "'NotoNastaliqUrdu', serif"
                  : "Arial, sans-serif";
              return (
                <div
                  key={element.id}
                  style={{
                    ...style,
                    direction: element.direction || "ltr",
                    fontFamily,
                  }}
                  className="flex items-center justify-center text-center font-bold"
                >
                  <div
                    style={{
                      fontSize: `${element.fontSize || 14}px`,
                      color: element.color || "#0f172a",
                    }}
                  >
                    {contentStr.split("\n").map((line: string, i: number) => (
                      <div key={i}>{line}</div>
                    ))}
                  </div>
                </div>
              );
            }

            if (element.type === "textArea") {
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex flex-col bg-white/50"
                >
                  {!element.content.hideLabel && (
                    <span
                      className="font-semibold text-slate-600 px-1.5 text-[13px] bg-white w-fit z-10"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      {element.content.label}
                    </span>
                  )}
                  <textarea
                    value={fields[element.content.field] || ""}
                    onChange={(e) =>
                      handleFieldChange(element.content.field, e.target.value)
                    }
                    className="flex-1 w-full outline-none text-slate-900 font-bold px-2 py-1 text-sm bg-transparent border border-slate-300 border-dashed rounded resize-none z-10 focus:ring-1 focus:ring-primary-400 focus:border-solid"
                    style={{ fontFamily: "Arial, sans-serif" }}
                    dir="auto"
                  />
                </div>
              );
            }

            if (element.type === "input") {
              const isHiddenHeaderValue =
                element.content.hideLabel &&
                ["sNo", "customerName", "karigar", "suitQty"].includes(
                  element.content.field,
                );
              const isSuitQtyHeaderValue =
                element.id === "header_val_suitQty" ||
                (element.content.hideLabel &&
                  element.content.field === "suitQty");
              const inputClass = `${isHiddenHeaderValue ? "w-full min-w-0" : "flex-1 min-w-0 w-full"} outline-none text-slate-900 font-bold px-1.5 text-sm bg-transparent z-10 ${
                element.content.hideLabel
                  ? isHiddenHeaderValue
                    ? "text-center text-base"
                    : "text-left text-base"
                  : ""
              } ${["sNo", "customerName"].includes(element.content.field) ? "cursor-not-allowed opacity-80" : ""}`;

              return (
                <div
                  key={element.id}
                  style={style}
                  className={`flex items-center ${isHiddenHeaderValue ? "justify-center" : ""}`}
                >
                  {!element.content.hideLabel && (
                    <span
                      className="font-semibold text-slate-600 px-1.5 text-[13px] shrink-0 whitespace-nowrap bg-white"
                      style={{ fontFamily: "Arial, sans-serif" }}
                    >
                      {element.content.label}
                    </span>
                  )}
                  <div
                    style={
                      isSuitQtyHeaderValue
                        ? { width: "84%", margin: "0 auto" }
                        : { width: "100%" }
                    }
                  >
                    <input
                      type="text"
                      value={
                        element.content.field === "customerName"
                          ? customerName || ""
                          : formatMeasurementDisplay(
                              fields[element.content.field] || "",
                            )
                      }
                      onChange={(e) =>
                        handleFieldChange(element.content.field, e.target.value)
                      }
                      readOnly={
                        element.content.field === "sNo" ||
                        element.content.field === "customerName"
                      }
                      className={inputClass}
                      style={{
                        fontFamily: "Arial, sans-serif",
                        textAlign: isHiddenHeaderValue ? "center" : "left",
                        paddingLeft: isSuitQtyHeaderValue ? 0 : undefined,
                        paddingRight: isSuitQtyHeaderValue ? 0 : undefined,
                      }}
                      dir="ltr"
                    />
                  </div>
                  {element.content.dottedLine ? (
                    <div className="absolute left-6 right-1 bottom-1 border-b border-dashed border-slate-300 z-0 pointer-events-none" />
                  ) : (
                    <div className="absolute left-0 right-0 bottom-0 border-b border-slate-300 z-0 pointer-events-none" />
                  )}
                </div>
              );
            }

            // Conditional Rendering Logic for Shalwar Kameez Collar Toggle
            // If 'simple_collar' is selected, DO NOT render Ban Shape (13) and Ban Dropdown
            if (
              (element.id === "svg_shape13" || element.type === "banGroup") &&
              fields["sk_collar_type"] === "simple_collar"
            ) {
              return null;
            }
            // If 'ban_collar' is selected, DO NOT render Simple Collar Shape (14)
            if (
              element.id === "svg_shape14" &&
              (fields["sk_collar_type"] === "ban_collar" ||
                !fields["sk_collar_type"])
            ) {
              return null; // Note: 'ban_collar' is the default
            }

            if (element.type === "svg") {
              let assetName = element.content.asset;
              let rawContent = element.content.raw;

              // Swap Sada Patti with Ghum Patti
              if (
                element.id === "svg_shape12" &&
                fields["sk_patti_type"] === "ghum_patti"
              ) {
                assetName = "Asset_12_Ghum.svg";
                rawContent = asset12GhumRaw; // Use dynamically generated and imported raw content
              }

            // Swap Asteen shapes
            if (element.id === "svg_shape6") {
              if (fields["sk_asteen_type"] === "sada_bukram") {
                assetName = "Asset_6_Sada_Bukram.svg";
                rawContent = asset6SadaBukramRaw;
              } else if (fields["sk_asteen_type"] === "kani_asteen") {
                assetName = "Asset_6_Kani_Asteen.svg";
                rawContent = asset6KaniAsteenRaw;
              } else if (fields["sk_asteen_type"] === "baghair_bukram_fold") {
                assetName = "Asset_6_Baghair_Bukram_Fold.svg";
                rawContent = asset6BaghairBukramFoldRaw;
              }
            }
                  style={style}
                  className="relative pointer-events-none"
                >
                  <img
                    src={svgBase64}
                    alt={element.id}
                    className="w-full h-full object-contain pointer-events-none"
                    style={{
                      filter:
                        "brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)",
                    }}
                    draggable={false}
                  />
                  {/* Nested Inputs inside the SVG */}
                  {(element.content.inputs || []).map((inp: any) => {
                    const valStr = formatMeasurementDisplay(
                      (fields[inp.id] || "").toString(),
                    );
                    const chWidth = Math.max(2.5, valStr.length + 0.5); // At least 2.5ch width
                    let left = `${inp.relX}%`;
                    if (inp.placeX === "left") left = "0%";
                    if (inp.placeX === "right") left = "100%";
                    if (inp.placeX === "center") left = "50%";

                    let top = `${inp.relY}%`;
                    if (inp.placeY === "top") top = "0%";
                    if (inp.placeY === "bottom") top = "100%";
                    if (inp.placeY === "center") top = "50%";

                    let transform = `translate(-50%, -50%)`;
                    if (inp.placeX === "left")
                      transform = transform.replace("-50%", "0%");
                    if (inp.placeX === "right")
                      transform = transform.replace("-50%", "-100%");
                    if (inp.placeY === "top")
                      transform = transform.replace(/, -50%\)/, ", 0%)");
                    if (inp.placeY === "bottom")
                      transform = transform.replace(/, -50%\)/, ", -100%)");

                    return (
                      <input
                        key={inp.id}
                        type="text"
                        value={valStr}
                        onChange={(e) =>
                          handleFieldChange(inp.id, e.target.value)
                        }
                        className={`absolute outline-none text-slate-900 font-bold rounded-sm z-10 text-center pointer-events-auto transition-all focus:bg-white focus:ring-1 focus:ring-slate-400 ${
                          !valStr
                            ? "bg-slate-200/60"
                            : "bg-transparent hover:bg-slate-100/50"
                        }`}
                        style={{
                          left,
                          top,
                          width: `${chWidth}ch`,
                          transform,
                          fontFamily: "Arial, sans-serif",
                        }}
                        dir="ltr"
                      />
                    );
                  })}
                </div>
              );
            }

            if (element.type === "damanGroup") {
              const options = element.content?.options || DAMAN_OPTIONS;
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex items-end justify-center gap-4 font-urdu"
                >
                  {options.map((opt: any) => {
                    const svgBase64 = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(opt.raw.replace(/\n/g, ""))}`;
                    return (
                      <label
                        key={opt.key}
                        className="flex flex-col items-center cursor-pointer"
                      >
                        <img
                          src={svgBase64}
                          alt={opt.labelUr || opt.label}
                          className="w-10 h-8 object-contain"
                          style={{
                            filter:
                              "brightness(0) saturate(100%) invert(32%) sepia(13%) saturate(831%) hue-rotate(176deg) brightness(95%) contrast(88%)",
                          }}
                          draggable={false}
                        />
                        <span className="text-[11px] font-semibold mt-1 text-slate-600 whitespace-nowrap font-urdu">
                          {opt.labelUr || opt.label || ""}
                        </span>
                        <input
                          type="radio"
                          name="daman_option"
                          checked={fields["daman_selected"] === opt.key}
                          onChange={() =>
                            handleFieldChange("daman_selected", opt.key)
                          }
                          className="w-4 h-4 accent-slate-800 cursor-pointer mt-1"
                        />
                      </label>
                    );
                  })}
                </div>
              );
            }

            if (element.type === "cuffGroup") {
              const options = element.content?.options || CUFF_OPTIONS;
              const val = fields["cuff_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "کف کا انتخاب";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "cuff_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "buttonDesignGroup") {
              const options = element.content?.options || BUTTON_DESIGN_OPTIONS;
              const val = fields["button_design_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "بٹن ڈیزائن کا انتخاب";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "button_design_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "silaiGroup") {
              const options = element.content?.options || SILAI_OPTIONS;
              const val = fields["silai_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "منتخب کریں";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "silai_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "banGroup") {
              const options = element.content?.options || BAN_OPTIONS;
              const val = fields["ban_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "کالر کا انتخاب";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "ban_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "wcCollarGroup") {
              const options = element.content?.options || WC_COLLAR_OPTIONS;
              const val = fields["wc_collar_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "کالر کا انتخاب";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "wc_collar_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "wcGeraGroup") {
              const options = element.content?.options || WC_GERA_OPTIONS;
              const val = fields["wc_gera_selected"];
              const selectedLabel = val
                ? options.find((o: any) => o.key === val)?.labelUr ||
                  options.find((o: any) => o.key === val)?.label
                : "گیرا کا انتخاب";
              return (
                <div
                  key={element.id}
                  style={{ ...style, width: "fit-content" }}
                  className="flex flex-col justify-center text-[13px] font-bold text-slate-700 font-urdu px-2 cursor-context-menu pointer-events-auto hover:text-primary-600 transition-colors drop-shadow-sm select-none"
                  onContextMenu={(e) =>
                    handleContextMenu(e, "wc_gera_selected", options)
                  }
                  title={
                    isUrdu
                      ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                      : "Right-click to change"
                  }
                  dir="rtl"
                >
                  {selectedLabel}
                </div>
              );
            }

            if (element.type === "coatDoublePressGroup") {
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex items-center gap-3 px-2"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fields["coat_double_press"] === "yes"}
                      onChange={(e) =>
                        handleFieldChange(
                          "coat_double_press",
                          e.target.checked ? "yes" : "no",
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span
                      className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]"
                      style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                      dir="rtl"
                    >
                      ڈبل پریس
                    </span>
                  </label>
                </div>
              );
            }

            if (element.type === "coatButtonGroup") {
              const options = COAT_BUTTON_OPTIONS;
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex items-center gap-4 px-2"
                >
                  {options.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="coat_button_count"
                        value={opt.key}
                        checked={fields["coat_button_selected"] === opt.key}
                        onChange={() =>
                          handleFieldChange("coat_button_selected", opt.key)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span
                        className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]"
                        style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                        dir="rtl"
                      >
                        {opt.labelUr}
                      </span>
                    </label>
                  ))}
                </div>
              );
            }

            if (element.type === "coatChaakGroup") {
              const options = COAT_CHAAK_OPTIONS;
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex items-center gap-4 px-2"
                >
                  {options.map((opt) => (
                    <label
                      key={opt.key}
                      className="flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <input
                        type="radio"
                        name="coat_chaak_type"
                        value={opt.key}
                        checked={fields["coat_chaak_selected"] === opt.key}
                        onChange={() =>
                          handleFieldChange("coat_chaak_selected", opt.key)
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                      />
                      <span
                        className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]"
                        style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                        dir="rtl"
                      >
                        {opt.labelUr}
                      </span>
                    </label>
                  ))}
                </div>
              );
            }

            if (element.type === "skCollarToggleGroup") {
              // Default to 'ban_collar' if nothing is selected
              const currentValue = fields["sk_collar_type"] || "ban_collar";
              return (
                <div
                  key={element.id}
                  style={style}
                  className="flex flex-row items-center gap-3 px-2 bg-slate-50/50 p-1.5 rounded border border-slate-100 shadow-sm"
                >
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="sk_collar_type"
                      value="ban_collar"
                      checked={currentValue === "ban_collar"}
                      onChange={() =>
                        handleFieldChange("sk_collar_type", "ban_collar")
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span
                      className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2] whitespace-nowrap"
                      style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                      dir="rtl"
                    >
                      بین کالر
                    </span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="radio"
                      name="sk_collar_type"
                      value="simple_collar"
                      checked={currentValue === "simple_collar"}
                      onChange={() =>
                        handleFieldChange("sk_collar_type", "simple_collar")
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                    />
                    <span
                      className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2] whitespace-nowrap"
                      style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                      dir="rtl"
                    >
                      سادہ کالر
                    </span>
                  </label>
                </div>
              );
            }

            if (element.type === "skPattiKaajGroup") {
              return (
                <div
                  key={element.id}
                  style={{ ...style, zIndex: 20 }}
                  className="flex flex-col justify-center gap-1.5 px-2 pointer-events-auto"
                >
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={fields["sk_patti_kaaj"] === "yes"}
                      onChange={(e) =>
                        handleFieldChange(
                          "sk_patti_kaaj",
                          e.target.checked ? "yes" : "no",
                        )
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span
                      className="text-[13px] font-semibold text-slate-700 font-urdu leading-[2.2]"
                      style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
                      dir="rtl"
                    >
                      پٹی کاج ہو
                    </span>
                  </label>
                </div>
              );
            }

            if (element.type === "skPattiTypeGroup") {
              return (
                <div
                  key={element.id}
                  style={{ ...style, zIndex: 20 }}
                  className="flex flex-col justify-center gap-1.5 px-2 pointer-events-auto"
                >
                  <div
                    className="text-[13px] font-bold text-slate-700 font-urdu py-0 px-2 cursor-context-menu hover:text-primary-600 transition-colors drop-shadow-sm select-none rounded w-full flex items-center justify-end"
                    dir="rtl"
                    onContextMenu={(e) =>
                      handleContextMenu(e, "sk_patti_type", [
                        { key: "sada_patti", labelUr: "سادہ پٹی" },
                        { key: "ghum_patti", labelUr: "گم پٹی" },
                      ])
                    }
                    title={
                      isUrdu
                        ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                        : "Right-click to change"
                    }
                  >
                    {fields["sk_patti_type"] === "ghum_patti"
                      ? "گم پٹی"
                      : "سادہ پٹی"}
                  </div>
                </div>
              );
            }

            if (element.type === "skAsteenShapeGroup") {
              return (
                <div
                  key={element.id}
                  style={{ ...style, zIndex: 20 }}
                  className="flex flex-col justify-center gap-1.5 px-2 pointer-events-auto"
                >
                  <div
                    className="text-[13px] font-bold text-slate-700 font-urdu py-0 px-2 cursor-context-menu hover:text-primary-600 transition-colors drop-shadow-sm select-none rounded w-full flex items-center justify-end"
                    dir="rtl"
                    onContextMenu={(e) =>
                      handleContextMenu(e, "sk_asteen_type", [
                        { key: "default", labelUr: "بغیر بکرم" },
                        { key: "sada_bukram", labelUr: "سادہ بکرم" },
                        { key: "kani_asteen", labelUr: "کنی آستین" },
                        { key: "baghair_bukram_fold", labelUr: "بغیر بکرم فولڈ" },
                      ])
                    }
                    title={
                      isUrdu
                        ? "تبدیل کرنے کے لئے رائٹ کلک کریں"
                        : "Right-click to change"
                    }
                  >
                    {fields["sk_asteen_type"] === "sada_bukram"
                      ? "سادہ بکرم"
                      : fields["sk_asteen_type"] === "kani_asteen"
                        ? "کنی آستین"
                        : fields["sk_asteen_type"] === "baghair_bukram_fold"
                          ? "بغیر بکرم فولڈ"
                          : "بغیر بکرم"}
                  </div>
                </div>
              );
            }

            return null;
          })}
        </div>
      </div>

      {/* Footer Note */}
      <div className="flex justify-center w-full pb-4">
        <div
          className="w-[500px] text-center text-slate-600 text-sm border-t border-dashed border-slate-300 pt-3"
          style={{ fontFamily: "'NotoNastaliqUrdu', serif" }}
          dir="rtl"
        >
          رسید گم ہو جانے پر اگر عدد میں کسی قسم کی بھی غلطی ہوئی تو اس کا ذمہ
          دار کاریگر ہوگا۔
        </div>
      </div>

      <ConfirmationModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={confirmReset}
        title={isUrdu ? "ری سیٹ کی تصدیق" : "Reset Confirmation"}
        message={
          isUrdu
            ? "کیا آپ واقعی تمام ناپ صاف کرنا چاہتے ہیں؟"
            : "Are you sure you want to clear all measurements?"
        }
        confirmText={isUrdu ? "ری سیٹ" : "Reset"}
      />

      {/* Global Context Menu */}
      {contextMenu && contextMenu.visible && (
        <div
          className="fixed bg-white border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] rounded-md py-1 z-[9999] min-w-[140px] transform"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {contextMenu.options.map((opt) => (
            <div
              key={opt.key}
              className="px-4 py-2 hover:bg-slate-100 cursor-pointer text-right font-urdu text-[13px] text-slate-700 transition-colors font-bold"
              dir="rtl"
              onClick={() => {
                handleFieldChange(contextMenu.fieldKey, opt.key);
                setContextMenu(null);
              }}
            >
              {opt.labelUr || opt.label || ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
