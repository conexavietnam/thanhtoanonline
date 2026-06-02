import React, { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Trash2, Save, Eye, RefreshCw, Move } from "lucide-react";
import { pdfExportAPI } from "../../../../lib/api";
import { Document, Page, pdfjs } from 'react-pdf';
import toast from "react-hot-toast";
import {
    formatPdfVariableToken,
    normalizePdfCustomVariables,
} from "../pdfVariableUtils.js";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const DATA_SOURCES = [
    { label: "Tên người test", value: "user_name" },
    { label: "Tuổi", value: "user_age" },
    { label: "Giới tính", value: "user_gender" },
    { label: "Ngày làm test", value: "test_date" },
    { label: "Điểm D (disc_D_score)", value: "disc_D_score" },
    { label: "Điểm I (disc_I_score)", value: "disc_I_score" },
    { label: "Điểm S (disc_S_score)", value: "disc_S_score" },
    { label: "Điểm C (disc_C_score)", value: "disc_C_score" },
    { label: "Kiểu DISC", value: "disc_type" },
    { label: "Nhóm chính", value: "disc_primary" },
    { label: "Nhóm phụ", value: "disc_secondary" },
    { label: "Tóm tắt DISC", value: "disc_summary" },
    { label: "Điểm mạnh DISC", value: "disc_strength" },
    { label: "Điểm cần lưu ý DISC", value: "disc_limitation" },
    { label: "Phong cách làm việc", value: "disc_work_style" },
    { label: "Phong cách giao tiếp", value: "disc_communication_style" },
    { label: "Big Five - Openness", value: "big5_openness" },
    { label: "Big Five - Conscientiousness", value: "big5_conscientiousness" },
    { label: "Big Five - Extraversion", value: "big5_extraversion" },
    { label: "Big Five - Agreeableness", value: "big5_agreeableness" },
    { label: "Big Five - Neuroticism", value: "big5_neuroticism" },
    { label: "Tóm tắt Big Five", value: "big5_summary" },
    { label: "Phong cách tư duy", value: "big5_thinking_style" },
    { label: "Phong cách cảm xúc", value: "big5_emotional_style" },
    { label: "IKIGAI - Passion", value: "ikigai_passion" },
    { label: "IKIGAI - Strength", value: "ikigai_strength" },
    { label: "IKIGAI - Value", value: "ikigai_value" },
    { label: "IKIGAI - Opportunity", value: "ikigai_opportunity" },
    { label: "Tóm tắt IKIGAI", value: "ikigai_summary" },
    { label: "Tiềm năng phát triển", value: "ikigai_potential" },
    { label: "Định hướng IKIGAI", value: "ikigai_direction" },
    { label: "Archetype tính cách", value: "personality_archetype" },
    { label: "Tagline tính cách", value: "personality_tagline" },
    { label: "Nghề top 1", value: "career_top1" },
    { label: "Nghề top 2", value: "career_top2" },
    { label: "Nghề top 3", value: "career_top3" },
    { label: "Mô tả nghề nghiệp", value: "career_description" },
    { label: "Lời khuyên phát triển", value: "growth_advice" },
    { label: "Trọng tâm phát triển", value: "development_focus" },
    { label: "Tổng kết cuối", value: "final_summary" },
    { label: "Họ và tên", value: "fullName" },
    { label: "Họ và tên (snake_case)", value: "full_name" },
    { label: "Email", value: "email" },
    { label: "Số điện thoại (snake_case)", value: "phone" },
    { label: "Số điện thoại", value: "phoneNumber" },
    { label: "Ngày sinh", value: "dob" },
    { label: "Địa chỉ", value: "address" },
    { label: "DISC D (template mới)", value: "disc_D" },
    { label: "DISC I (template mới)", value: "disc_I" },
    { label: "DISC S (template mới)", value: "disc_S" },
    { label: "DISC C (template mới)", value: "disc_C" },
    { label: "Trục phản xạ chính", value: "disc_primary_axis" },
    { label: "Trục phản xạ phụ", value: "disc_secondary_axis" },
    { label: "Vùng hành vi ít dùng", value: "disc_low_zone" },
    { label: "Nhóm DISC kết hợp", value: "disc_combination" },
    { label: "Kiểu vận hành tổng thể", value: "disc_archetype" },
    { label: "Điểm mạnh nổi bật", value: "disc_strengths" },
    { label: "Thách thức cần lưu ý", value: "disc_weaknesses" },
    { label: "Yếu tố tạo động lực", value: "disc_motivation" },
    { label: "Phản ứng khi áp lực", value: "disc_stress_behavior" },
    { label: "Phong cách giao tiếp mới", value: "disc_communication_style" },
    { label: "Môi trường làm việc phù hợp", value: "disc_work_environment" },
    { label: "Lĩnh vực nghề nghiệp phù hợp", value: "disc_career_fields" },
    { label: "Vai trò phù hợp trong tổ chức", value: "disc_work_roles" },
    { label: "Kết quả DISC (Nhóm chính)", value: "disc_primary_type" },
    { label: "Kết quả DISC chính (D/I/S/C, DI, IS...)", value: "DISC_MAIN" },
    { label: "Điểm số D", value: "disc_score_d" },
    { label: "Điểm số I", value: "disc_score_i" },
    { label: "Điểm số S", value: "disc_score_s" },
    { label: "Điểm số C", value: "disc_score_c" },
    { label: "Điểm D (scoreD)", value: "scoreD" },
    { label: "Điểm I (scoreI)", value: "scoreI" },
    { label: "Điểm S (scoreS)", value: "scoreS" },
    { label: "Điểm C (scoreC)", value: "scoreC" },
    { label: "Phần trăm D (%)", value: "disc_percent_d" },
    { label: "Phần trăm I (%)", value: "disc_percent_i" },
    { label: "Phần trăm S (%)", value: "disc_percent_s" },
    { label: "Phần trăm C (%)", value: "disc_percent_c" },
    { label: "Phần trăm D (số)", value: "disc_percent_d_value" },
    { label: "Phần trăm I (số)", value: "disc_percent_i_value" },
    { label: "Phần trăm S (số)", value: "disc_percent_s_value" },
    { label: "Phần trăm C (số)", value: "disc_percent_c_value" },
    { label: "Nhóm phụ hỗ trợ", value: "disc_support_type" },
    { label: "Danh sách điểm mạnh", value: "strengths" },
    { label: "Hành vi học tập và làm việc", value: "behaviors" },
    { label: "Định hướng nghề nghiệp", value: "careerSuggestions" },
    { label: "AI Reasoning (Lý do chọn nghề)", value: "ai_career_reasoning" },
    { label: "AI Top Careers (Top nghề)", value: "ai_top_careers" },
    { label: "Cách ra quyết định", value: "core_decision_style" },
    { label: "Môi trường phù hợp", value: "ideal_work_environment" },
    { label: "Cách phát huy năng lực", value: "best_energy_use" },
    { label: "Nghề phù hợp 1", value: "career_fit_1" },
    { label: "Nghề phù hợp 2", value: "career_fit_2" },
    { label: "Nghề phù hợp 3", value: "career_fit_3" },
    { label: "Nghề cần cân nhắc 1", value: "career_caution_1" },
    { label: "Nghề cần cân nhắc 2", value: "career_caution_2" },
    { label: "Vai trò phù hợp", value: "preferred_role" },
    { label: "Cách học phù hợp", value: "learning_style" },
    { label: "Nhịp phát triển", value: "career_pace" },
    { label: "Văn bản tùy chỉnh", value: "custom" },
];

