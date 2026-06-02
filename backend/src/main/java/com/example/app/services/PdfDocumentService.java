package com.example.app.services;

import com.example.app.models.AppUser;
import com.example.app.models.Result;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Period;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.PDPageContentStream.AppendMode;
import org.apache.pdfbox.pdmodel.font.PDType0Font;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PdfDocumentService {
  private static final String FREE_BASE_PDF_RESOURCE = "/pdf/disc-report-base.pdf";
  private static final String PAID_BASE_PDF_RESOURCE = "/pdf/disc-report-paid-base.pdf";
  private static final String FONT_RESOURCE = "/fonts/NotoSans-Regular.ttf";
  private static final float DEFAULT_FONT_SIZE = 12f;
  private static final float DEFAULT_FIELD_WIDTH = 220f;
  private static final float DEFAULT_FIELD_HEIGHT = 60f;
  private static final float DEFAULT_LEFT_PADDING = 4f;
  private static final float DEFAULT_TOP_PADDING = 6f;
  private static final float DEFAULT_CARD_PADDING = 22f;
  private static final float DEFAULT_CARD_RADIUS = 24f;
  private static final float DEFAULT_CARD_BORDER_WIDTH = 1.5f;
  private static final float DEFAULT_INSIGHT_CARD_PADDING = 18f;
  private static final float DEFAULT_INSIGHT_CARD_RADIUS = 18f;
  private static final float ROUND_RECT_BEZIER = 0.552284749831f;
  private static final String DEFAULT_INSIGHT_CARD_BACKGROUND = "#DEF6CC";
  private static final String DEFAULT_INSIGHT_CARD_BORDER = "#B7D99A";
  private static final float CONTACT_PHONE_Y_NORMALIZED = 244f;
  private static final float CONTACT_EMAIL_Y_NORMALIZED = 206f;
  private static final float CONTACT_ADDRESS_Y_NORMALIZED = 168f;
  private static final List<String> DISC_DIMENSIONS = List.of("D", "I", "S", "C");
  private static final List<String> BIG_FIVE_DIMENSIONS = List.of(
      "openness",
      "conscientiousness",
      "extraversion",
      "agreeableness",
      "neuroticism");
  private static final List<String> IKIGAI_DIMENSIONS = List.of(
      "passion",
      "strength",
      "value",
      "opportunity");
  private static final DateTimeFormatter DATE_FORMAT =
      DateTimeFormatter.ofPattern("dd/MM/yyyy", Locale.ROOT);
  private static final Map<String, String> DECISION_STYLES = Map.of(
      "D", "Nhanh, hướng kết quả",
      "I", "Theo cơ hội, kết nối",
      "S", "Chắc chắn, ổn định",
      "C", "Theo dữ liệu, logic");
  private static final Map<String, String> WORK_ENVIRONMENTS = Map.of(
      "D", "Mục tiêu rõ, chủ động",
      "I", "Năng động, nhiều tương tác",
      "S", "Ổn định, có đội nhóm",
      "C", "Quy trình rõ, đủ dữ liệu");
  private static final Map<String, String> ENERGY_STYLES = Map.of(
      "D", "Dẫn dắt, đẩy tiến độ",
      "I", "Kết nối và lan tỏa",
      "S", "Duy trì và phối hợp",
      "C", "Phân tích và tối ưu");
  private static final Map<String, String> ROLE_STYLES = Map.of(
      "D", "Chủ động, chịu trách nhiệm",
      "I", "Giao tiếp, tạo ảnh hưởng",
      "S", "Hỗ trợ, đồng hành",
      "C", "Phân tích và tối ưu");
  private static final Map<String, String> LEARNING_STYLES = Map.of(
      "D", "Mục tiêu rõ, phản hồi nhanh",
      "I", "Tương tác, trình bày, thực hành",
      "S", "Học theo lộ trình ổn định",
      "C", "Có hệ thống, hiểu sâu");
  private static final Map<String, String> CAREER_PACES = Map.of(
      "D", "Tăng tốc, tiến sớm",
      "I", "Mở rộng qua trải nghiệm và quan hệ",
      "S", "Đi đều, chắc và bền",
      "C", "Tiến chậm mà sâu bằng chuyên môn");
  private static final Map<String, String> BIG_FIVE_LABELS = Map.of(
      "openness", "cởi mở",
      "conscientiousness", "tận tâm",
      "extraversion", "hướng ngoại",
      "agreeableness", "dễ hợp tác",
      "neuroticism", "nhạy cảm cảm xúc");
  private static final Map<String, String> IKIGAI_LABELS = Map.of(
      "passion", "điều bạn thực sự thích",
      "strength", "điểm mạnh có thể phát huy",
      "value", "giá trị bạn muốn tạo ra",
      "opportunity", "cơ hội có thể chuyển thành kết quả");
  private static final Map<String, String> PERSONALITY_ARCHETYPES = Map.of(
      "D", "Người dẫn dắt",
      "I", "Nhà sáng tạo",
      "C", "Nhà phân tích",
      "S", "Người hỗ trợ");
  private static final Map<String, List<String>> FALLBACK_CAREERS = Map.of(
      "D", List.of("Sales Manager", "Business Development", "Project Manager"),
      "I", List.of("Marketing Executive", "Account Manager", "Trainer"),
      "S", List.of("Customer Success", "Academic Advisor", "HR Operations"),
      "C", List.of("Data Analyst", "QA Specialist", "Financial Analyst"));
  private static final Map<String, List<String>> CAREER_CAUTIONS = Map.of(
      "D", List.of(
          "Công việc lặp lại, bị kiểm soát chặt",
          "Môi trường chậm, ít quyền quyết định"),
      "I", List.of(
          "Công việc ít tương tác, thiên về số liệu",
          "Môi trường quá khô, ít không gian kết nối"),
      "S", List.of(
          "Sales KPI áp lực cao",
          "Môi trường biến động liên tục, đổi nhanh"),
      "C", List.of(
          "Vai trò cảm tính, thiếu quy trình",
          "Công việc chốt nhanh nhưng thiếu dữ liệu"));

  private static final Set<String> DEFAULT_INSIGHT_CARD_KEYS = Set.of(
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
      "disc_work_roles");

  private final AdminSettingsService adminSettingsService;
  private final ObjectMapper objectMapper;

  public byte[] buildReportPdf(TestSession session, Result result) {
    String templateConfigKey = resolveTemplateConfigKey(session);
    Map<String, Object> settings = safeSettings(adminSettingsService.get());
    Map<String, Object> templateConfig = extractTemplateConfig(settings, templateConfigKey);

    return renderConfiguredPdf(
        resolveBasePdfResource(templateConfigKey),
        templateConfig,
        buildFieldValues(session, result, settings));
  }

  public byte[] buildTemplatePreviewPdf(String templateType, Map<String, Object> templateConfig) {
    String resolvedTemplateType = resolveTemplateType(templateType);
    Map<String, Object> effectiveTemplateConfig = templateConfig == null ? Map.of() : templateConfig;
    Map<String, Object> settings = safeSettings(adminSettingsService.get());
    return renderConfiguredPdf(
        resolveBasePdfResourceForTemplate(resolvedTemplateType),
        effectiveTemplateConfig,
        buildPreviewValues(resolvedTemplateType, settings));
  }

  private byte[] renderConfiguredPdf(
      String basePdfResource,
      Map<String, Object> templateConfig,
      Map<String, String> fieldValues) {
    byte[] basePdf = readRequiredResource(basePdfResource);
    List<FieldPlacement> placements = flattenTemplateConfig(templateConfig);

    if (placements.isEmpty()) {
      return basePdf;
    }

    try (PDDocument document = Loader.loadPDF(basePdf);
         InputStream fontStream = requiredResourceStream(FONT_RESOURCE)) {
      PDType0Font font = PDType0Font.load(document, fontStream);
      Map<Integer, List<FieldPlacement>> placementsByPage = groupByPage(placements);

      for (Map.Entry<Integer, List<FieldPlacement>> entry : placementsByPage.entrySet()) {
        int pageIndex = entry.getKey();
        if (pageIndex < 0 || pageIndex >= document.getNumberOfPages()) {
          continue;
        }

        PDPage page = document.getPage(pageIndex);
        try (PDPageContentStream contentStream =
                 new PDPageContentStream(document, page, AppendMode.APPEND, true, true)) {
          for (FieldPlacement placement : entry.getValue()) {
            String value = cleanText(fieldValues.get(placement.key));
            if (value.isBlank()) {
              continue;
            }
            drawField(contentStream, page, font, placement, value);
          }
        }
      }

      try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
        document.save(output);
        return output.toByteArray();
      }
    } catch (IOException ex) {
      throw new IllegalStateException("Failed to build PDF document", ex);
    }
  }

  private void drawField(
      PDPageContentStream contentStream,
      PDPage page,
      PDType0Font font,
      FieldPlacement placement,
      String value) throws IOException {
    float fontSize = placement.fontSize > 0 ? placement.fontSize : DEFAULT_FONT_SIZE;
    float fieldWidth = placement.width > 0 ? placement.width : DEFAULT_FIELD_WIDTH;
    float fieldHeight = placement.height > 0 ? placement.height : DEFAULT_FIELD_HEIGHT;
    float x = Math.max(0f, placement.x);
    float y = Math.max(0f, placement.y);
    float lineHeight = fontSize * 1.22f;
    float paddingX = placement.usesCardAppearance() ? placement.resolvedPaddingX() : DEFAULT_LEFT_PADDING;
    float paddingY = placement.usesCardAppearance() ? placement.resolvedPaddingY() : DEFAULT_TOP_PADDING;
    float usableHeight = Math.max(lineHeight, fieldHeight - (paddingY * 2));
    int maxLines = Math.max(1, (int) Math.floor(usableHeight / lineHeight));
    float wrappingWidth = Math.max(20f, fieldWidth - (paddingX * 2));
    List<String> lines = wrapText(value, font, fontSize, wrappingWidth, maxLines);
    if (placement.usesCardAppearance()) {
      lines = rebalanceCardLines(value, lines, font, fontSize, wrappingWidth, maxLines);
    }

    if (lines.isEmpty()) {
      return;
    }

    float pageTop = page.getMediaBox().getHeight();
    float blockHeight = fontSize + ((lines.size() - 1) * lineHeight);
    float renderX = x;
    float renderY = y;
    float renderWidth = fieldWidth;
    float renderHeight = fieldHeight;

    if (placement.usesCardAppearance()) {
      CardLayout cardLayout = resolveCardLayout(
          font,
          placement,
          lines,
          fontSize,
          lineHeight,
          x,
          y,
          fieldWidth,
          fieldHeight,
          pageTop,
          paddingX,
          paddingY);
      renderX = cardLayout.x();
      renderY = cardLayout.y();
      renderWidth = cardLayout.width();
      renderHeight = cardLayout.height();
      drawCard(contentStream, renderX, renderY, renderWidth, renderHeight, placement);
    }

    float usableWidth = Math.max(20f, renderWidth - (paddingX * 2));
    float contentBottom = renderY + paddingY;
    float contentTop = Math.min(pageTop, renderY + renderHeight - paddingY);
    float availableHeight = Math.max(0f, contentTop - contentBottom);
    float blockOffsetFromBottom = switch (placement.normalizedVerticalAlign()) {
      case "middle", "center" -> Math.max(0f, (availableHeight - blockHeight) / 2f);
      case "bottom" -> 0f;
      default -> Math.max(0f, availableHeight - blockHeight);
    };
    float initialBaseline = Math.min(
        pageTop - fontSize,
        contentBottom + blockOffsetFromBottom + ((lines.size() - 1) * lineHeight));

    if (!placement.usesCardAppearance() && placement.usesHighlightAppearance()) {
      contentStream.setNonStrokingColor(parseColor(placement.backgroundColor));
      float lastBaseline = initialBaseline - ((lines.size() - 1) * lineHeight);
      float backgroundBottom = Math.max(y, lastBaseline - (fontSize * 0.35f) - DEFAULT_TOP_PADDING);
      float backgroundTop = Math.min(pageTop, initialBaseline + fontSize + DEFAULT_TOP_PADDING);
      float backgroundHeight = Math.max(fontSize + (DEFAULT_TOP_PADDING * 2), backgroundTop - backgroundBottom);
      contentStream.addRect(x, backgroundBottom, fieldWidth, backgroundHeight);
      contentStream.fill();
    }

    Color color = parseColor(placement.color);

    contentStream.setNonStrokingColor(color);
    for (int index = 0; index < lines.size(); index++) {
      String line = lines.get(index);
      float lineWidth = stringWidth(font, fontSize, line);
      float lineX = switch (placement.align.toLowerCase(Locale.ROOT)) {
        case "center" -> renderX + paddingX + Math.max(0f, (usableWidth - lineWidth) / 2f);
        case "right" -> renderX + Math.max(paddingX, renderWidth - lineWidth - paddingX);
        default -> renderX + paddingX;
      };
      float lineY = initialBaseline - (index * lineHeight);

      if (lineY < contentBottom) {
        break;
      }

      contentStream.beginText();
      contentStream.setFont(font, fontSize);
      contentStream.newLineAtOffset(lineX, lineY);
      contentStream.showText(line);
      contentStream.endText();
    }
  }

  private CardLayout resolveCardLayout(
      PDType0Font font,
      FieldPlacement placement,
      List<String> lines,
      float fontSize,
      float lineHeight,
      float x,
      float y,
      float fieldWidth,
      float fieldHeight,
      float pageTop,
      float paddingX,
      float paddingY) throws IOException {
    float blockHeight = fontSize + ((lines.size() - 1) * lineHeight);
    float widestLine = 0f;
    for (String line : lines) {
      widestLine = Math.max(widestLine, stringWidth(font, fontSize, line));
    }

    float initialContentBottom = y + paddingY;
    float initialContentTop = Math.min(pageTop, y + fieldHeight - paddingY);
    float initialAvailableHeight = Math.max(0f, initialContentTop - initialContentBottom);
    float initialBlockOffsetFromBottom = switch (placement.normalizedVerticalAlign()) {
      case "middle", "center" -> Math.max(0f, (initialAvailableHeight - blockHeight) / 2f);
      case "bottom" -> 0f;
      default -> Math.max(0f, initialAvailableHeight - blockHeight);
    };
    float initialBaseline = Math.min(
        pageTop - fontSize,
        initialContentBottom + initialBlockOffsetFromBottom + ((lines.size() - 1) * lineHeight));
    float lastBaseline = initialBaseline - ((lines.size() - 1) * lineHeight);
    float textTop = Math.min(pageTop, initialBaseline + (fontSize * 0.82f));
    float textBottom = Math.max(y, lastBaseline - (fontSize * 0.28f));

    float cardWidth = Math.min(fieldWidth, Math.max(widestLine + (paddingX * 2f), (paddingX * 2f) + 40f));
    float cardX = switch (placement.align.toLowerCase(Locale.ROOT)) {
      case "center" -> x + Math.max(0f, (fieldWidth - cardWidth) / 2f);
      case "right" -> x + Math.max(0f, fieldWidth - cardWidth);
      default -> x;
    };
    float cardBottom = Math.max(y, textBottom - paddingY);
    float cardTop = Math.min(pageTop, textTop + paddingY);
    float cardHeight = Math.min(fieldHeight, Math.max(cardTop - cardBottom, blockHeight + (paddingY * 2f)));

    return new CardLayout(cardX, cardBottom, cardWidth, cardHeight);
  }

  private List<String> wrapText(
      String rawText,
      PDType0Font font,
      float fontSize,
      float maxWidth,
      int maxLines) throws IOException {
    if (rawText == null || rawText.isBlank()) {
      return List.of();
    }

    List<String> lines = new ArrayList<>();
    String[] paragraphs = rawText.split("\\R", -1);

    outer:
    for (String paragraph : paragraphs) {
      if (paragraph.isBlank()) {
        lines.add("");
        if (lines.size() >= maxLines) {
          break;
        }
        continue;
      }

      String current = "";
      for (String word : paragraph.trim().split("\\s+")) {
        String candidate = current.isEmpty() ? word : current + " " + word;
        if (stringWidth(font, fontSize, candidate) <= maxWidth) {
          current = candidate;
          continue;
        }

        if (!current.isEmpty()) {
          lines.add(current);
          if (lines.size() >= maxLines) {
            break outer;
          }
          current = "";
        }

        for (String chunk : splitLongWord(word, font, fontSize, maxWidth)) {
          if (stringWidth(font, fontSize, chunk) <= maxWidth) {
            current = chunk;
          } else {
            lines.add(chunk);
            if (lines.size() >= maxLines) {
              break outer;
            }
          }
        }
      }

      if (!current.isEmpty()) {
        lines.add(current);
        if (lines.size() >= maxLines) {
          break;
        }
      }
    }

    if (lines.size() <= maxLines) {
      return lines;
    }

    List<String> limited = new ArrayList<>(lines.subList(0, maxLines));
    int lastIndex = limited.size() - 1;
    limited.set(lastIndex, ellipsize(limited.get(lastIndex), font, fontSize, maxWidth));
    return limited;
  }

  private List<String> rebalanceCardLines(
      String rawText,
      List<String> wrappedLines,
      PDType0Font font,
      float fontSize,
      float maxWidth,
      int maxLines) throws IOException {
    if (wrappedLines.size() < 2 || rawText == null) {
      return wrappedLines;
    }

    String normalized = cleanText(rawText);
    if (normalized.isBlank() || normalized.contains("\n") || normalized.contains("\r")) {
      return wrappedLines;
    }

    String[] words = normalized.split("\\s+");
    if (words.length <= wrappedLines.size()) {
      return wrappedLines;
    }

    int preferredLineCount = wrappedLines.size();
    int upperLineCount = Math.min(maxLines, Math.max(preferredLineCount, 3));
    LineBalanceBest best = new LineBalanceBest(lineBalanceScore(wrappedLines, font, fontSize), wrappedLines);

    for (int targetLines = preferredLineCount; targetLines <= upperLineCount; targetLines++) {
      if (words.length < targetLines) {
        break;
      }
      balanceCardWords(words, 0, targetLines, font, fontSize, maxWidth, new ArrayList<>(), best, preferredLineCount);
    }

    return best.lines();
  }

  private void balanceCardWords(
      String[] words,
      int startIndex,
      int linesRemaining,
      PDType0Font font,
      float fontSize,
      float maxWidth,
      List<String> currentLines,
      LineBalanceBest best,
      int preferredLineCount) throws IOException {
    int wordsRemaining = words.length - startIndex;
    if (wordsRemaining < linesRemaining || linesRemaining <= 0) {
      return;
    }

    if (linesRemaining == 1) {
      String candidate = joinWords(words, startIndex, words.length);
      if (candidate.isBlank() || stringWidth(font, fontSize, candidate) > maxWidth) {
        return;
      }
      currentLines.add(candidate);
      double candidateScore = lineBalanceScore(currentLines, font, fontSize)
          + Math.max(0, currentLines.size() - preferredLineCount) * 6000d;
      if (candidateScore + 1e-3 < best.score()) {
        best.update(candidateScore, currentLines);
      }
      currentLines.remove(currentLines.size() - 1);
      return;
    }

    int maxEndExclusive = words.length - (linesRemaining - 1);
    for (int endExclusive = startIndex + 1; endExclusive <= maxEndExclusive; endExclusive++) {
      String candidate = joinWords(words, startIndex, endExclusive);
      if (candidate.isBlank()) {
        continue;
      }
      if (stringWidth(font, fontSize, candidate) > maxWidth) {
        break;
      }

      currentLines.add(candidate);
      balanceCardWords(
          words,
          endExclusive,
          linesRemaining - 1,
          font,
          fontSize,
          maxWidth,
          currentLines,
          best,
          preferredLineCount);
      currentLines.remove(currentLines.size() - 1);
    }
  }

  private String joinWords(String[] words, int startInclusive, int endExclusive) {
    StringBuilder builder = new StringBuilder();
    for (int index = startInclusive; index < endExclusive; index++) {
      if (builder.length() > 0) {
        builder.append(' ');
      }
      builder.append(words[index]);
    }
    return builder.toString();
  }

  private double lineBalanceScore(
      List<String> lines,
      PDType0Font font,
      float fontSize) throws IOException {
    if (lines == null || lines.isEmpty()) {
      return Double.POSITIVE_INFINITY;
    }

    List<Double> widths = new ArrayList<>();
    double total = 0d;
    for (String line : lines) {
      double width = stringWidth(font, fontSize, line);
      widths.add(width);
      total += width;
    }

    double average = total / widths.size();
    double score = 0d;
    for (double width : widths) {
      double delta = width - average;
      score += delta * delta;
    }

    double lastLineDelta = widths.get(widths.size() - 1) - average;
    score += Math.abs(lastLineDelta) * 40d;
    return score;
  }

  private List<String> splitLongWord(
      String word,
      PDType0Font font,
      float fontSize,
      float maxWidth) throws IOException {
    if (word.isBlank()) {
      return List.of();
    }

    List<String> chunks = new ArrayList<>();
    StringBuilder current = new StringBuilder();

    for (char ch : word.toCharArray()) {
      String candidate = current.toString() + ch;
      if (stringWidth(font, fontSize, candidate) <= maxWidth || current.isEmpty()) {
        current.append(ch);
        continue;
      }

      chunks.add(current.toString());
      current = new StringBuilder().append(ch);
    }

    if (!current.isEmpty()) {
      chunks.add(current.toString());
    }

    return chunks;
  }

  private String ellipsize(String value, PDType0Font font, float fontSize, float maxWidth) throws IOException {
    String ellipsis = "...";
    if (stringWidth(font, fontSize, value) <= maxWidth) {
      return value;
    }

    String current = value;
    while (!current.isEmpty() && stringWidth(font, fontSize, current + ellipsis) > maxWidth) {
      current = current.substring(0, current.length() - 1).trim();
    }
    return current.isEmpty() ? ellipsis : current + ellipsis;
  }

  private float stringWidth(PDType0Font font, float fontSize, String value) throws IOException {
    return font.getStringWidth(value) / 1000f * fontSize;
  }

  private void drawCard(
      PDPageContentStream contentStream,
      float x,
      float y,
      float width,
      float height,
      FieldPlacement placement) throws IOException {
    float radius = placement.resolvedRadius(width, height);

    if (!placement.backgroundColor.isBlank()) {
      contentStream.setNonStrokingColor(parseColor(placement.backgroundColor));
      appendRoundedRectPath(contentStream, x, y, width, height, radius);
      contentStream.fill();
    }

    float borderWidth = placement.resolvedBorderWidth();
    if (borderWidth > 0f && !placement.borderColor.isBlank()) {
      contentStream.setLineWidth(borderWidth);
      contentStream.setStrokingColor(parseColor(placement.borderColor));
      appendRoundedRectPath(contentStream, x, y, width, height, radius);
      contentStream.stroke();
    }
  }

  private void appendRoundedRectPath(
      PDPageContentStream contentStream,
      float x,
      float y,
      float width,
      float height,
      float radius) throws IOException {
    float safeRadius = Math.max(0f, Math.min(radius, Math.min(width, height) / 2f));
    if (safeRadius <= 0f) {
      contentStream.addRect(x, y, width, height);
      return;
    }

    float control = safeRadius * ROUND_RECT_BEZIER;
    float right = x + width;
    float top = y + height;

    contentStream.moveTo(x + safeRadius, y);
    contentStream.lineTo(right - safeRadius, y);
    contentStream.curveTo(
        right - safeRadius + control, y,
        right, y + safeRadius - control,
        right, y + safeRadius);
    contentStream.lineTo(right, top - safeRadius);
    contentStream.curveTo(
        right, top - safeRadius + control,
        right - safeRadius + control, top,
        right - safeRadius, top);
    contentStream.lineTo(x + safeRadius, top);
    contentStream.curveTo(
        x + safeRadius - control, top,
        x, top - safeRadius + control,
        x, top - safeRadius);
    contentStream.lineTo(x, y + safeRadius);
    contentStream.curveTo(
        x, y + safeRadius - control,
        x + safeRadius - control, y,
        x + safeRadius, y);
    contentStream.closePath();
  }

  private Map<Integer, List<FieldPlacement>> groupByPage(List<FieldPlacement> placements) {
    Map<Integer, List<FieldPlacement>> placementsByPage = new LinkedHashMap<>();
    for (FieldPlacement placement : placements) {
      int pageIndex = Math.max(0, placement.page - 1);
      placementsByPage.computeIfAbsent(pageIndex, ignored -> new ArrayList<>()).add(placement);
    }
    return placementsByPage;
  }

  private Map<String, Object> extractTemplateConfig(Map<String, Object> settings, String key) {
    Object rawValue = settings.get(key);
    if (!(rawValue instanceof Map<?, ?> rawMap)) {
      return Map.of();
    }

    Map<String, Object> normalized = new LinkedHashMap<>();
    for (Map.Entry<?, ?> entry : rawMap.entrySet()) {
      if (entry.getKey() != null) {
        normalized.put(String.valueOf(entry.getKey()), entry.getValue());
      }
    }
    return normalized;
  }

  private Map<String, Object> safeSettings(Map<String, Object> settings) {
    return settings == null ? Map.of() : settings;
  }

  private List<FieldPlacement> flattenTemplateConfig(Map<String, Object> templateConfig) {
    if (templateConfig == null || templateConfig.isEmpty()) {
      return List.of();
    }

    List<FieldPlacement> placements = new ArrayList<>();
    for (Map.Entry<String, Object> entry : templateConfig.entrySet()) {
      if (!(entry.getValue() instanceof List<?> items)) {
        continue;
      }

      for (Object item : items) {
        if (item instanceof Map<?, ?> itemMap) {
          placements.add(FieldPlacement.from(entry.getKey(), itemMap));
        }
      }
    }

    return normalizeKnownContactPlacements(placements);
  }

  private List<FieldPlacement> normalizeKnownContactPlacements(List<FieldPlacement> placements) {
    FieldPlacement fullName = null;
    FieldPlacement phone = null;
    FieldPlacement email = null;
    FieldPlacement address = null;

    for (FieldPlacement placement : placements) {
      if (placement.page != 2) {
        continue;
      }
      if (fullName == null && isFullNameKey(placement.key)) {
        fullName = placement;
      } else if (phone == null && "phoneNumber".equals(placement.key)) {
        phone = placement;
      } else if (email == null && "email".equals(placement.key)) {
        email = placement;
      } else if (address == null && "address".equals(placement.key)) {
        address = placement;
      }
    }

    boolean looksLegacyContactLayout =
        fullName != null && isInRange(fullName.y, 288f, 296f)
            && phone != null && isInRange(phone.y, 230f, 245f)
            && email != null && isInRange(email.y, 180f, 200f)
            && address != null && isInRange(address.y, 120f, 150f);

    boolean looksV22ContactLayout =
        fullName != null && isInRange(fullName.y, 288f, 296f)
            && phone != null && isInRange(phone.y, 256f, 264f)
            && email != null && isInRange(email.y, 222f, 230f)
            && address != null && isInRange(address.y, 188f, 196f);

    if (!looksLegacyContactLayout && !looksV22ContactLayout) {
      return placements;
    }

    List<FieldPlacement> normalized = new ArrayList<>(placements.size());
    for (FieldPlacement placement : placements) {
      if (placement.page != 2) {
        normalized.add(placement);
        continue;
      }

      switch (placement.key) {
        case "phoneNumber" -> normalized.add(placement.withY(CONTACT_PHONE_Y_NORMALIZED));
        case "email" -> normalized.add(placement.withY(CONTACT_EMAIL_Y_NORMALIZED));
        case "address" -> normalized.add(placement.withY(CONTACT_ADDRESS_Y_NORMALIZED));
        default -> normalized.add(placement);
      }
    }
    return normalized;
  }

  private boolean isInRange(float value, float min, float max) {
    return value >= min && value <= max;
  }

  private boolean isFullNameKey(String key) {
    return "fullName".equals(key) || "user_name".equals(key);
  }

  private Map<String, String> buildPreviewValues(String templateType, Map<String, Object> settings) {
    Map<String, String> values = new LinkedHashMap<>();
    values.put("fullName", "Nguyễn Văn A");
    values.put("full_name", "Nguyễn Văn A");
    values.put("user_name", "Nguyễn Văn A");
    values.put("user_age", "26");
    values.put("user_gender", "Nữ");
    values.put("test_date", "08/03/2026");
    values.put("email", "nguyenvana@example.com");
    values.put("phone", "0901 234 567");
    values.put("phoneNumber", "0901 234 567");
    values.put("dob", "01/01/2000");
    values.put("address", "123 Đường Mẫu, Quận 1, TP.HCM");
    values.put("disc_primary_type", "D");
    values.put("DISC_MAIN", templateType.equals("PAID") ? "DI" : "D");
    values.put("disc_support_type", templateType.equals("PAID") ? "I" : "S");
    values.put("disc_score_d", "82");
    values.put("disc_score_i", "74");
    values.put("disc_score_s", "49");
    values.put("disc_score_c", "58");
    values.put("disc_D_score", "82");
    values.put("disc_I_score", "74");
    values.put("disc_S_score", "49");
    values.put("disc_C_score", "58");
    values.put("disc_type", templateType.equals("PAID") ? "DI" : "D");
    values.put("disc_primary", "D");
    values.put("disc_secondary", templateType.equals("PAID") ? "I" : "S");
    values.put("scoreD", "82");
    values.put("scoreI", "74");
    values.put("scoreS", "49");
    values.put("scoreC", "58");
    values.put("disc_percent_d", "31%");
    values.put("disc_percent_i", "28%");
    values.put("disc_percent_s", "19%");
    values.put("disc_percent_c", "22%");
    values.put("disc_percent_d_value", "31");
    values.put("disc_percent_i_value", "28");
    values.put("disc_percent_s_value", "19");
    values.put("disc_percent_c_value", "22");
    values.put("strengths", "- Quyết đoán\n- Giao tiếp nhanh\n- Chủ động");
    values.put("behaviors", "- Thích mục tiêu rõ ràng\n- Phản hồi nhanh\n- Tập trung hành động");
    values.put("disc_summary", "Bạn là kiểu người thiên hành động, rõ mục tiêu và tạo nhịp nhanh cho tập thể.");
    values.put("disc_strength", "- Quyết đoán\n- Chủ động\n- Truyền động lực");
    values.put("disc_limitation", "- Dễ thiếu kiên nhẫn\n- Có thể quyết nhanh khi chưa đủ dữ liệu");
    values.put("disc_work_style", "Chủ động nhận trách nhiệm, thích mục tiêu rõ và môi trường có quyền tự quyết.");
    values.put("disc_communication_style", "- Thích trao đổi ngắn gọn\n- Phản hồi nhanh\n- Ưu tiên hành động");
    values.put("big5_openness", "4.2");
    values.put("big5_conscientiousness", "4.4");
    values.put("big5_extraversion", "3.8");
    values.put("big5_agreeableness", "3.6");
    values.put("big5_neuroticism", "2.3");
    values.put("big5_summary", "Nổi bật ở tận tâm và cởi mở; bạn vừa thích học cái mới, vừa giữ được kỷ luật và chuẩn mực khi hành động.");
    values.put("big5_thinking_style", "Tư duy cởi mở nhưng có cấu trúc; bạn tiếp nhận ý tưởng mới tốt và thường sắp xếp lại thành hướng đi rõ ràng.");
    values.put("big5_emotional_style", "Khá ổn định cảm xúc, giao tiếp tương đối cởi mở và nhìn chung hợp tác tốt với người xung quanh.");
    values.put("ikigai_passion", "4.5");
    values.put("ikigai_strength", "4.1");
    values.put("ikigai_value", "4.3");
    values.put("ikigai_opportunity", "3.9");
    values.put("ikigai_summary", "Bạn có động lực khá rõ ở điều mình yêu thích, điều mình làm tốt và giá trị muốn tạo ra cho người khác.");
    values.put("ikigai_potential", "Tiềm năng phát triển cao khi được đặt vào vai trò vừa có ý nghĩa, vừa cho phép bạn dùng thế mạnh một cách cụ thể.");
    values.put("ikigai_direction", "Nên ưu tiên các hướng đi giao nhau giữa đam mê, năng lực đã chứng minh, nhu cầu thị trường và khả năng tạo thu nhập bền vững.");
    values.put("personality_archetype", "Người dẫn dắt");
    values.put("personality_tagline", "Dẫn dắt rõ ràng, truyền động lực và kéo tập thể về phía mục tiêu.");
    values.put("career_top1", "Sales Manager");
    values.put("career_top2", "Business Development");
    values.put("career_top3", "Project Manager");
    values.put("career_description", "Phù hợp với các vai trò cần dẫn dắt mục tiêu, tạo đà cho đội nhóm và chuyển cơ hội thành kết quả cụ thể.");
    values.put("growth_advice", "Đặt mục tiêu ngắn hạn rõ ràng, theo dõi tiến độ hàng tuần và chủ động xin phản hồi sớm để điều chỉnh nhanh.");
    values.put("development_focus", "Tập trung vào điều bạn làm tốt nhất, gắn nó với giá trị muốn tạo ra và duy trì nhịp cải thiện đều.");
    values.put("final_summary", "Bạn là kiểu người chủ động tạo đà, phù hợp với hướng phát triển vừa có mục tiêu rõ vừa cho phép phát huy thế mạnh cá nhân.");
    values.put("careerSuggestions", "- Sales\n- Marketing\n- Quản lý kinh doanh");
    values.put("ai_career_reasoning", "Bạn phù hợp với vai trò cần sức ảnh hưởng, tốc độ và khả năng dẫn dắt.");
    values.put("ai_top_careers", "Sales Manager, Business Development, Brand Lead");
    values.put("custom", "Nội dung tùy chỉnh");
    values.put("core_decision_style", DECISION_STYLES.get("D"));
    values.put("ideal_work_environment", WORK_ENVIRONMENTS.get("D"));
    values.put("best_energy_use", ENERGY_STYLES.get("D"));
    values.put("career_fit_1", "Sales Manager");
    values.put("career_fit_2", "Business Development");
    values.put("career_fit_3", "Project Manager");
    values.put("career_caution_1", "Công việc lặp lại, bị kiểm soát chặt");
    values.put("career_caution_2", "Môi trường quá khô, ít không gian kết nối");
    values.put("preferred_role", ROLE_STYLES.get("D"));
    values.put("learning_style", LEARNING_STYLES.get("D"));
    values.put("career_pace", CAREER_PACES.get("D"));
    values.put("disc_D", "D: 31%");
    values.put("disc_I", "I: 28%");
    values.put("disc_S", "S: 19%");
    values.put("disc_C", "C: 22%");
    values.put("disc_primary_axis", buildAxisCopy("D"));
    values.put("disc_secondary_axis", buildAxisCopy("I"));
    values.put("disc_low_zone", buildAxisCopy("S"));
    values.put("disc_combination", buildDiscCombinationCopy("DI", "D"));
    values.put("disc_archetype", buildDiscArchetypeCopy("DI", "D"));
    values.put("disc_strengths", buildStrengthsCopy("D", "I"));
    values.put("disc_weaknesses", buildWeaknessesCopy("D", "I"));
    values.put("disc_motivation", buildMotivationCopy("D", Map.of(
        "passion", 4.5d,
        "strength", 4.1d,
        "value", 4.3d,
        "opportunity", 3.9d)));
    values.put("disc_stress_behavior", buildStressBehaviorCopy("D"));
    values.put("disc_communication_style", buildCommunicationStyleCopy("D", "I"));
    values.put("disc_work_environment", buildWorkEnvironmentCopy("D"));
    values.put("disc_career_fields", buildCareerFieldsCopy(List.of(
        "Sales Manager",
        "Business Development",
        "Project Manager"), "D"));
    values.put("disc_work_roles", buildWorkRolesCopy("D", "I"));
    return enrichFieldValues(values, settings, Objects.hash("preview", resolveTemplateType(templateType)));
  }

  private Map<String, String> buildFieldValues(
      TestSession session,
      Result result,
      Map<String, Object> settings) {
    Map<String, String> values = new LinkedHashMap<>();
    JsonNode resultJson = result == null ? null : result.getResultJson();
    JsonNode coachingReport = resultJson == null ? null : resultJson.path("coachingReport");
    AppUser user = resolveUser(session);
    List<String> topDimensions = readStringArray(resultJson, "topDimensions");
    Map<String, Integer> discScores = extractDiscScores(resultJson);
    Map<String, String> discPercents = computeDiscPercents(discScores);
    Map<String, Double> bigFiveScores = extractBigFiveScores(resultJson);
    Map<String, Double> ikigaiScores = extractIkigaiScores(resultJson);
    List<String> careerTitles = extractCareerTitles(resultJson);

    String discMain = firstNonBlank(
        readText(resultJson, "discPair"),
        readText(coachingReport, "profileCode"),
        joinDimensions(topDimensions));
    String discPrimaryType = "";
    if (!discMain.isBlank()) {
      discPrimaryType = String.valueOf(discMain.charAt(0));
    } else if (!topDimensions.isEmpty()) {
      discPrimaryType = topDimensions.get(0);
    }
    String discSupportType = resolveSupportType(discMain, topDimensions);
    ProfileCopy profileCopy = buildProfileCopy(discPrimaryType, discSupportType);
    List<String> cautionCareers = buildCautionCareers(discPrimaryType, discSupportType);
    String fullName = firstNonBlank(
        session == null ? null : session.getTakerName(),
        user == null ? null : user.getFullName());
    LocalDate testDate = resolveTestDate(session);

    values.put("fullName", fullName);
    values.put("full_name", fullName);
    values.put("user_name", fullName);
    values.put("user_age", calculateAge(user == null ? null : user.getDateOfBirth(), testDate));
    values.put("user_gender", user == null ? "" : nullSafe(user.getGender()));
    values.put("test_date", formatDate(testDate));
    values.put("email", user == null ? "" : nullSafe(user.getEmail()));
    values.put("phone", user == null ? "" : nullSafe(user.getPhoneNumber()));
    values.put("phoneNumber", user == null ? "" : nullSafe(user.getPhoneNumber()));
    values.put("dob", formatDate(user == null ? null : user.getDateOfBirth()));
    values.put("address", user == null ? "" : nullSafe(user.getAddress()));
    values.put("disc_primary_type", discPrimaryType);
    values.put("DISC_MAIN", discMain);
    values.put("disc_score_d", scoreValue(discScores, "D"));
    values.put("disc_score_i", scoreValue(discScores, "I"));
    values.put("disc_score_s", scoreValue(discScores, "S"));
    values.put("disc_score_c", scoreValue(discScores, "C"));
    values.put("disc_D_score", scoreValue(discScores, "D"));
    values.put("disc_I_score", scoreValue(discScores, "I"));
    values.put("disc_S_score", scoreValue(discScores, "S"));
    values.put("disc_C_score", scoreValue(discScores, "C"));
    values.put("disc_type", discMain);
    values.put("disc_primary", discPrimaryType);
    values.put("disc_secondary", discSupportType);
    values.put("scoreD", scoreValue(discScores, "D"));
    values.put("scoreI", scoreValue(discScores, "I"));
    values.put("scoreS", scoreValue(discScores, "S"));
    values.put("scoreC", scoreValue(discScores, "C"));
    values.put("disc_percent_d", discPercents.getOrDefault("D", ""));
    values.put("disc_percent_i", discPercents.getOrDefault("I", ""));
    values.put("disc_percent_s", discPercents.getOrDefault("S", ""));
    values.put("disc_percent_c", discPercents.getOrDefault("C", ""));
    values.put("disc_percent_d_value", numericPercentValue(discPercents.get("D")));
    values.put("disc_percent_i_value", numericPercentValue(discPercents.get("I")));
    values.put("disc_percent_s_value", numericPercentValue(discPercents.get("S")));
    values.put("disc_percent_c_value", numericPercentValue(discPercents.get("C")));
    values.put("disc_support_type", discSupportType);
    values.put("disc_summary", buildFreeDiscSummary(discMain, discPrimaryType, coachingReport, result));
    values.put("disc_strength", buildFreeDiscBulletList(
        readStringArray(coachingReport, "strengths"),
        extractInsightValues(resultJson, "strengths"),
        buildStrengthsCopy(discPrimaryType, discSupportType)));
    values.put("disc_limitation", buildFreeDiscBulletList(
        readStringArray(coachingReport, "blindSpots"),
        extractInsightValues(resultJson, "weaknesses"),
        buildWeaknessesCopy(discPrimaryType, discSupportType)));
    values.put("disc_work_style", summarizeWorkStyle(profileCopy));
    values.put("disc_communication_style", firstNonBlank(
        bulletList(readStringArray(coachingReport, "communicationPlaybook")),
        bulletList(extractInsightValues(resultJson, "keyBehaviors")),
        bulletList(extractInsightValues(resultJson, "summary"))));
    values.put("big5_openness", formatDecimalScore(bigFiveScores.get("openness")));
    values.put("big5_conscientiousness", formatDecimalScore(bigFiveScores.get("conscientiousness")));
    values.put("big5_extraversion", formatDecimalScore(bigFiveScores.get("extraversion")));
    values.put("big5_agreeableness", formatDecimalScore(bigFiveScores.get("agreeableness")));
    values.put("big5_neuroticism", formatDecimalScore(bigFiveScores.get("neuroticism")));
    values.put("big5_summary", buildBigFiveSummary(bigFiveScores));
    values.put("big5_thinking_style", buildBigFiveThinkingStyle(bigFiveScores));
    values.put("big5_emotional_style", buildBigFiveEmotionalStyle(bigFiveScores));
    values.put("ikigai_passion", formatDecimalScore(ikigaiScores.get("passion")));
    values.put("ikigai_strength", formatDecimalScore(ikigaiScores.get("strength")));
    values.put("ikigai_value", formatDecimalScore(ikigaiScores.get("value")));
    values.put("ikigai_opportunity", formatDecimalScore(ikigaiScores.get("opportunity")));
    values.put("ikigai_summary", buildIkigaiSummary(ikigaiScores));
    values.put("ikigai_potential", buildIkigaiPotential(ikigaiScores));
    values.put("ikigai_direction", buildIkigaiDirection(ikigaiScores));
    values.put("personality_archetype", limitText(resolvePersonalityArchetype(discPrimaryType), 30));
    values.put("personality_tagline", limitText(resolvePersonalityTagline(discMain, discPrimaryType), 80));
    values.put("career_top1", limitText(careerValue(careerTitles, discPrimaryType, 0), 50));
    values.put("career_top2", limitText(careerValue(careerTitles, discPrimaryType, 1), 50));
    values.put("career_top3", limitText(careerValue(careerTitles, discPrimaryType, 2), 50));
    values.put("career_description", limitText(buildCareerDescription(resultJson, coachingReport, careerTitles, discPrimaryType), 350));
    values.put("growth_advice", limitText(buildGrowthAdvice(discPrimaryType, bigFiveScores, ikigaiScores), 350));
    values.put("development_focus", limitText(buildDevelopmentFocus(discPrimaryType, bigFiveScores, ikigaiScores), 250));
    values.put("final_summary", limitText(buildFinalSummary(
        resolvePersonalityArchetype(discPrimaryType),
        resolvePersonalityTagline(discMain, discPrimaryType),
        careerTitles,
        ikigaiScores), 400));
    values.put("strengths", firstNonBlank(
        bulletList(readStringArray(coachingReport, "strengths")),
        bulletList(extractInsightValues(resultJson, "strengths")),
        nullSafe(result == null ? null : result.getSummary())));
    values.put("behaviors", firstNonBlank(
        bulletList(readStringArray(coachingReport, "communicationPlaybook")),
        bulletList(extractInsightValues(resultJson, "keyBehaviors")),
        bulletList(extractInsightValues(resultJson, "summary")),
        nullSafe(result == null ? null : result.getSummary())));
    values.put("careerSuggestions", firstNonBlank(
        bulletList(readStringArray(coachingReport, "wholesaleSalesPlaybook")),
        formatCareerRecommendations(resultJson)));
    values.put("ai_career_reasoning", firstNonBlank(
        readText(coachingReport, "executiveSummary"),
        nullSafe(result == null ? null : result.getSummary())));
    values.put("ai_top_careers", firstNonBlank(
        formatCareerTitles(resultJson),
        bulletList(readStringArray(coachingReport, "prioritySignals"))));
    values.put("custom", "");
    values.put("core_decision_style", profileCopy.decisionStyle());
    values.put("ideal_work_environment", profileCopy.idealWorkEnvironment());
    values.put("best_energy_use", profileCopy.bestEnergyUse());
    values.put("career_fit_1", careerValue(careerTitles, discPrimaryType, 0));
    values.put("career_fit_2", careerValue(careerTitles, discPrimaryType, 1));
    values.put("career_fit_3", careerValue(careerTitles, discPrimaryType, 2));
    values.put("career_caution_1", cautionCareers.isEmpty() ? "" : cautionCareers.get(0));
    values.put("career_caution_2", cautionCareers.size() < 2 ? "" : cautionCareers.get(1));
    values.put("preferred_role", profileCopy.preferredRole());
    values.put("learning_style", profileCopy.learningStyle());
    values.put("career_pace", profileCopy.careerPace());
    values.put("disc_D", buildDiscPercentLine("D", discPercents));
    values.put("disc_I", buildDiscPercentLine("I", discPercents));
    values.put("disc_S", buildDiscPercentLine("S", discPercents));
    values.put("disc_C", buildDiscPercentLine("C", discPercents));
    values.put("disc_primary_axis", buildAxisCopy(discPrimaryType));
    values.put("disc_secondary_axis", buildAxisCopy(discSupportType));
    values.put("disc_low_zone", buildAxisCopy(resolveLowestDimension(discScores)));
    values.put("disc_combination", buildDiscCombinationCopy(discMain, discPrimaryType));
    values.put("disc_archetype", buildDiscArchetypeCopy(discMain, discPrimaryType));
    values.put("disc_strengths", buildStrengthsCopy(discPrimaryType, discSupportType));
    values.put("disc_weaknesses", buildWeaknessesCopy(discPrimaryType, discSupportType));
    values.put("disc_motivation", buildMotivationCopy(discPrimaryType, ikigaiScores));
    values.put("disc_stress_behavior", buildStressBehaviorCopy(discPrimaryType));
    values.put("disc_communication_style", buildCommunicationStyleCopy(discPrimaryType, discSupportType));
    values.put("disc_work_environment", buildWorkEnvironmentCopy(discPrimaryType));
    values.put("disc_career_fields", buildCareerFieldsCopy(careerTitles, discPrimaryType));
    values.put("disc_work_roles", buildWorkRolesCopy(discPrimaryType, discSupportType));
    return enrichFieldValues(
        values,
        settings,
        Objects.hash(
            session == null ? null : session.getId(),
            session == null ? null : session.getTestCode(),
            session == null ? null : session.getCompletedAt(),
            result == null ? null : result.getSummary()));
  }

  private Map<String, String> enrichFieldValues(
      Map<String, String> baseValues,
      Map<String, Object> settings,
      long seed) {
    Map<String, String> values = new LinkedHashMap<>();
    if (baseValues != null) {
      for (Map.Entry<String, String> entry : baseValues.entrySet()) {
        if (entry.getKey() == null) {
          continue;
        }
        values.put(entry.getKey(), cleanText(entry.getValue()));
      }
    }

    addValueAliases(values);
    applyPdfCustomVariables(values, settings, seed);
    return values;
  }

  private void addValueAliases(Map<String, String> values) {
    List<Map.Entry<String, String>> entries = new ArrayList<>(values.entrySet());
    for (Map.Entry<String, String> entry : entries) {
      String normalizedKey = normalizeVariableToken(entry.getKey());
      if (normalizedKey.isBlank()) {
        continue;
      }
      String value = cleanText(entry.getValue());
      putIfBlank(values, normalizedKey, value);
      putIfBlank(values, formatVariableToken(normalizedKey), value);
    }
  }

  private void applyPdfCustomVariables(
      Map<String, String> values,
      Map<String, Object> settings,
      long seed) {
    List<PdfCustomVariableRule> rules = extractPdfCustomVariableRules(settings);
    if (rules.isEmpty()) {
      return;
    }

    Map<String, List<PdfCustomVariableRule>> rulesByToken = new LinkedHashMap<>();
    for (PdfCustomVariableRule rule : rules) {
      rulesByToken.computeIfAbsent(rule.token(), ignored -> new ArrayList<>()).add(rule);
    }

    for (Map.Entry<String, List<PdfCustomVariableRule>> entry : rulesByToken.entrySet()) {
      String resolvedValue = resolvePdfCustomVariable(entry.getKey(), entry.getValue(), values, seed);
      if (resolvedValue.isBlank()) {
        continue;
      }

      putIfBlank(values, entry.getKey(), resolvedValue);
      putIfBlank(values, formatVariableToken(entry.getKey()), resolvedValue);
    }
  }

  private String resolvePdfCustomVariable(
      String token,
      List<PdfCustomVariableRule> rules,
      Map<String, String> values,
      long seed) {
    if (rules == null || rules.isEmpty()) {
      return "";
    }

    for (PdfCustomVariableRule rule : rules) {
      if (!matchesPdfCustomVariableRule(rule, values)) {
        continue;
      }
      return selectPdfCustomVariableOption(token, rule, seed);
    }
    return "";
  }

  private boolean matchesPdfCustomVariableRule(
      PdfCustomVariableRule rule,
      Map<String, String> values) {
    String profileType = normalizePdfCustomProfileType(rule.profileType());
    if ("BIG5".equals(profileType) || "IKIGAI".equals(profileType)) {
      return matchesGenericMetricRule(profileType, rule.primaryMetric(), values, rule.primaryMin(), rule.primaryMax())
          && matchesGenericMetricRule(profileType, rule.secondaryMetric(), values, rule.secondaryMin(), rule.secondaryMax());
    }

    String actualPrimary = normalizeDimension(values.get("disc_primary"));
    String actualSecondary = normalizeDimension(values.get("disc_secondary"));

    return matchesDiscMetricRule(
            rule.primaryMetric(),
            actualPrimary,
            values,
            rule.primaryMin(),
            rule.primaryMax())
        && matchesDiscMetricRule(
            rule.secondaryMetric(),
            actualSecondary,
            values,
            rule.secondaryMin(),
            rule.secondaryMax());
  }

  private boolean matchesDiscMetricRule(
      String expectedMetric,
      String actualMetric,
      Map<String, String> values,
      Float min,
      Float max) {
    String metric = normalizeDimension(expectedMetric);
    if (metric.isBlank()) {
      return min == null && max == null;
    }
    if (!metric.equals(actualMetric)) {
      return false;
    }
    return matchesNumericRange(discPercentValue(values, metric), min, max);
  }

  private boolean matchesGenericMetricRule(
      String profileType,
      String metric,
      Map<String, String> values,
      Float min,
      Float max) {
    String normalizedMetric = normalizePdfCustomMetric(profileType, metric);
    if (normalizedMetric.isBlank()) {
      return min == null && max == null;
    }
    return matchesNumericRange(profileMetricValue(values, profileType, normalizedMetric), min, max);
  }

  private boolean matchesNumericRange(Float value, Float min, Float max) {
    if (value == null) {
      return false;
    }
    if (min != null && value < min) {
      return false;
    }
    if (max != null && value > max) {
      return false;
    }
    return true;
  }

  private Float discPercentValue(Map<String, String> values, String dimension) {
    String normalized = normalizeDimension(dimension);
    if (normalized.isBlank()) {
      return null;
    }
    String rawValue = values.get("disc_percent_" + normalized.toLowerCase(Locale.ROOT) + "_value");
    return parseFloatValue(rawValue);
  }

  private String selectPdfCustomVariableOption(
      String token,
      PdfCustomVariableRule rule,
      long seed) {
    List<String> options = rule.options();
    if (options.isEmpty()) {
      return "";
    }
    if (options.size() == 1) {
      return options.get(0);
    }

    int index = Math.floorMod(
        Objects.hash(
            seed,
            token,
            rule.profileType(),
            rule.primaryMetric(),
            rule.primaryMin(),
            rule.primaryMax(),
            rule.secondaryMetric(),
            rule.secondaryMin(),
            rule.secondaryMax()),
        options.size());
    return options.get(index);
  }

  private Float profileMetricValue(
      Map<String, String> values,
      String profileType,
      String metric) {
    String normalizedMetric = normalizePdfCustomMetric(profileType, metric);
    if (normalizedMetric.isBlank()) {
      return null;
    }

    String fieldKey = switch (normalizePdfCustomProfileType(profileType)) {
      case "BIG5" -> "big5_" + normalizedMetric;
      case "IKIGAI" -> "ikigai_" + normalizedMetric;
      default -> "";
    };
    if (fieldKey.isBlank()) {
      return null;
    }
    return parseFloatValue(values.get(fieldKey));
  }

  private List<PdfCustomVariableRule> extractPdfCustomVariableRules(Map<String, Object> settings) {
    Object rawValue = settings == null ? null : settings.get("pdfCustomVariables");
    if (rawValue == null) {
      return List.of();
    }

    JsonNode root = objectMapper.valueToTree(rawValue);
    if (!root.isArray()) {
      return List.of();
    }

    List<PdfCustomVariableRule> rules = new ArrayList<>();
    for (JsonNode item : root) {
      String token = normalizeVariableToken(firstNonBlank(
          readText(item, "token"),
          readText(item, "name"),
          readText(item, "key")));
      if (token.isBlank()) {
        continue;
      }

      String rawPrimaryMetric = firstNonBlank(
          readText(item, "primaryMetric"),
          readText(item, "primaryGroup"),
          readText(item, "discMain"));
      String rawSecondaryMetric = firstNonBlank(
          readText(item, "secondaryMetric"),
          readText(item, "secondaryGroup"),
          readText(item, "discSecondary"));
      String profileType = normalizePdfCustomProfileType(firstNonBlank(
          readText(item, "profileType"),
          readText(item, "sourceType"),
          inferPdfCustomProfileType(rawPrimaryMetric, rawSecondaryMetric)));
      List<String> options = extractPdfCustomVariableOptions(item);
      if (options.isEmpty()) {
        continue;
      }

      rules.add(new PdfCustomVariableRule(
          token,
          profileType,
          normalizePdfCustomMetric(profileType, rawPrimaryMetric),
          readFloatNode(item, "primaryMin"),
          readFloatNode(item, "primaryMax"),
          normalizePdfCustomMetric(profileType, rawSecondaryMetric),
          readFloatNode(item, "secondaryMin"),
          readFloatNode(item, "secondaryMax"),
          options));
    }

    return rules;
  }

  private String normalizePdfCustomProfileType(String value) {
    if (value == null || value.isBlank()) {
      return "DISC";
    }

    String normalized = value.trim().toUpperCase(Locale.ROOT).replaceAll("[\\s_-]+", "");
    return switch (normalized) {
      case "BIG5", "BIGFIVE" -> "BIG5";
      case "IKIGAI" -> "IKIGAI";
      default -> "DISC";
    };
  }

  private String inferPdfCustomProfileType(String primaryMetric, String secondaryMetric) {
    if (!canonicalBigFiveKey(primaryMetric).isBlank() || !canonicalBigFiveKey(secondaryMetric).isBlank()) {
      return "BIG5";
    }
    if (!canonicalIkigaiKey(primaryMetric).isBlank() || !canonicalIkigaiKey(secondaryMetric).isBlank()) {
      return "IKIGAI";
    }
    return "DISC";
  }

  private String normalizePdfCustomMetric(String profileType, String value) {
    return switch (normalizePdfCustomProfileType(profileType)) {
      case "BIG5" -> canonicalBigFiveKey(value);
      case "IKIGAI" -> canonicalIkigaiKey(value);
      default -> normalizeDimension(value);
    };
  }

  private List<String> extractPdfCustomVariableOptions(JsonNode item) {
    List<String> options = parsePdfCustomVariableOptionsNode(item.path("options"));
    if (!options.isEmpty()) {
      return options;
    }
    options = parsePdfCustomVariableOptionsNode(item.path("content"));
    if (!options.isEmpty()) {
      return options;
    }
    options = parsePdfCustomVariableOptionsNode(item.path("contents"));
    if (!options.isEmpty()) {
      return options;
    }
    return parsePdfCustomVariableOptionsNode(item.path("contentText"));
  }

  private List<String> parsePdfCustomVariableOptionsNode(JsonNode node) {
    if (node == null || node.isMissingNode() || node.isNull()) {
      return List.of();
    }

    List<String> options = new ArrayList<>();
    if (node.isArray()) {
      for (JsonNode item : node) {
        String value = cleanText(item == null ? "" : item.asText(""));
        if (!value.isBlank()) {
          options.add(value);
        }
      }
      return options;
    }

    if (!node.isTextual()) {
      return List.of();
    }

    String[] parts = node.asText("").split("\\R|\\|");
    for (String part : parts) {
      String value = cleanText(part);
      if (!value.isBlank()) {
        options.add(value);
      }
    }
    return options;
  }

  private Float readFloatNode(JsonNode node, String fieldName) {
    if (node == null || fieldName == null || fieldName.isBlank()) {
      return null;
    }

    JsonNode value = node.path(fieldName);
    if (value.isMissingNode() || value.isNull()) {
      return null;
    }
    if (value.isNumber()) {
      return (float) value.asDouble();
    }
    if (!value.isTextual()) {
      return null;
    }

    String cleaned = cleanText(value.asText(""));
    if (cleaned.isBlank()) {
      return null;
    }

    try {
      return Float.parseFloat(cleaned);
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private Float parseFloatValue(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      return null;
    }
    try {
      return Float.parseFloat(rawValue.trim());
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private String normalizeVariableToken(String value) {
    if (value == null || value.isBlank()) {
      return "";
    }
    return value.trim().replaceAll("^\\{+|\\}+$", "").trim();
  }

  private String formatVariableToken(String value) {
    String normalized = normalizeVariableToken(value);
    return normalized.isBlank() ? "" : "{" + normalized + "}";
  }

  private void putIfBlank(Map<String, String> values, String key, String value) {
    if (key == null || key.isBlank()) {
      return;
    }
    String cleaned = cleanText(value);
    if (cleaned.isBlank()) {
      return;
    }
    String existing = values.get(key);
    if (existing == null || existing.isBlank()) {
      values.put(key, cleaned);
    }
  }

  private AppUser resolveUser(TestSession session) {
    if (session == null) {
      return null;
    }
    if (session.getOwnerUser() != null) {
      return session.getOwnerUser();
    }
    return session.getTakerUser();
  }

  private Map<String, Integer> extractDiscScores(JsonNode resultJson) {
    if (resultJson == null || !resultJson.path("dimensionScores").isArray()) {
      return Collections.emptyMap();
    }

    Map<String, Integer> scores = new LinkedHashMap<>();
    for (JsonNode scoreNode : resultJson.path("dimensionScores")) {
      String dimension = scoreNode.path("dimension").asText("").trim().toUpperCase(Locale.ROOT);
      if (dimension.isBlank()) {
        continue;
      }
      scores.put(dimension, scoreNode.path("score").asInt(0));
    }
    return scores;
  }

  private Map<String, Double> extractBigFiveScores(JsonNode resultJson) {
    if (resultJson == null) {
      return Map.of();
    }

    JsonNode scoreNode = resultJson.path("bigFiveScores");
    if (!scoreNode.isObject()) {
      scoreNode = resultJson.path("bigFive");
    }
    if (!scoreNode.isObject()) {
      return Map.of();
    }

    Map<String, Double> scores = new LinkedHashMap<>();
    for (Iterator<String> it = scoreNode.fieldNames(); it.hasNext(); ) {
      String key = it.next();
      String canonicalKey = canonicalBigFiveKey(key);
      JsonNode valueNode = scoreNode.path(key);
      if (canonicalKey.isBlank() || !valueNode.isNumber()) {
        continue;
      }
      scores.put(canonicalKey, valueNode.asDouble());
    }
    return scores;
  }

  private Map<String, Double> extractIkigaiScores(JsonNode resultJson) {
    if (resultJson == null) {
      return Map.of();
    }

    JsonNode scoreNode = resultJson.path("ikigaiScores");
    if (!scoreNode.isObject()) {
      scoreNode = resultJson.path("ikigai");
    }
    if (!scoreNode.isObject()) {
      return Map.of();
    }

    Map<String, Double> scores = new LinkedHashMap<>();
    for (Iterator<String> it = scoreNode.fieldNames(); it.hasNext(); ) {
      String key = it.next();
      String canonicalKey = canonicalIkigaiKey(key);
      JsonNode valueNode = scoreNode.path(key);
      if (canonicalKey.isBlank() || !valueNode.isNumber()) {
        continue;
      }
      scores.put(canonicalKey, valueNode.asDouble());
    }
    return scores;
  }

  private Map<String, String> computeDiscPercents(Map<String, Integer> discScores) {
    int total = discScores.values().stream().mapToInt(Integer::intValue).sum();
    if (total <= 0) {
      return Map.of();
    }

    Map<String, String> percents = new LinkedHashMap<>();
    for (String key : List.of("D", "I", "S", "C")) {
      int value = discScores.getOrDefault(key, 0);
      int percent = Math.round((value * 100f) / total);
      percents.put(key, percent + "%");
    }
    return percents;
  }

  private List<String> readStringArray(JsonNode node, String fieldName) {
    if (node == null) {
      return List.of();
    }

    JsonNode value = node.path(fieldName);
    if (!value.isArray()) {
      return List.of();
    }

    List<String> items = new ArrayList<>();
    for (JsonNode item : value) {
      if (item.isTextual()) {
        String text = cleanText(item.asText());
        if (!text.isBlank()) {
          items.add(text);
        }
      } else if (item.isObject()) {
        String text = firstNonBlank(
            readText(item, "title"),
            readText(item, "label"),
            readText(item, "summary"),
            readText(item, "description"),
            cleanText(item.toString()));
        if (!text.isBlank()) {
          items.add(text);
        }
      }
    }
    return items;
  }

  private List<String> extractInsightValues(JsonNode resultJson, String fieldName) {
    if (resultJson == null || !resultJson.path("insights").isArray()) {
      return List.of();
    }

    List<String> values = new ArrayList<>();
    for (JsonNode insight : resultJson.path("insights")) {
      String text = readText(insight, fieldName);
      if (!text.isBlank()) {
        values.add(text);
      }
    }
    return values;
  }

  private String formatCareerRecommendations(JsonNode resultJson) {
    if (resultJson == null || !resultJson.path("careerRecommendations").isArray()) {
      return "";
    }

    List<String> lines = new ArrayList<>();
    for (JsonNode career : resultJson.path("careerRecommendations")) {
      String title = readText(career, "jobTitle");
      String summary = readText(career, "summary");
      String line = firstNonBlank(
          title.isBlank() ? "" : title + (summary.isBlank() ? "" : ": " + summary),
          summary);
      if (!line.isBlank()) {
        lines.add(line);
      }
    }
    return bulletList(lines);
  }

  private String formatCareerTitles(JsonNode resultJson) {
    return String.join(", ", extractCareerTitles(resultJson));
  }

  private String scoreValue(Map<String, Integer> discScores, String key) {
    Integer value = discScores.get(key);
    return value == null ? "" : String.valueOf(value);
  }

  private String joinDimensions(List<String> dimensions) {
    if (dimensions == null || dimensions.isEmpty()) {
      return "";
    }
    return String.join("", dimensions);
  }

  private List<String> extractCareerTitles(JsonNode resultJson) {
    if (resultJson == null || !resultJson.path("careerRecommendations").isArray()) {
      return List.of();
    }

    List<String> titles = new ArrayList<>();
    for (JsonNode career : resultJson.path("careerRecommendations")) {
      String title = readText(career, "jobTitle");
      if (!title.isBlank()) {
        titles.add(title);
      }
    }
    return titles;
  }

  private String formatDate(LocalDate value) {
    return value == null ? "" : DATE_FORMAT.format(value);
  }

  private String formatDecimalScore(Double value) {
    if (value == null) {
      return "";
    }
    double rounded = Math.round(value * 100.0) / 100.0;
    if (Math.abs(rounded - Math.rint(rounded)) < 0.001) {
      return String.valueOf((int) Math.rint(rounded));
    }
    return String.format(Locale.ROOT, "%.2f", rounded).replaceAll("0+$", "").replaceAll("\\.$", "");
  }

  private LocalDate resolveTestDate(TestSession session) {
    if (session == null) {
      return null;
    }

    LocalDate completedDate = toLocalDate(session.getCompletedAt());
    if (completedDate != null) {
      return completedDate;
    }

    LocalDate startedDate = toLocalDate(session.getStartedAt());
    if (startedDate != null) {
      return startedDate;
    }

    return toLocalDate(session.getCreatedAt());
  }

  private LocalDate toLocalDate(Instant value) {
    if (value == null) {
      return null;
    }
    return value.atZone(ZoneId.systemDefault()).toLocalDate();
  }

  private String calculateAge(LocalDate dateOfBirth, LocalDate referenceDate) {
    if (dateOfBirth == null || referenceDate == null || dateOfBirth.isAfter(referenceDate)) {
      return "";
    }
    return String.valueOf(Period.between(dateOfBirth, referenceDate).getYears());
  }

  private String canonicalBigFiveKey(String rawKey) {
    if (rawKey == null || rawKey.isBlank()) {
      return "";
    }
    return switch (rawKey.trim().toUpperCase(Locale.ROOT)) {
      case "O", "OPENNESS" -> "openness";
      case "C", "CONSCIENTIOUSNESS" -> "conscientiousness";
      case "E", "EXTRAVERSION" -> "extraversion";
      case "A", "AGREEABLENESS" -> "agreeableness";
      case "N", "NEUROTICISM" -> "neuroticism";
      default -> "";
    };
  }

  private String canonicalIkigaiKey(String rawKey) {
    if (rawKey == null || rawKey.isBlank()) {
      return "";
    }
    return switch (rawKey.trim().toUpperCase(Locale.ROOT)) {
      case "LOVE", "PASSION" -> "passion";
      case "SKILL", "STRENGTH" -> "strength";
      case "NEED", "VALUE" -> "value";
      case "PAID", "OPPORTUNITY" -> "opportunity";
      default -> "";
    };
  }

  private String resolvePersonalityArchetype(String primaryDimension) {
    String normalized = normalizeDimension(primaryDimension);
    return PERSONALITY_ARCHETYPES.getOrDefault(normalized, "Người khám phá");
  }

  private String resolvePersonalityTagline(String discMain, String primaryDimension) {
    String normalizedPair = discMain == null ? "" : discMain.trim().toUpperCase(Locale.ROOT);
    String normalizedPrimary = normalizeDimension(primaryDimension);
    String tagline = switch (normalizedPair) {
      case "DI" -> "Dẫn dắt rõ ràng, truyền động lực và kéo tập thể về phía mục tiêu.";
      case "IS" -> "Kết nối chân thành, lan tỏa năng lượng và giữ sự gắn kết bền vững.";
      case "SC" -> "Điềm tĩnh, chắc chắn và duy trì chất lượng ổn định trong mọi việc.";
      case "CD" -> "Phân tích sắc bén, quyết định kỹ và tối ưu hiệu quả bằng tiêu chuẩn rõ.";
      default -> switch (normalizedPrimary) {
        case "D" -> "Quyết đoán, chủ động và tập trung mạnh vào kết quả cuối cùng.";
        case "I" -> "Cởi mở, giàu ý tưởng và tạo cảm hứng cho người xung quanh.";
        case "S" -> "Bền bỉ, hỗ trợ tốt và giữ nhịp hợp tác đáng tin cậy.";
        case "C" -> "Logic, chỉn chu và luôn muốn mọi thứ đạt chuẩn cao.";
        default -> "Linh hoạt, quan sát tốt và đang định hình màu sắc riêng của bản thân.";
      };
    };
    return tagline;
  }

  private String summarizeWorkStyle(ProfileCopy profileCopy) {
    if (profileCopy == null) {
      return "";
    }
    return String.join(" ",
        sentence(profileCopy.preferredRole()),
        sentence(profileCopy.idealWorkEnvironment()),
        sentence(profileCopy.bestEnergyUse())).trim();
  }

  private String sentence(String value) {
    String cleaned = cleanText(value);
    if (cleaned.isBlank()) {
      return "";
    }
    if (cleaned.endsWith(".") || cleaned.endsWith("!") || cleaned.endsWith("?")) {
      return cleaned;
    }
    return cleaned + ".";
  }

  private String buildBigFiveSummary(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    List<String> topTraits = topBigFiveTraits(scores, 2);
    if (topTraits.isEmpty()) {
      return "";
    }
    String topTraitSummary = joinBigFiveLabels(topTraits);
    Double neuroticism = scores.get("neuroticism");
    String emotionalBalance = switch (level(neuroticism)) {
      case "high" -> "độ nhạy cảm xúc khá cao";
      case "low" -> "độ ổn định cảm xúc tốt";
      default -> "độ ổn định cảm xúc ở mức cân bằng";
    };
    return "Nổi bật ở " + topTraitSummary + "; bạn có " + emotionalBalance + " trong cách phản ứng và thích nghi.";
  }

  private String buildBigFiveThinkingStyle(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    String openness = level(scores.get("openness"));
    String conscientiousness = level(scores.get("conscientiousness"));

    String curiosity = switch (openness) {
      case "high" -> "Tư duy cởi mở, thích khám phá góc nhìn mới";
      case "low" -> "Tư duy thực tế, ưu tiên điều quen thuộc và rõ ràng";
      default -> "Tư duy cân bằng giữa khám phá và thực tế";
    };
    String structure = switch (conscientiousness) {
      case "high" -> "và có xu hướng sắp xếp mọi thứ thành kế hoạch rõ ràng.";
      case "low" -> "nhưng thiên về linh hoạt hơn là bám chặt khuôn mẫu.";
      default -> "và thường giữ được mức tổ chức vừa phải khi ra quyết định.";
    };
    return curiosity + " " + structure;
  }

  private String buildBigFiveEmotionalStyle(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    String neuroticism = level(scores.get("neuroticism"));
    String agreeableness = level(scores.get("agreeableness"));
    String extraversion = level(scores.get("extraversion"));

    String emotionalCore = switch (neuroticism) {
      case "high" -> "Bạn khá nhạy với áp lực và dễ nhận ra biến động cảm xúc";
      case "low" -> "Bạn khá ổn định cảm xúc và giữ được bình tĩnh trước áp lực";
      default -> "Bạn có nhịp cảm xúc tương đối cân bằng trong phần lớn tình huống";
    };
    String socialTone = switch (agreeableness) {
      case "high" -> "thường ưu tiên hòa hợp và phối hợp";
      case "low" -> "thường thẳng, rõ và không ngại va chạm quan điểm";
      default -> "có xu hướng giữ sự hợp tác ở mức vừa phải";
    };
    String expression = switch (extraversion) {
      case "high" -> "khi giao tiếp bạn thể hiện năng lượng khá rõ ra bên ngoài.";
      case "low" -> "khi giao tiếp bạn thường xử lý cảm xúc kín đáo hơn.";
      default -> "khi giao tiếp bạn thể hiện cảm xúc ở mức vừa phải.";
    };
    return emotionalCore + ", " + socialTone + "; " + expression;
  }

  private String buildIkigaiSummary(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    List<String> topTraits = topIkigaiTraits(scores, 2);
    if (topTraits.isEmpty()) {
      return "";
    }
    return "Động lực nổi bật nằm ở " + joinIkigaiLabels(topTraits)
        + ", cho thấy bạn dễ gắn bó hơn khi công việc vừa có ý nghĩa vừa cho phép đóng góp rõ ràng.";
  }

  private String buildIkigaiPotential(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    String passion = level(scores.get("passion"));
    String strength = level(scores.get("strength"));
    String opportunity = level(scores.get("opportunity"));

    if ("high".equals(passion) && "high".equals(strength)) {
      return "Tiềm năng phát triển mạnh vì bạn có cả động lực nội tại lẫn nền tảng năng lực để đi sâu và đi xa.";
    }
    if ("high".equals(opportunity)) {
      return "Tiềm năng tốt nếu bạn đưa thế mạnh hiện có vào hướng đi đang có nhu cầu và khả năng tạo thu nhập rõ ràng.";
    }
    return "Tiềm năng sẽ mở rộng rõ hơn khi bạn tiếp tục kiểm chứng đâu là việc vừa hợp mình vừa tạo giá trị thực tế cho thị trường.";
  }

  private String buildIkigaiDirection(Map<String, Double> scores) {
    if (scores == null || scores.isEmpty()) {
      return "";
    }
    String top = topIkigaiTraits(scores, 1).stream().findFirst().orElse("");
    return switch (top) {
      case "passion" -> "Nên bắt đầu từ những hướng đi khiến bạn hứng thú thật sự, sau đó gắn chúng với năng lực và cơ hội cụ thể.";
      case "strength" -> "Nên ưu tiên các vai trò giúp bạn dùng thế mạnh rõ ràng, rồi mở rộng dần sang lĩnh vực có nhiều ý nghĩa hơn với bản thân.";
      case "value" -> "Nên chọn hướng đi nơi bạn thấy công việc mình làm tạo ra ích lợi rõ cho người khác hoặc cho cộng đồng.";
      case "opportunity" -> "Nên ưu tiên hướng có đầu ra thị trường rõ ràng và khả năng chuyển hóa thành kết quả, thu nhập hoặc cơ hội nghề nghiệp.";
      default -> "Nên tìm điểm giao giữa điều bạn thích, điều bạn làm tốt, giá trị bạn muốn tạo ra và cơ hội thực tế ngoài thị trường.";
    };
  }

  private String buildCareerDescription(
      JsonNode resultJson,
      JsonNode coachingReport,
      List<String> careerTitles,
      String primaryDimension) {
    String recommendationSummary = formatCareerRecommendationSummary(resultJson);
    if (!recommendationSummary.isBlank()) {
      return recommendationSummary;
    }

    String reasoning = readText(coachingReport, "executiveSummary");
    if (!reasoning.isBlank()) {
      return reasoning;
    }

    List<String> topCareers = new ArrayList<>();
    for (int index = 0; index < 3; index++) {
      String value = careerValue(careerTitles, primaryDimension, index);
      if (!value.isBlank()) {
        topCareers.add(value);
      }
    }
    if (topCareers.isEmpty()) {
      return "";
    }
    return "Các hướng nghề nổi bật gồm " + String.join(", ", topCareers)
        + ", phù hợp với cách bạn làm việc và thế mạnh nổi trội hiện tại.";
  }

  private String buildGrowthAdvice(
      String primaryDimension,
      Map<String, Double> bigFiveScores,
      Map<String, Double> ikigaiScores) {
    String actionAdvice = switch (normalizeDimension(primaryDimension)) {
      case "D" -> "Đặt mục tiêu ngắn hạn thật rõ, đo tiến độ theo tuần và chủ động nhận phản hồi sớm.";
      case "I" -> "Tận dụng môi trường nhiều tương tác để học nhanh, nhưng luôn chốt lại bằng hành động cụ thể.";
      case "S" -> "Đi theo lộ trình ổn định, tăng năng lực từng bước và giữ nhịp cải thiện đều đặn.";
      case "C" -> "Dùng dữ liệu, tiêu chuẩn rõ và các thử nghiệm nhỏ để tối ưu dần thay vì ôm quá nhiều thay đổi.";
      default -> "Chọn một hướng ưu tiên rõ ràng rồi cải thiện liên tục bằng các bước nhỏ nhưng đều.";
    };

    String thinkingAdvice = switch (topBigFiveTraits(bigFiveScores, 1).stream().findFirst().orElse("")) {
      case "openness" -> "Tiếp tục khai thác sự cởi mở bằng cách thử cái mới nhưng luôn giữ tiêu chí đánh giá rõ.";
      case "conscientiousness" -> "Biến sự tận tâm thành lợi thế bằng cách duy trì kỷ luật và chốt việc đến cùng.";
      case "extraversion" -> "Tận dụng năng lượng giao tiếp để mở cơ hội, đồng thời giữ cam kết sau mỗi lần kết nối.";
      case "agreeableness" -> "Giữ thế mạnh hợp tác nhưng đừng ngại đặt ranh giới và ưu tiên khi cần.";
      case "neuroticism" -> "Quản trị áp lực bằng nhịp nghỉ, phản tư và kế hoạch thực tế trước khi tăng tốc tiếp.";
      default -> "";
    };

    String motivationAdvice = switch (topIkigaiTraits(ikigaiScores, 1).stream().findFirst().orElse("")) {
      case "passion" -> "Ưu tiên những dự án khiến bạn thực sự có hứng thú để duy trì năng lượng dài hạn.";
      case "strength" -> "Đặt mình vào vai trò cho phép dùng điểm mạnh rõ ràng và được ghi nhận bằng kết quả cụ thể.";
      case "value" -> "Giữ động lực bằng cách nhìn rõ giá trị công việc bạn tạo ra cho người khác.";
      case "opportunity" -> "Chọn hướng đi có đầu ra thị trường rõ để nỗ lực của bạn dễ chuyển thành cơ hội thật.";
      default -> "";
    };

    return String.join(" ", List.of(actionAdvice, thinkingAdvice, motivationAdvice)).trim();
  }

  private String buildDevelopmentFocus(
      String primaryDimension,
      Map<String, Double> bigFiveScores,
      Map<String, Double> ikigaiScores) {
    String discFocus = switch (normalizeDimension(primaryDimension)) {
      case "D" -> "nhịp hành động có mục tiêu và khả năng chốt kết quả";
      case "I" -> "khả năng kết nối, thuyết phục và duy trì ảnh hưởng tích cực";
      case "S" -> "độ bền trong phối hợp và khả năng giữ ổn định cho tập thể";
      case "C" -> "tư duy hệ thống, chuẩn mực chất lượng và độ chính xác";
      default -> "một nhịp phát triển rõ ràng và bền vững";
    };
    String topBigFive = joinBigFiveLabels(topBigFiveTraits(bigFiveScores, 1));
    String topIkigai = joinIkigaiLabels(topIkigaiTraits(ikigaiScores, 1));

    List<String> parts = new ArrayList<>();
    parts.add("Trọng tâm trước mắt là củng cố " + discFocus + ".");
    if (!topBigFive.isBlank()) {
      parts.add("Giữ nổi bật ở " + topBigFive + " như một lợi thế cốt lõi.");
    }
    if (!topIkigai.isBlank()) {
      parts.add("Mọi kế hoạch phát triển nên gắn với " + topIkigai + ".");
    }
    return String.join(" ", parts);
  }

  private String buildFinalSummary(
      String personalityArchetype,
      String personalityTagline,
      List<String> careerTitles,
      Map<String, Double> ikigaiScores) {
    List<String> parts = new ArrayList<>();
    if (!personalityArchetype.isBlank()) {
      parts.add(personalityArchetype + ".");
    }
    if (!personalityTagline.isBlank()) {
      parts.add(personalityTagline);
    }

    List<String> topCareers = new ArrayList<>();
    for (int index = 0; index < Math.min(3, careerTitles == null ? 0 : careerTitles.size()); index++) {
      String value = cleanText(careerTitles.get(index));
      if (!value.isBlank()) {
        topCareers.add(value);
      }
    }
    if (!topCareers.isEmpty()) {
      parts.add("Hướng nghề nổi bật: " + String.join(", ", topCareers) + ".");
    }

    String ikigaiFocus = joinIkigaiLabels(topIkigaiTraits(ikigaiScores, 2));
    if (!ikigaiFocus.isBlank()) {
      parts.add("Đà phát triển tốt nhất khi bạn ưu tiên " + ikigaiFocus + ".");
    }
    return String.join(" ", parts).trim();
  }

  private String buildDiscScoreLine(String dimension, Map<String, Integer> discScores) {
    String normalized = normalizeDimension(dimension);
    String score = scoreValue(discScores, normalized);
    if (normalized.isBlank() || score.isBlank()) {
      return "";
    }
    return normalized + ": " + score;
  }

  private String buildDiscPercentLine(String dimension, Map<String, String> discPercents) {
    String normalized = normalizeDimension(dimension);
    String percent = discPercents == null ? "" : nullSafe(discPercents.get(normalized));
    if (normalized.isBlank() || percent.isBlank()) {
      return "";
    }
    return normalized + ": " + percent;
  }

  private String buildAxisCopy(String dimension) {
    return switch (normalizeDimension(dimension)) {
      case "D" -> "Trục D - Chủ động, quyết đoán và hướng mạnh đến kết quả.";
      case "I" -> "Trục I - Cởi mở, giao tiếp nhanh và tạo ảnh hưởng bằng năng lượng tích cực.";
      case "S" -> "Trục S - Ổn định, kiên nhẫn và ưu tiên sự hài hòa khi phối hợp.";
      case "C" -> "Trục C - Phân tích kỹ, chú trọng chuẩn mực và đề cao tính chính xác.";
      default -> "";
    };
  }

  private String resolveLowestDimension(Map<String, Integer> discScores) {
    if (discScores == null || discScores.isEmpty()) {
      return "";
    }

    String lowest = "";
    int lowestValue = Integer.MAX_VALUE;
    for (String dimension : DISC_DIMENSIONS) {
      int value = discScores.getOrDefault(dimension, Integer.MAX_VALUE);
      if (value < lowestValue) {
        lowestValue = value;
        lowest = dimension;
      }
    }
    return lowestValue == Integer.MAX_VALUE ? "" : lowest;
  }

  private String buildDiscCombinationCopy(String discMain, String primaryDimension) {
    String compact = discMain == null ? "" : discMain.trim().toUpperCase(Locale.ROOT).replaceAll("[^DISC]", "");
    if (compact.isBlank()) {
      compact = normalizeDimension(primaryDimension);
    }
    if (compact.isBlank()) {
      return "";
    }
    return compact + " - " + shortCombinationLabel(compact, primaryDimension);
  }

  private String shortCombinationLabel(String discMain, String primaryDimension) {
    return switch (discMain) {
      case "DI" -> "Chủ động dẫn dắt và tạo ảnh hưởng";
      case "ID" -> "Kết nối nhanh và kéo người khác cùng hành động";
      case "IS" -> "Kết nối bền bỉ và giữ nhịp quan hệ";
      case "SI" -> "Hỗ trợ chân thành và lan tỏa sự ổn định";
      case "SC" -> "Ổn định, chỉn chu và đáng tin cậy";
      case "CS" -> "Chuẩn mực, cẩn trọng và bền bỉ";
      case "CD" -> "Phân tích sâu và tối ưu bằng tiêu chuẩn";
      case "DC" -> "Quyết đoán nhưng vẫn coi trọng tính chuẩn xác";
      case "DS" -> "Thúc đẩy kết quả nhưng vẫn giữ nhịp ổn định";
      case "SD" -> "Điềm tĩnh, chắc chắn và biết tăng tốc đúng lúc";
      case "IC" -> "Cởi mở, linh hoạt nhưng vẫn có tiêu chuẩn rõ";
      case "CI" -> "Phân tích tốt và giao tiếp có chủ đích";
      default -> switch (normalizeDimension(primaryDimension)) {
        case "D" -> "Thiên về hành động, tốc độ và mục tiêu rõ ràng";
        case "I" -> "Thiên về kết nối, giao tiếp và ảnh hưởng";
        case "S" -> "Thiên về ổn định, hỗ trợ và duy trì nhịp bền";
        case "C" -> "Thiên về phân tích, logic và tiêu chuẩn";
        default -> "Phản ánh cách bạn vận hành tự nhiên trong công việc và cuộc sống";
      };
    };
  }

  private String buildDiscArchetypeCopy(String discMain, String primaryDimension) {
    String archetype = resolvePersonalityArchetype(primaryDimension);
    String tagline = resolvePersonalityTagline(discMain, primaryDimension);
    if (archetype.isBlank()) {
      return tagline;
    }
    if (tagline.isBlank()) {
      return archetype;
    }
    return archetype + ": " + tagline;
  }

  private String buildStrengthsCopy(String primaryDimension, String supportDimension) {
    List<String> items = new ArrayList<>(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Thường chủ động bắt tay vào việc và giữ nhịp hành động rõ ràng.",
          "Dễ chốt hướng đi khi mục tiêu đã đủ rõ.",
          "Có xu hướng tạo động lực cho người khác bằng sự quyết liệt và tốc độ.");
      case "I" -> List.of(
          "Dễ tạo thiện cảm và mở kết nối với người xung quanh.",
          "Truyền đạt ý tưởng bằng năng lượng tích cực và khá thuyết phục.",
          "Giữ tinh thần nhóm tốt khi môi trường cần sự lan tỏa và khích lệ.");
      case "S" -> List.of(
          "Kiên nhẫn, bền bỉ và giữ được nhịp phối hợp ổn định.",
          "Biết lắng nghe và hỗ trợ người khác theo cách đáng tin cậy.",
          "Giữ cam kết khá tốt khi công việc cần sự đều đặn và chắc chắn.");
      case "C" -> List.of(
          "Quan sát kỹ, phân tích logic và phát hiện chi tiết quan trọng.",
          "Làm việc cẩn thận khi có tiêu chuẩn rõ ràng.",
          "Ưu tiên chất lượng, độ chính xác và tính nhất quán trong đầu ra.");
      default -> List.of();
    });

    String supportHint = switch (normalizeDimension(supportDimension)) {
      case "D" -> "Khi cần, bạn cũng có thể tăng tốc và chốt quyết định khá dứt khoát.";
      case "I" -> "Bạn còn có thêm thế mạnh kết nối và tạo không khí tích cực khi làm việc nhóm.";
      case "S" -> "Bạn cũng biết giữ nhịp ổn định và phối hợp mềm mại khi bối cảnh yêu cầu.";
      case "C" -> "Bạn vẫn có khả năng soi kỹ chi tiết và chỉnh lại tiêu chuẩn khi cần.";
      default -> "";
    };
    if (!supportHint.isBlank()) {
      items.add(supportHint);
    }
    return bulletList(items);
  }

  private String buildWeaknessesCopy(String primaryDimension, String supportDimension) {
    List<String> items = new ArrayList<>(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Có thể quyết nhanh hơn mức cần thiết khi bị thúc tiến độ.",
          "Dễ sốt ruột nếu người khác phản hồi chậm hoặc thiếu rõ ràng.",
          "Đôi lúc ưu tiên kết quả trước khi đi hết các chi tiết nhỏ.");
      case "I" -> List.of(
          "Có thể bị phân tán khi môi trường quá nhiều kích thích hoặc thay đổi nhanh.",
          "Đôi lúc hứng khởi ban đầu mạnh hơn mức độ bám đuổi đến cùng.",
          "Dễ né cảm giác nặng nề nếu phải xử lý việc quá khô hoặc quá lặp lại.");
      case "S" -> List.of(
          "Có thể chậm ra quyết định khi bối cảnh thay đổi liên tục.",
          "Dễ giữ thói quen cũ quá lâu vì muốn mọi thứ an toàn và ổn định.",
          "Đôi lúc ngại va chạm nên chưa nói thẳng điều cần điều chỉnh.");
      case "C" -> List.of(
          "Có thể mất nhiều thời gian để kiểm tra lại trước khi chốt.",
          "Dễ trở nên khắt khe khi tiêu chuẩn không được làm rõ.",
          "Đôi lúc quá tập trung vào chi tiết khiến tiến độ chậm đi.");
      default -> List.of();
    });

    String supportRisk = switch (normalizeDimension(supportDimension)) {
      case "D" -> "Khi áp lực tăng, bạn có thể đẩy nhịp quyết định nhanh hơn bình thường.";
      case "I" -> "Khi áp lực tăng, bạn có thể cần nhiều phản hồi và tương tác hơn để giữ năng lượng.";
      case "S" -> "Khi áp lực tăng, bạn có thể bám vào vùng quen thuộc nhiều hơn để giữ an toàn.";
      case "C" -> "Khi áp lực tăng, bạn có thể soi kỹ hơn và dễ mệt vì muốn mọi thứ thật chuẩn.";
      default -> "";
    };
    if (!supportRisk.isBlank()) {
      items.add(supportRisk);
    }
    return bulletList(items);
  }

  private String buildMotivationCopy(String primaryDimension, Map<String, Double> ikigaiScores) {
    List<String> items = new ArrayList<>(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Mục tiêu rõ ràng và cảm giác chinh phục kết quả cụ thể.",
          "Quyền chủ động đủ lớn để tự quyết và đẩy tiến độ.");
      case "I" -> List.of(
          "Không gian kết nối, tương tác và được ghi nhận đóng góp.",
          "Cơ hội lan tỏa ý tưởng hoặc tạo ảnh hưởng tích cực lên người khác.");
      case "S" -> List.of(
          "Môi trường ổn định, đáng tin và có nhịp phối hợp lâu dài.",
          "Cảm giác mình đang hỗ trợ được người khác một cách thực tế.");
      case "C" -> List.of(
          "Bối cảnh có tiêu chuẩn rõ, đủ dữ liệu và logic để làm tốt.",
          "Cảm giác đầu ra mình tạo ra là chính xác, chỉn chu và có giá trị.");
      default -> List.of();
    });

    String ikigaiFocus = joinIkigaiLabels(topIkigaiTraits(ikigaiScores, 2));
    if (!ikigaiFocus.isBlank()) {
      items.add("Bạn thường có thêm động lực khi công việc gắn với " + ikigaiFocus + ".");
    }
    return bulletList(items);
  }

  private String buildStressBehaviorCopy(String primaryDimension) {
    return bulletList(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Dễ tăng tốc và quyết nhanh hơn mức bình thường.",
          "Có thể mất kiên nhẫn nếu tiến độ bị chậm hoặc thiếu dứt khoát.",
          "Thường muốn tự kiểm soát tình huống để giữ nhịp kết quả.");
      case "I" -> List.of(
          "Dễ nói nhanh hơn và cần phản hồi tức thời để bớt căng thẳng.",
          "Có thể bị phân tán nếu bầu không khí xung quanh quá tiêu cực.",
          "Thường muốn tìm người trao đổi để giải tỏa áp lực.");
      case "S" -> List.of(
          "Dễ thu mình hơn và cố giữ mọi thứ ổn định như cũ.",
          "Có thể né xung đột trực diện khi áp lực tăng cao.",
          "Thường cần thêm thời gian để thích nghi với thay đổi bất ngờ.");
      case "C" -> List.of(
          "Dễ soi kỹ chi tiết và nâng chuẩn cao hơn khi thấy rủi ro tăng.",
          "Có xu hướng muốn thêm dữ liệu trước khi chốt quyết định.",
          "Đôi lúc trở nên khắt khe hơn để giảm cảm giác thiếu chắc chắn.");
      default -> List.of();
    });
  }

  private String buildCommunicationStyleCopy(String primaryDimension, String supportDimension) {
    List<String> items = new ArrayList<>(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Ưu tiên nói thẳng, nhanh và đi vào trọng tâm.",
          "Thích trao đổi theo hướng chốt việc, chốt mục tiêu và chốt hành động.");
      case "I" -> List.of(
          "Giao tiếp mở, dễ tạo cảm giác gần gũi và có sức lan tỏa.",
          "Thường dùng sự nhiệt tình để kéo cuộc trò chuyện tiến lên.");
      case "S" -> List.of(
          "Nói chuyện điềm tĩnh, dễ nghe và ưu tiên sự hài hòa.",
          "Thường lắng nghe kỹ trước khi phản hồi hoặc đưa góp ý.");
      case "C" -> List.of(
          "Ưu tiên sự rõ ràng, logic và thông tin có cấu trúc.",
          "Muốn nội dung đủ chuẩn xác trước khi trao đổi hoặc cam kết.");
      default -> List.of();
    });

    String supportHint = switch (normalizeDimension(supportDimension)) {
      case "D" -> "Khi cần, bạn vẫn có thể tăng sự dứt khoát để đẩy cuộc trao đổi về quyết định.";
      case "I" -> "Bạn cũng có khả năng thêm sự thân thiện và kết nối để cuộc trao đổi dễ mở hơn.";
      case "S" -> "Bạn cũng biết điều chỉnh nhịp giao tiếp để người khác cảm thấy an toàn và được lắng nghe.";
      case "C" -> "Bạn cũng có xu hướng soi lại chi tiết để tránh hiểu sai hoặc thiếu chuẩn xác.";
      default -> "";
    };
    if (!supportHint.isBlank()) {
      items.add(supportHint);
    }
    return bulletList(items);
  }

  private String buildWorkEnvironmentCopy(String primaryDimension) {
    return bulletList(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Mục tiêu rõ ràng, quyền chủ động đủ lớn và đo được kết quả.",
          "Nhịp làm việc nhanh nhưng không bị kiểm soát vi mô.",
          "Môi trường khuyến khích quyết định và chịu trách nhiệm.");
      case "I" -> List.of(
          "Nhiều tương tác, trao đổi và cơ hội kết nối với người khác.",
          "Không khí mở, năng động và có chỗ cho ý tưởng mới.",
          "Môi trường ghi nhận sự lan tỏa và đóng góp tích cực.");
      case "S" -> List.of(
          "Quy trình ổn định, nhịp làm việc đều và kỳ vọng rõ ràng.",
          "Đội nhóm hỗ trợ nhau và ít biến động vô lý.",
          "Môi trường coi trọng sự hợp tác, bền bỉ và tin cậy.");
      case "C" -> List.of(
          "Tiêu chuẩn, quy trình và tiêu chí đánh giá được làm rõ.",
          "Có đủ dữ liệu, thông tin và thời gian để phân tích hợp lý.",
          "Môi trường tôn trọng chất lượng, logic và tính nhất quán.");
      default -> List.of();
    });
  }

  private String buildCareerFieldsCopy(List<String> careerTitles, String primaryDimension) {
    List<String> items = new ArrayList<>();
    if (careerTitles != null) {
      for (String careerTitle : careerTitles) {
        String cleaned = cleanText(careerTitle);
        if (!cleaned.isBlank()) {
          items.add(cleaned);
        }
        if (items.size() >= 3) {
          break;
        }
      }
    }
    if (items.isEmpty()) {
      items.addAll(careerFieldFallbacks(primaryDimension));
    }
    return bulletList(items);
  }

  private List<String> careerFieldFallbacks(String primaryDimension) {
    return switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of("Kinh doanh tăng trưởng", "Quản lý dự án", "Phát triển đối tác");
      case "I" -> List.of("Marketing - truyền thông", "Chăm sóc khách hàng/đối tác", "Đào tạo - sự kiện");
      case "S" -> List.of("Vận hành dịch vụ", "Nhân sự/điều phối", "Chăm sóc khách hàng");
      case "C" -> List.of("Phân tích dữ liệu", "Tài chính - kiểm soát", "QA - quy trình");
      default -> List.of("Công việc phù hợp với phong cách vận hành tự nhiên của bạn");
    };
  }

  private String buildWorkRolesCopy(String primaryDimension, String supportDimension) {
    List<String> items = new ArrayList<>(switch (normalizeDimension(primaryDimension)) {
      case "D" -> List.of(
          "Người khởi xướng mục tiêu và kéo nhịp hành động.",
          "Người chốt hướng đi khi đội nhóm cần sự dứt khoát.");
      case "I" -> List.of(
          "Người kết nối, lan tỏa năng lượng và mở quan hệ.",
          "Người truyền thông, thuyết phục hoặc đại diện tiếng nói của nhóm.");
      case "S" -> List.of(
          "Người giữ nhịp phối hợp và hỗ trợ đội nhóm bền vững.",
          "Người duy trì sự ổn định để tập thể vận hành trơn tru.");
      case "C" -> List.of(
          "Người phân tích, kiểm soát chất lượng và giữ chuẩn đầu ra.",
          "Người tối ưu quy trình và giảm rủi ro bằng sự chỉn chu.");
      default -> List.of();
    });

    String supportHint = switch (normalizeDimension(supportDimension)) {
      case "D" -> "Khi cần, bạn cũng có thể đảm nhận phần tăng tốc và thúc quyết định.";
      case "I" -> "Bạn còn có thể phát huy tốt ở vai trò tạo kết nối và giữ sự tương tác.";
      case "S" -> "Bạn cũng hợp với phần việc giữ nhịp, hỗ trợ và làm mượt phối hợp.";
      case "C" -> "Bạn cũng làm tốt khi cần soi chuẩn, rà chi tiết và chỉnh quy trình.";
      default -> "";
    };
    if (!supportHint.isBlank()) {
      items.add(supportHint);
    }
    return bulletList(items);
  }

  private String formatCareerRecommendationSummary(JsonNode resultJson) {
    if (resultJson == null || !resultJson.path("careerRecommendations").isArray()) {
      return "";
    }

    List<String> parts = new ArrayList<>();
    int count = 0;
    for (JsonNode career : resultJson.path("careerRecommendations")) {
      String title = readText(career, "jobTitle");
      String summary = readText(career, "summary");
      String part = firstNonBlank(
          title.isBlank() ? "" : title + (summary.isBlank() ? "" : ": " + summary),
          summary);
      if (part.isBlank()) {
        continue;
      }
      parts.add(part);
      count++;
      if (count >= 2) {
        break;
      }
    }
    return String.join(" ", parts);
  }

  // Quốc Trí: bản free chỉ có ít khoảng trống nên cần rút gọn nội dung trước khi đổ vào PDF.
  private String buildFreeDiscSummary(
      String discMain,
      String primaryDimension,
      JsonNode coachingReport,
      Result result) {
    return limitText(firstNonBlank(
        resolvePersonalityTagline(discMain, primaryDimension),
        readText(coachingReport, "executiveSummary"),
        nullSafe(result == null ? null : result.getSummary())), 78);
  }

  private String buildFreeDiscBulletList(
      List<String> primaryItems,
      List<String> fallbackItems,
      String fallbackBulletText) {
    List<String> items = compactBulletItems(primaryItems, 3, 58);
    if (items.isEmpty()) {
      items = compactBulletItems(fallbackItems, 3, 58);
    }
    if (items.isEmpty()) {
      items = compactBulletItems(parseBulletLines(fallbackBulletText), 3, 58);
    }
    return bulletList(items);
  }

  private String limitText(String value, int maxLength) {
    String cleaned = cleanText(value);
    if (cleaned.isBlank() || maxLength <= 0 || cleaned.length() <= maxLength) {
      return cleaned;
    }
    return cleaned.substring(0, maxLength).trim();
  }

  private String level(Double value) {
    if (value == null) {
      return "mid";
    }
    if (value >= 3.7d) {
      return "high";
    }
    if (value <= 2.6d) {
      return "low";
    }
    return "mid";
  }

  private List<String> topBigFiveTraits(Map<String, Double> scores, int limit) {
    if (scores == null || scores.isEmpty()) {
      return List.of();
    }
    return scores.entrySet().stream()
        .filter(entry -> BIG_FIVE_DIMENSIONS.contains(entry.getKey()) && entry.getValue() != null)
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(Math.max(1, limit))
        .map(Map.Entry::getKey)
        .toList();
  }

  private String joinBigFiveLabels(List<String> keys) {
    return keys.stream()
        .map(key -> BIG_FIVE_LABELS.getOrDefault(key, key))
        .reduce((left, right) -> left + " và " + right)
        .orElse("");
  }

  private List<String> topIkigaiTraits(Map<String, Double> scores, int limit) {
    if (scores == null || scores.isEmpty()) {
      return List.of();
    }
    return scores.entrySet().stream()
        .filter(entry -> IKIGAI_DIMENSIONS.contains(entry.getKey()) && entry.getValue() != null)
        .sorted(Map.Entry.<String, Double>comparingByValue().reversed())
        .limit(Math.max(1, limit))
        .map(Map.Entry::getKey)
        .toList();
  }

  private String joinIkigaiLabels(List<String> keys) {
    return keys.stream()
        .map(key -> IKIGAI_LABELS.getOrDefault(key, key))
        .reduce((left, right) -> left + " và " + right)
        .orElse("");
  }

  private String resolveTemplateConfigKey(TestSession session) {
    // Quốc Trí: bản free đã có template riêng nên dùng đúng config free.
    return session != null && session.getMode() == TestMode.PAID
        ? "pdfTemplateConfigPaid"
        : "pdfTemplateConfig";
  }

  private String resolveBasePdfResource(String templateConfigKey) {
    return "pdfTemplateConfigPaid".equals(templateConfigKey)
        ? PAID_BASE_PDF_RESOURCE
        : FREE_BASE_PDF_RESOURCE;
  }

  private String resolveBasePdfResourceForTemplate(String templateType) {
    return "PAID".equals(templateType)
        ? PAID_BASE_PDF_RESOURCE
        : FREE_BASE_PDF_RESOURCE;
  }

  private String resolveTemplateType(String templateType) {
    return templateType == null || templateType.isBlank()
        ? "FREE"
        : templateType.toUpperCase(Locale.ROOT);
  }

  private String resolveSupportType(String discMain, List<String> topDimensions) {
    if (discMain != null) {
      String compact = discMain.trim().toUpperCase(Locale.ROOT).replaceAll("[^DISC]", "");
      if (compact.length() >= 2) {
        return String.valueOf(compact.charAt(1));
      }
    }

    if (topDimensions != null && topDimensions.size() > 1) {
      return normalizeDimension(topDimensions.get(1));
    }
    return "";
  }

  private String normalizeDimension(String value) {
    if (value == null || value.isBlank()) {
      return "";
    }
    String normalized = value.trim().toUpperCase(Locale.ROOT);
    return DISC_DIMENSIONS.contains(normalized) ? normalized : "";
  }

  private String numericPercentValue(String rawValue) {
    if (rawValue == null || rawValue.isBlank()) {
      return "";
    }
    return rawValue.replace("%", "").trim();
  }

  private String careerValue(List<String> careerTitles, String primaryDimension, int index) {
    if (careerTitles != null && index >= 0 && index < careerTitles.size()) {
      return careerTitles.get(index);
    }

    String key = normalizeDimension(primaryDimension);
    List<String> fallbacks = FALLBACK_CAREERS.getOrDefault(key, FALLBACK_CAREERS.get("D"));
    return index >= 0 && index < fallbacks.size() ? fallbacks.get(index) : "";
  }

  private List<String> buildCautionCareers(String primaryDimension, String supportDimension) {
    LinkedHashSet<String> values = new LinkedHashSet<>();
    addFirst(values, CAREER_CAUTIONS.get(normalizeDimension(primaryDimension)));
    addFirst(values, CAREER_CAUTIONS.get(normalizeDimension(supportDimension)));
    addAt(values, CAREER_CAUTIONS.get(normalizeDimension(primaryDimension)), 1);
    addAt(values, CAREER_CAUTIONS.get(normalizeDimension(supportDimension)), 1);
    return new ArrayList<>(values);
  }

  private void addFirst(LinkedHashSet<String> values, List<String> source) {
    addAt(values, source, 0);
  }

  private void addAt(LinkedHashSet<String> values, List<String> source, int index) {
    if (source == null || index < 0 || index >= source.size()) {
      return;
    }
    String value = cleanText(source.get(index));
    if (!value.isBlank()) {
      values.add(value);
    }
  }

  private ProfileCopy buildProfileCopy(String primaryDimension, String supportDimension) {
    String primary = normalizeDimension(primaryDimension);
    String support = normalizeDimension(supportDimension);

    String resolvedPrimary = primary.isBlank() ? "D" : primary;
    String resolvedSupport = support.isBlank() ? resolvedPrimary : support;

    return new ProfileCopy(
        DECISION_STYLES.getOrDefault(resolvedPrimary, DECISION_STYLES.get("D")),
        combineWithSupport(
            WORK_ENVIRONMENTS.getOrDefault(resolvedPrimary, WORK_ENVIRONMENTS.get("D")),
            resolvedPrimary,
            resolvedSupport,
            "thêm không gian phối hợp"),
        combineWithSupport(
            ENERGY_STYLES.getOrDefault(resolvedPrimary, ENERGY_STYLES.get("D")),
            resolvedPrimary,
            resolvedSupport,
            "giữ được nhịp phối hợp"),
        ROLE_STYLES.getOrDefault(resolvedPrimary, ROLE_STYLES.get("D")),
        LEARNING_STYLES.getOrDefault(resolvedPrimary, LEARNING_STYLES.get("D")),
        CAREER_PACES.getOrDefault(resolvedPrimary, CAREER_PACES.get("D")));
  }

  private String combineWithSupport(
      String primaryText,
      String primaryDimension,
      String supportDimension,
      String fallbackSupportText) {
    if (supportDimension.isBlank() || primaryDimension.equals(supportDimension)) {
      return primaryText;
    }

    String supportText = switch (supportDimension) {
      case "D" -> "giữ quyền chủ động";
      case "I" -> "có thêm tương tác";
      case "S" -> "giữ nhịp ổn định";
      case "C" -> "có dữ liệu rõ ràng";
      default -> fallbackSupportText;
    };
    return primaryText + ", " + supportText;
  }

  private String readText(JsonNode node, String fieldName) {
    if (node == null || fieldName == null) {
      return "";
    }
    JsonNode value = node.path(fieldName);
    return value.isMissingNode() || value.isNull() ? "" : cleanText(value.asText(""));
  }

  private String bulletList(List<String> items) {
    if (items == null || items.isEmpty()) {
      return "";
    }
    List<String> cleaned = items.stream()
        .map(this::cleanText)
        .filter(item -> !item.isBlank())
        .map(item -> "- " + item)
        .toList();
    return cleaned.isEmpty() ? "" : String.join("\n", cleaned);
  }

  private List<String> compactBulletItems(List<String> items, int maxItems, int maxLength) {
    if (items == null || items.isEmpty() || maxItems <= 0 || maxLength <= 0) {
      return List.of();
    }

    List<String> compacted = new ArrayList<>();
    for (String item : items) {
      String cleaned = cleanText(item);
      cleaned = cleaned.replaceFirst("^[-•]\\s*", "");
      if (cleaned.isBlank()) {
        continue;
      }
      compacted.add(limitText(cleaned, maxLength));
      if (compacted.size() >= maxItems) {
        break;
      }
    }
    return compacted;
  }

  private List<String> parseBulletLines(String value) {
    String cleaned = cleanText(value);
    if (cleaned.isBlank()) {
      return List.of();
    }

    List<String> lines = new ArrayList<>();
    for (String part : cleaned.split("\\R+")) {
      String line = cleanText(part).replaceFirst("^[-•]\\s*", "");
      if (!line.isBlank()) {
        lines.add(line);
      }
    }
    return lines;
  }

  private String firstNonBlank(String... values) {
    if (values == null) {
      return "";
    }
    for (String value : values) {
      String cleaned = cleanText(value);
      if (!cleaned.isBlank()) {
        return cleaned;
      }
    }
    return "";
  }

  private String nullSafe(String value) {
    return value == null ? "" : value;
  }

  private String cleanText(String value) {
    if (value == null) {
      return "";
    }
    return value
        .replace('\u2011', '-')
        .replace('\u2013', '-')
        .replace('\u2014', '-')
        .replace('\t', ' ')
        .replaceAll("[ ]{2,}", " ")
        .trim();
  }

  private Color parseColor(String rawValue) {
    String value = rawValue == null || rawValue.isBlank() ? "#000000" : rawValue.trim();
    try {
      return Color.decode(value);
    } catch (NumberFormatException ex) {
      return Color.BLACK;
    }
  }

  private byte[] readRequiredResource(String resourcePath) {
    try (InputStream inputStream = requiredResourceStream(resourcePath)) {
      return inputStream.readAllBytes();
    } catch (IOException ex) {
      throw new IllegalStateException("Failed to read resource " + resourcePath, ex);
    }
  }

  private InputStream requiredResourceStream(String resourcePath) {
    return Objects.requireNonNull(
        getClass().getResourceAsStream(resourcePath),
        "Missing resource: " + resourcePath);
  }

  private record ProfileCopy(
      String decisionStyle,
      String idealWorkEnvironment,
      String bestEnergyUse,
      String preferredRole,
      String learningStyle,
      String careerPace) {}

  private record PdfCustomVariableRule(
      String token,
      String profileType,
      String primaryMetric,
      Float primaryMin,
      Float primaryMax,
      String secondaryMetric,
      Float secondaryMin,
      Float secondaryMax,
      List<String> options) {}

  private record CardLayout(
      float x,
      float y,
      float width,
      float height) {}

  private static final class LineBalanceBest {
    private double score;
    private List<String> lines;

    private LineBalanceBest(double score, List<String> lines) {
      this.score = score;
      this.lines = List.copyOf(lines);
    }

    private double score() {
      return score;
    }

    private List<String> lines() {
      return lines;
    }

    private void update(double nextScore, List<String> nextLines) {
      this.score = nextScore;
      this.lines = List.copyOf(nextLines);
    }
  }

  private record FieldPlacement(
      String key,
      int page,
      float x,
      float y,
      float width,
      float height,
      float fontSize,
      String color,
      String align,
      String backgroundColor,
      String appearance,
      String borderColor,
      float borderWidth,
      float radius,
      float padding,
      float paddingX,
      float paddingY,
      String verticalAlign) {

    private FieldPlacement withY(float newY) {
      return new FieldPlacement(
          key,
          page,
          x,
          newY,
          width,
          height,
          fontSize,
          color,
          align,
          backgroundColor,
          appearance,
          borderColor,
          borderWidth,
          radius,
          padding,
          paddingX,
          paddingY,
          verticalAlign);
    }

    private boolean usesCardAppearance() {
      return "card".equals(normalizedAppearance());
    }

    private boolean usesHighlightAppearance() {
      return "highlight".equals(normalizedAppearance()) && !backgroundColor.isBlank();
    }

    private float resolvedPaddingX() {
      if (paddingX > 0f) {
        return paddingX;
      }
      if (padding > 0f) {
        return padding;
      }
      return DEFAULT_CARD_PADDING;
    }

    private float resolvedPaddingY() {
      if (paddingY > 0f) {
        return paddingY;
      }
      if (padding > 0f) {
        return padding;
      }
      return DEFAULT_CARD_PADDING;
    }

    private float resolvedRadius(float fieldWidth, float fieldHeight) {
      float targetRadius = radius > 0f ? radius : DEFAULT_CARD_RADIUS;
      return Math.min(targetRadius, Math.min(fieldWidth, fieldHeight) / 2f);
    }

    private float resolvedBorderWidth() {
      if (borderWidth > 0f) {
        return borderWidth;
      }
      return usesCardAppearance() && !borderColor.isBlank() ? DEFAULT_CARD_BORDER_WIDTH : 0f;
    }

    private String normalizedVerticalAlign() {
      return verticalAlign == null ? "top" : verticalAlign.trim().toLowerCase(Locale.ROOT);
    }

    private String normalizedAppearance() {
      return appearance == null ? "plain" : appearance.trim().toLowerCase(Locale.ROOT);
    }

    private static FieldPlacement from(String key, Map<?, ?> item) {
      boolean useDefaultInsightCard = shouldUseDefaultInsightCard(key, item);
      String backgroundColor = stringValue(
          item.get("backgroundColor"),
          useDefaultInsightCard ? DEFAULT_INSIGHT_CARD_BACKGROUND : "");
      String appearance = stringValue(
          item.get("appearance"),
          useDefaultInsightCard ? "card" : (backgroundColor.isBlank() ? "plain" : "highlight"));
      String borderColor = stringValue(
          item.get("borderColor"),
          useDefaultInsightCard ? DEFAULT_INSIGHT_CARD_BORDER : "");
      return new FieldPlacement(
          key,
          integerValue(item.get("page"), 1),
          floatValue(item.get("x"), 50f),
          floatValue(item.get("y"), 500f),
          floatValue(item.get("width"), DEFAULT_FIELD_WIDTH),
          floatValue(item.get("height"), DEFAULT_FIELD_HEIGHT),
          floatValue(item.get("fontSize"), DEFAULT_FONT_SIZE),
          stringValue(item.get("color"), "#000000"),
          stringValue(item.get("align"), "left"),
          backgroundColor,
          appearance,
          borderColor,
          floatValue(item.get("borderWidth"), useDefaultInsightCard ? DEFAULT_CARD_BORDER_WIDTH : 0f),
          floatValue(item.get("radius"), useDefaultInsightCard ? DEFAULT_INSIGHT_CARD_RADIUS : 0f),
          floatValue(item.get("padding"), useDefaultInsightCard ? DEFAULT_INSIGHT_CARD_PADDING : 0f),
          floatValue(item.get("paddingX"), 0f),
          floatValue(item.get("paddingY"), 0f),
          stringValue(item.get("verticalAlign"), "top"));
    }

    private static boolean shouldUseDefaultInsightCard(String key, Map<?, ?> item) {
      if (!DEFAULT_INSIGHT_CARD_KEYS.contains(key)) {
        return false;
      }
      Object appearance = item.get("appearance");
      if (appearance != null && !appearance.toString().trim().isEmpty()) {
        return false;
      }
      Object backgroundColor = item.get("backgroundColor");
      if (backgroundColor != null && !backgroundColor.toString().trim().isEmpty()) {
        return false;
      }
      Object borderColor = item.get("borderColor");
      return borderColor == null || borderColor.toString().trim().isEmpty();
    }

    private static int integerValue(Object value, int fallback) {
      if (value instanceof Number number) {
        return number.intValue();
      }
      if (value instanceof String text && !text.isBlank()) {
        try {
          return (int) Float.parseFloat(text.trim());
        } catch (NumberFormatException ignored) {
          return fallback;
        }
      }
      return fallback;
    }

    private static float floatValue(Object value, float fallback) {
      if (value instanceof Number number) {
        return number.floatValue();
      }
      if (value instanceof String text && !text.isBlank()) {
        try {
          return Float.parseFloat(text.trim());
        } catch (NumberFormatException ignored) {
          return fallback;
        }
      }
      return fallback;
    }

    private static String stringValue(Object value, String fallback) {
      if (value == null) {
        return fallback;
      }
      String text = value.toString().trim();
      return text.isEmpty() ? fallback : text;
    }
  }
}