const PAID_CARD_KEYS = new Set([
    "disc_primary_axis",
    "disc_secondary_axis",
    "disc_low_zone",
    "disc_combination",
    "disc_archetype",
    "disc_strengths",
    "disc_weaknesses",
    "disc_motivation",
    "disc_stress_behavior",
    "disc_communication_style",
    "disc_work_environment",
    "disc_career_fields",
    "disc_work_roles",
]);

const applyPaidCardDefaults = (key, item) => {
    if (!PAID_CARD_KEYS.has(key)) return { ...item, key };
    if (item?.appearance || item?.backgroundColor || item?.borderColor) {
        return { ...item, key };
    }
    return {
        ...item,
        key,
        appearance: "card",
        backgroundColor: "#DEF6CC",
        borderColor: "#B7D99A",
        borderWidth: item?.borderWidth ?? 1.5,
        radius: item?.radius ?? 18,
        padding: item?.padding ?? 18,
    };
};

const PdfTemplateEditor = ({ settings, onUpdate, onSave, loading, onClose }) => {
    const [templateType, setTemplateType] = useState("FREE");
    const [fieldsByTemplate, setFieldsByTemplate] = useState({ FREE: [], PAID: [] });
    const [previewLoading, setPreviewLoading] = useState(false);
    const [activePage, setActivePage] = useState(1);
    const [draggedField, setDraggedField] = useState(null);
    const [resizingField, setResizingField] = useState(null);
    const [renderWidth, setRenderWidth] = useState(null);
    const startXRef = useRef(0);
    const startYRef = useRef(0);
    const startWidthRef = useRef(0);
    const startHeightRef = useRef(0);
    const containerRef = useRef(null);
    const previewWrapperRef = useRef(null);

    // PDF Preview State
    const [pdfBlob, setPdfBlob] = useState(null);
    const [numPages, setNumPages] = useState(null);
    const [pageDimensions, setPageDimensions] = useState({ width: 595, height: 842 }); // Default A4
    const [renderedPageDimensions, setRenderedPageDimensions] = useState({ width: 595, height: 842 });

    const fields = fieldsByTemplate[templateType] || [];
    const dataSources = useMemo(() => {
        const customSources = Array.from(
            new Map(
                normalizePdfCustomVariables(settings?.pdfCustomVariables).map((item) => [item.token, item])
            ).values()
        ).map((item) => ({
            label: `Biến tùy chỉnh ${formatPdfVariableToken(item.token)}`,
            value: formatPdfVariableToken(item.token),
        }));
        return [...DATA_SOURCES, ...customSources];
    }, [settings?.pdfCustomVariables]);

    const updateCurrentFields = (updater) => {
        setFieldsByTemplate((prev) => {
            const current = prev[templateType] || [];
            const next = typeof updater === 'function' ? updater(current) : updater;
            return { ...prev, [templateType]: next };
        });
    };

    // Clone PDF Blob for viewer to prevent worker thread detention issues
    const pdfFileForViewer = useMemo(() => {
        if (!pdfBlob) return null;
        try {
            return pdfBlob.slice(0);
        } catch (error) {
            console.error("Failed to clone PDF blob", error);
            return null;
        }
    }, [pdfBlob]);


    useEffect(() => {
        // Load initial settings for both templates
        const flattenConfig = (config, selectedTemplate) => {
            if (!config) return [];
            return Object.entries(config).flatMap(([key, list]) =>
                (list || []).map(item => (
                    selectedTemplate === "PAID"
                        ? applyPaidCardDefaults(key, item)
                        : { ...item, key }
                ))
            );
        };

        setFieldsByTemplate({
            FREE: flattenConfig(settings?.pdfTemplateConfig, "FREE"),
            PAID: flattenConfig(settings?.pdfTemplateConfigPaid, "PAID"),
        });
    }, [settings]);

    // Load base PDF
    const loadBasePdf = async (selectedTemplate = templateType) => {
        setPreviewLoading(true);
        setPdfBlob(null);
        setNumPages(null);
        try {
            const response = await pdfExportAPI.previewConfig({
                pdfTemplateConfig: {},
                templateType: selectedTemplate
            });
            // Ensure we get an ArrayBuffer or Blob properly
            const blob = new Blob([response.data], { type: 'application/pdf' });
            // Convert Blob to ArrayBuffer for reliability with react-pdf if needed, 
            // but react-pdf handles Blobs fine. 
            // However, our reference project used ArrayBuffer. Let's stick to Blob for now inside react-pdf document 
            // but ensure we pass a stable reference.
            setPdfBlob(blob);
        } catch (error) {
            console.error("Failed to load base PDF", error);
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        loadBasePdf(templateType);
    }, [templateType]);

    useEffect(() => {
        if (!previewWrapperRef.current) return;
        const element = previewWrapperRef.current;
        const paddingX = 64; // p-8 left + right
        const updateWidth = () => {
            const next = Math.max(320, element.clientWidth - paddingX);
            setRenderWidth(next);
        };

        updateWidth();
        if (typeof ResizeObserver !== "undefined") {
            const observer = new ResizeObserver(updateWidth);
            observer.observe(element);
            return () => observer.disconnect();
        }

        window.addEventListener("resize", updateWidth);
        return () => window.removeEventListener("resize", updateWidth);
    }, []);

    const handleTemplateSwitch = (nextTemplate) => {
        if (nextTemplate === templateType) return;
        setTemplateType(nextTemplate);
        setActivePage(1);
        setDraggedField(null);
        setResizingField(null);
    };

    const createDefaultField = (key = "user_name") => ({
        key,
        page: activePage,
        x: 50, // Initial Point X
        y: 500, // Initial Point Y (Bottom-Left origin approximation)
        width: 220,
        height: 60,
        fontSize: 12,
        color: "#000000",
        align: "left",
        appearance: "plain",
        backgroundColor: "",
        borderColor: "",
        borderWidth: 0,
        radius: 24,
        padding: 22,
        verticalAlign: "top",
    });

    const handleAddField = () => {
        updateCurrentFields((current) => ([...current, createDefaultField("user_name")]));
    };

    const handleQuickAddField = (key) => {
        updateCurrentFields((current) => ([
            ...current,
            {
                ...createDefaultField(key),
                x: 80,
                y: Math.max(80, 650 - (current.length * 22)),
            },
        ]));
    };

    const handleRemoveField = (index) => {
        updateCurrentFields((current) => current.filter((_, i) => i !== index));
    };

    const handleChange = (index, field, value) => {
        updateCurrentFields((current) => {
            const newFields = [...current];
            newFields[index] = { ...newFields[index], [field]: value };
            return newFields;
        });
    };

    const handleSaveLocal = () => {
        const buildConfigMap = (items) => items.reduce((acc, item) => {
            // Apply defaults to ensure data integrity
            const itemToSave = {
                ...item,
                width: item.width || 220,
                height: item.height || 60,
                fontSize: item.fontSize || 12,
                color: item.color || "#000000",
                align: item.align || "left"
            };

            if (!acc[itemToSave.key]) acc[itemToSave.key] = [];
            acc[itemToSave.key].push(itemToSave);
            return acc;
        }, {});

        const freeConfig = buildConfigMap(fieldsByTemplate.FREE || []);
        const paidConfig = buildConfigMap(fieldsByTemplate.PAID || []);

        const updates = {
            pdfTemplateConfig: freeConfig,
            pdfTemplateConfigPaid: paidConfig
        };

        console.log("💾 Saving PDF config:", JSON.stringify(updates, null, 2));

        if (onSave) {
            onSave(updates);
        } else {
            onUpdate(updates);
        }
    };

    const handleFullPreview = async () => {
        setPreviewLoading(true);
        try {
            const configMap = fields.reduce((acc, item) => {
                if (!acc[item.key]) acc[item.key] = [];
                acc[item.key].push(item);
                return acc;
            }, {});

            const payload = { pdfTemplateConfig: configMap, templateType };
            console.log("👁️ Preview config:", JSON.stringify(payload, null, 2));

            const response = await pdfExportAPI.previewConfig(payload);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error) {
            console.error("Preview failed", error);
            toast.error("Lỗi khi tạo bản xem trước: " + (error.message || "Unknown error"));
        } finally {
            setPreviewLoading(false);
        }
    };

    // Drag and Drop Logic
    const handleMouseDown = (e, index) => {
        if (resizingField !== null) return; // Ignore drag if resizing
        e.preventDefault();
        e.stopPropagation();
        setDraggedField(index);
    };

    const handleResizeStart = (e, index) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingField(index);
        startXRef.current = e.clientX;
        startYRef.current = e.clientY;
        startWidthRef.current = fields[index].width || 220;
        startHeightRef.current = fields[index].height || 60;
    };

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;

        // Handle Resizing
        if (resizingField !== null) {
            const { width: pdfWidth, height: pdfHeight } = pageDimensions;
            const rect = containerRef.current.getBoundingClientRect();
            const dx = e.clientX - startXRef.current;
            const dy = e.clientY - startYRef.current;

            // Convert screen pixels -> PDF points
            const pointDx = rect.width > 0 ? (dx / rect.width) * pdfWidth : dx;
            const pointDy = rect.height > 0 ? (dy / rect.height) * pdfHeight : dy;

            const newWidth = Math.max(20, Math.round(startWidthRef.current + pointDx));
            const newHeight = Math.max(20, Math.round(startHeightRef.current + pointDy));

            updateCurrentFields((current) => {
                const newFields = [...current];
                newFields[resizingField] = {
                    ...newFields[resizingField],
                    width: newWidth,
                    height: newHeight,
                };
                return newFields;
            });
            return;
        }

        // Handle Dragging
        if (draggedField !== null) {
            const rect = containerRef.current.getBoundingClientRect();
            const { width: pdfWidth, height: pdfHeight } = pageDimensions;

            // Mouse position relative to container (0 to rect.width)
            const relX = e.clientX - rect.left;
            const relY = e.clientY - rect.top;

            // Convert DOM coordinates (Top-Left) to ratio
            // Remove clamping to allow dragging outside page limits if needed
            const ratioX = relX / rect.width;
            const ratioY = relY / rect.height;

            // Convert Ratio to PDF Points
            const newX = Math.round(ratioX * pdfWidth);
            // PDF Y (Bottom-Left) - Adjust for Baseline (Top of box - fontSize)
            // Visual Top is at (1-ratioY)*Height. We want Y (Baseline) to be below that.
            // Wait, (1-ratioY)*Height IS the point from Bottom to the Click/Drag position (Top).
            // So that is the "Top" Y coordinate in PDF space.
            // Baseline Y = Top Y - FontSize.
            const boxHeight = fields[draggedField].height || fields[draggedField].fontSize || 12;
            const newY = Math.round(((1 - ratioY) * pdfHeight) - boxHeight);

            updateCurrentFields((current) => {
                const newFields = [...current];
                newFields[draggedField] = { ...current[draggedField], x: newX, y: newY };
                return newFields;
            });
        }
    };

    const handleMouseUp = () => {
        setDraggedField(null);
        setResizingField(null);
    };

    useEffect(() => {
        if (draggedField !== null || resizingField !== null) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [draggedField, resizingField]);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    function onPageLoadSuccess(page) {
        // CRITICAL FIX: Calculate original PDF dimensions correctly
        // page.originalWidth and page.originalHeight are the TRUE PDF point dimensions
        // page.width and page.height are RENDERED dimensions (may be scaled or width-constrained)

        // Get the true PDF point dimensions from the page
        // page.view gives us [x1, y1, x2, y2] where dimensions are (x2-x1) x (y2-y1)
        const originalWidth = page.view[2] - page.view[0];  // True PDF width in points
        const originalHeight = page.view[3] - page.view[1]; // True PDF height in points

        setPageDimensions({
            width: originalWidth,
            height: originalHeight
        });

        setRenderedPageDimensions({
            width: page.width,
            height: page.height
        });

        console.log("✓ Page Loaded - Rendered Size:", page.width, "x", page.height,
            "| Original PDF Points:", originalWidth, "x", originalHeight);
    }

    return (
        <div className="flex flex-col bg-base-100 rounded-none h-full w-full">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b bg-base-100 shadow-sm z-10">
                <div className="flex items-center gap-4">
                    {onClose && (
                        <button type="button" onClick={onClose} className="btn btn-sm btn-circle btn-ghost">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                    <div>
                        <h2 className="text-xl font-bold">Cấu hình Export PDF</h2>
                        <p className="text-sm text-base-content/70">Kéo thả &rarr; Tự động lưu tọa độ chuẩn Java (iText)</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button type="button" className="btn btn-sm btn-ghost" onClick={() => loadBasePdf(templateType)} disabled={previewLoading}>
                        <RefreshCw className={`w-4 h-4 ${previewLoading ? 'animate-spin' : ''}`} />
                    </button>

                    <div className="join">
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${templateType === 'FREE' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleTemplateSwitch('FREE')}
                        >
                            Free PDF
                        </button>
                        <button
                            type="button"
                            className={`join-item btn btn-sm ${templateType === 'PAID' ? 'btn-primary' : 'btn-ghost'}`}
                            onClick={() => handleTemplateSwitch('PAID')}
                        >
                            Paid PDF
                        </button>
                    </div>

                    <div className="join">
                        <button type="button" className="join-item btn btn-sm" disabled={activePage <= 1} onClick={() => setActivePage(p => p - 1)}>«</button>
                        <button type="button" className="join-item btn btn-sm no-animation bg-base-200">Page {activePage} / {numPages || '--'}</button>
                        <button type="button" className="join-item btn btn-sm" disabled={numPages && activePage >= numPages} onClick={() => setActivePage(p => p + 1)}>»</button>
                    </div>

                    <div className="w-px bg-base-300 mx-2"></div>
                    <button type="button" className="btn btn-sm btn-outline" onClick={handleFullPreview} disabled={loading || previewLoading}>
                        <Eye className="w-4 h-4 mr-2" /> Preview
                    </button>
                    <button type="button" className="btn btn-sm btn-primary" onClick={handleSaveLocal} disabled={loading}>
                        <Save className="w-4 h-4 mr-2" /> Save
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Visual Editor (Left) */}
                <div ref={previewWrapperRef} className="flex-1 bg-base-200/50 p-8 overflow-auto flex justify-center relative">
                    {/* 
                        Container logic:
                        - Fixed pixel width (e.g., 600px) to render the PDF page.
                        - React-PDF renders page into canvas.
                        - We calculate coordinates relative to this container -> map to PDF Points.
                     */}
                    <div
                        ref={containerRef}
                        className="relative shadow-2xl transition-all origin-top bg-white"
                        style={{
                            // Remove fixed width, let it adapt to the PDF Page
                            display: 'inline-block',
                            minWidth: 'min-content',
                            minHeight: 'min-content',
                        }}
                    >
                        {pdfFileForViewer && (
                            <Document
                                file={pdfFileForViewer}
                                onLoadSuccess={onDocumentLoadSuccess}
                                loading={<div className="h-[800px] flex items-center justify-center w-[595px]">Loading PDF...</div>}
                                className="border border-base-content/10"
                            >
                                <Page
                                    pageNumber={activePage}
                                    // Scale 1.0 means 1 CSS pixel = 1 PDF Point (approx 72dpi standard)
                                    // If we want it bigger, we increase scale. 
                                    width={renderWidth || undefined}
                                    scale={renderWidth ? undefined : 1.2}
                                    onLoadSuccess={onPageLoadSuccess}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            </Document>
                        )}

                        {!pdfFileForViewer && (
                            <div className="h-[800px] w-[595px] flex items-center justify-center border-2 border-dashed border-base-300 text-base-content/30">
                                No PDF Loaded
                            </div>
                        )}

                        {/* Overlay Layer */}
                        {/* We must position absolute on top of the Page.
                            Since Page with scale > 1 changes dimensions, we must ensure our Overlay matches the Rendered dimensions.
                            The containerRef wraps the Document, so its size should match the rendered page.
                        */}
                        <div className="absolute inset-0 w-full h-full pointer-events-none">
                            {fields.filter(f => (f.page || 1) === activePage).map((field, index) => {
                                const globalIndex = fields.indexOf(field); // Find real index in main array
                                const isSelected = draggedField === globalIndex || resizingField === globalIndex;
                                const appearance = (field.appearance || (field.backgroundColor ? "highlight" : "plain")).toLowerCase();

                                // Convert PDF Points (Bottom-Left) back to % for Display (Top-Left)
                                // PDF: (0,0) is Bottom-Left. 
                                // CSS: (0,0) is Top-Left.
                                // We stored Y as Baseline.
                                // Visual Top (in PDF space) = Y + FontSize.
                                // CSS Top % = 1 - (Top_PDF / Height).
                                const fontSize = field.fontSize || 12;
                                const boxWidth = field.width || 220;
                                const boxHeight = field.height || 60;
                                const topPdf = field.y + boxHeight;
                                const leftPercent = (field.x / pageDimensions.width) * 100;
                                const topPercent = (1 - (topPdf / pageDimensions.height)) * 100;

                                // Keep on-screen size in sync with PDF point size at current render scale
                                const scaleX = pageDimensions.width > 0 ? (renderedPageDimensions.width / pageDimensions.width) : 1;
                                const scaleY = pageDimensions.height > 0 ? (renderedPageDimensions.height / pageDimensions.height) : 1;
                                const renderScale = Number.isFinite(Math.min(scaleX, scaleY)) && Math.min(scaleX, scaleY) > 0
                                    ? Math.min(scaleX, scaleY)
                                    : 1;
                                const visualFontSize = Math.max(1, fontSize * renderScale);
                                const visualWidth = Math.max(12, boxWidth * renderScale);
                                const visualHeight = Math.max(12, boxHeight * renderScale);
                                const visualRadius = Math.max(6, (field.radius || (appearance === "card" ? 24 : 10)) * renderScale);
                                const visualBorderWidth = Math.max(1, (field.borderWidth || (appearance === "card" ? 1.5 : 1)) * renderScale);
                                const overlayBackground = appearance === "card"
                                    ? (field.backgroundColor || "#d8efc1")
                                    : field.backgroundColor || (isSelected ? "rgba(59, 130, 246, 0.12)" : "rgba(255,255,255,0.9)");
                                const overlayBorderColor = appearance === "card"
                                    ? (field.borderColor || "#b7d39f")
                                    : isSelected
                                        ? "rgba(59, 130, 246, 0.8)"
                                        : "rgba(203, 213, 225, 0.95)";
                                const overlayLabel = field.staticText
                                    || (String(field.key || "").startsWith("{")
                                        ? field.key
                                        : dataSources.find(ds => ds.value === field.key)?.label || field.key);
                                const overlayLabelFontSize = Math.max(10, visualFontSize * 0.62);
                                const overlayMetaFontSize = Math.max(9, visualFontSize * 0.5);
                                const overlayFillOpacity = appearance === "card" ? 0.12 : isSelected ? 0.08 : 0.04;

                                return (
                                    <div
                                        key={index}
                                        onMouseDown={(e) => handleMouseDown(e, globalIndex)}
                                        className={`absolute pointer-events-auto cursor-move group flex items-center gap-1 ${isSelected ? 'z-50' : 'z-10'}`}
                                        style={{
                                            left: `${leftPercent}%`,
                                            top: `${topPercent}%`,
                                            transform: 'translateY(0%)', // Removed -100% since we are positioning the TOP now
                                        }}
                                    >
                                        <div className={`
                                            relative overflow-visible transition-all
                                            ${isSelected ? 'ring-2 ring-primary/35 shadow-md' : ''}
                                        `}
                                            title={overlayLabel}
                                            style={{
                                                width: `${visualWidth}px`,
                                                height: `${visualHeight}px`,
                                                borderRadius: `${visualRadius}px`,
                                                borderWidth: `${visualBorderWidth}px`,
                                                borderStyle: isSelected ? 'solid' : 'dashed',
                                                borderColor: overlayBorderColor,
                                                background: "transparent",
                                            }}
                                        >
                                            <div
                                                className="absolute inset-0"
                                                style={{
                                                    background: overlayBackground,
                                                    opacity: overlayFillOpacity,
                                                    borderRadius: `${Math.max(visualRadius - visualBorderWidth, 0)}px`,
                                                }}
                                            />
                                            <div
                                                className="absolute -top-3 left-3 inline-flex max-w-[85%] items-center rounded-full border px-3 py-1 font-semibold shadow-sm backdrop-blur-sm"
                                                style={{
                                                    fontSize: `${overlayLabelFontSize}px`,
                                                    lineHeight: 1.1,
                                                    background: isSelected ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.96)",
                                                    color: isSelected ? "#ffffff" : field.color || "#0f172a",
                                                    borderColor: overlayBorderColor,
                                                }}
                                            >
                                                <span className="max-w-full truncate">
                                                    {overlayLabel}
                                                </span>
                                            </div>

                                            {isSelected && (
                                                <div
                                                    className="absolute -bottom-3 left-3 inline-flex rounded-full px-2 py-1 font-medium text-slate-600 shadow-sm"
                                                    style={{
                                                        fontSize: `${overlayMetaFontSize}px`,
                                                        background: "rgba(255, 255, 255, 0.96)",
                                                    }}
                                                >
                                                    {`${Math.round(boxWidth)} × ${Math.round(boxHeight)}`}
                                                </div>
                                            )}

                                            {/* Resize Handle */}
                                            {isSelected && (
                                                <div
                                                    className="absolute -right-2 -bottom-2 w-4 h-4 bg-primary cursor-se-resize rounded-full shadow border-2 border-white z-50 flex items-center justify-center"
                                                    onMouseDown={(e) => handleResizeStart(e, globalIndex)}
                                                >
                                                    <div className="w-1 h-1 bg-white rounded-full"></div>
                                                </div>
                                            )}
                                        </div>
                                        {/* Guide Line/Dot */}
                                        <div
                                            className="absolute -bottom-1 -left-1 h-2 w-2 rounded-full ring-2 ring-white"
                                            style={{ background: isSelected ? "#2563eb" : overlayBorderColor }}
                                        ></div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Sidebar - Properties */}
                <div className="w-80 bg-base-100 border-l border-base-200 overflow-y-auto p-4 custom-scrollbar">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-sm uppercase text-base-content/50">Fields</h3>
                            <button type="button" className="btn btn-xs btn-outline btn-primary" onClick={handleAddField}>
                                <Plus className="w-3 h-3 mr-1" /> Add
                            </button>
                        </div>

                        <div className="space-y-2">
                            <p className="text-[11px] font-semibold uppercase text-base-content/40">Quick add</p>
                            <div className="flex flex-wrap gap-2">
                                <button type="button" className="btn btn-xs btn-outline" onClick={() => handleQuickAddField('strengths')}>
                                    Danh sách điểm mạnh
                                </button>
                                <button type="button" className="btn btn-xs btn-outline" onClick={() => handleQuickAddField('behaviors')}>
                                    Hành vi học tập và làm việc
                                </button>
                                <button type="button" className="btn btn-xs btn-outline" onClick={() => handleQuickAddField('careerSuggestions')}>
                                    Định hướng nghề nghiệp
                                </button>
                            </div>
                        </div>

                        {fields.map((field, index) => (
                            <div key={index} className={`collapse collapse-arrow border border-base-200 bg-base-50 rounded-lg ${(field.page || 1) !== activePage ? 'opacity-40' : ''}`}>
                                <input type="checkbox" />
                                <div className="collapse-title text-sm font-medium pr-8 truncate">
                                    {field.key} <span className="text-xs font-normal opacity-50">#p{field.page}</span>
                                </div>
                                <div className="collapse-content space-y-2 pt-0">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">X</label>
                                            <input type="number" className="input input-xs input-bordered" value={Math.round(field.x)} onChange={(e) => handleChange(index, "x", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Y</label>
                                            <input type="number" className="input input-xs input-bordered" value={Math.round(field.y)} onChange={(e) => handleChange(index, "y", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">W</label>
                                            <input type="number" className="input input-xs input-bordered" value={Math.round(field.width || 220)} onChange={(e) => handleChange(index, "width", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">H</label>
                                            <input type="number" className="input input-xs input-bordered" value={Math.round(field.height || 60)} onChange={(e) => handleChange(index, "height", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Font Size</label>
                                            <input type="number" className="input input-xs input-bordered" value={field.fontSize || 12} onChange={(e) => handleChange(index, "fontSize", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Align</label>
                                            <select className="select select-bordered select-xs w-full" value={field.align || 'left'} onChange={(e) => handleChange(index, "align", e.target.value)}>
                                                <option value="left">Left</option>
                                                <option value="center">Center</option>
                                                <option value="right">Right</option>
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Appearance</label>
                                            <select className="select select-bordered select-xs w-full" value={field.appearance || 'plain'} onChange={(e) => handleChange(index, "appearance", e.target.value)}>
                                                <option value="plain">Plain</option>
                                                <option value="highlight">Highlight</option>
                                                <option value="card">Card</option>
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">V Align</label>
                                            <select className="select select-bordered select-xs w-full" value={field.verticalAlign || 'top'} onChange={(e) => handleChange(index, "verticalAlign", e.target.value)}>
                                                <option value="top">Top</option>
                                                <option value="middle">Middle</option>
                                                <option value="bottom">Bottom</option>
                                            </select>
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Text Color</label>
                                            <input type="text" className="input input-xs input-bordered" placeholder="#111111" value={field.color || ""} onChange={(e) => handleChange(index, "color", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Background</label>
                                            <input type="text" className="input input-xs input-bordered" placeholder="#d8efc1" value={field.backgroundColor || ""} onChange={(e) => handleChange(index, "backgroundColor", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Border</label>
                                            <input type="text" className="input input-xs input-bordered" placeholder="#b7d39f" value={field.borderColor || ""} onChange={(e) => handleChange(index, "borderColor", e.target.value)} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Border W</label>
                                            <input type="number" className="input input-xs input-bordered" value={field.borderWidth ?? 0} onChange={(e) => handleChange(index, "borderWidth", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Radius</label>
                                            <input type="number" className="input input-xs input-bordered" value={field.radius ?? 24} onChange={(e) => handleChange(index, "radius", Number(e.target.value))} />
                                        </div>
                                        <div className="form-control">
                                            <label className="label text-xs pb-0">Padding</label>
                                            <input type="number" className="input input-xs input-bordered" value={field.padding ?? 22} onChange={(e) => handleChange(index, "padding", Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="form-control w-full">
                                        <label className="label text-xs pb-1">Data Source</label>
                                        <select
                                            className="select select-bordered select-xs w-full"
                                            value={field.key}
                                            onChange={(e) => handleChange(index, "key", e.target.value)}
                                        >
                                            {dataSources.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button type="button" className="btn btn-xs btn-ghost text-error" onClick={() => handleRemoveField(index)}>
                                            <Trash2 className="w-3 h-3" /> Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PdfTemplateEditor;
