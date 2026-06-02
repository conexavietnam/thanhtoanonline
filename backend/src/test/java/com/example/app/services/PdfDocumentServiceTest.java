package com.example.app.services;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.example.app.models.AppUser;
import com.example.app.models.Result;
import com.example.app.models.TestMode;
import com.example.app.models.TestSession;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.awt.Rectangle;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.apache.pdfbox.text.PDFTextStripperByArea;
import org.junit.jupiter.api.Test;

class PdfDocumentServiceTest {
  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void previewUsesBaseTemplateAndOverlaysSampleData() throws IOException {
    PdfDocumentService service = new PdfDocumentService(mock(AdminSettingsService.class), objectMapper);
    Map<String, Object> config = Map.ofEntries(
        Map.entry("user_name", List.of(field(1, 80, 650, 220, 28))),
        Map.entry("user_gender", List.of(field(1, 80, 620, 120, 14))),
        Map.entry("disc_type", List.of(field(1, 80, 590, 120, 14))),
        Map.entry("disc_summary", List.of(field(1, 80, 550, 320, 36, 12))),
        Map.entry("big5_summary", List.of(field(1, 80, 500, 320, 36, 12))),
        Map.entry("ikigai_summary", List.of(field(1, 80, 450, 320, 36, 12))),
        Map.entry("personality_archetype", List.of(field(1, 80, 410, 180, 18, 12))),
        Map.entry("personality_tagline", List.of(field(1, 80, 380, 320, 36, 12))),
        Map.entry("career_top1", List.of(field(1, 80, 340, 180, 18, 12))),
        Map.entry("career_description", List.of(field(1, 80, 300, 320, 48, 12))),
        Map.entry("growth_advice", List.of(field(1, 80, 240, 320, 48, 12))),
        Map.entry("development_focus", List.of(field(1, 80, 180, 320, 36, 12))),
        Map.entry("final_summary", List.of(field(1, 80, 130, 320, 48, 12))));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("FREE", config);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      assertEquals(28, document.getNumberOfPages());

      String text = new PDFTextStripper().getText(document);
      assertTrue(text.contains("Nguyễn Văn A"));
      assertTrue(text.contains("Nữ"));
      assertTrue(text.contains("D"));
      assertTrue(text.contains("thiên hành động"));
      assertTrue(text.contains("tận tâm"));
      assertTrue(text.contains("điều mình yêu thích"));
      assertTrue(text.contains("Người dẫn dắt"));
      assertTrue(text.contains("Dẫn dắt rõ ràng"));
      assertTrue(text.contains("Sales Manager"));
      assertTrue(text.contains("dẫn dắt mục tiêu"));
      assertTrue(text.contains("Đặt mục tiêu ngắn hạn rõ ràng"));
      assertTrue(text.contains("Tập trung vào điều bạn làm tốt nhất"));
      assertTrue(text.contains("chủ động tạo đà"));
    }
  }

  @Test
  void exportUsesSavedSettingsAndRealSessionValues() throws IOException {
    AdminSettingsService settingsService = mock(AdminSettingsService.class);
    when(settingsService.get()).thenReturn(Map.of(
        "pdfTemplateConfigPaid", Map.ofEntries(
            Map.entry("fullName", List.of(field(2, 650, 840, 760, 60, 36))),
            Map.entry("phoneNumber", List.of(field(2, 650, 753, 760, 60, 36))),
            Map.entry("email", List.of(field(2, 650, 675, 760, 60, 30))),
            Map.entry("address", List.of(field(2, 650, 573, 760, 84, 28))),
            Map.entry("disc_D", List.of(cardField(20, 68, 414, 680, 148, 42, "center", "middle", 18))),
            Map.entry("disc_I", List.of(cardField(20, 824, 414, 680, 148, 42, "center", "middle", 18))),
            Map.entry("disc_S", List.of(cardField(20, 68, 248, 680, 148, 42, "center", "middle", 18))),
            Map.entry("disc_C", List.of(cardField(20, 824, 248, 680, 148, 42, "center", "middle", 18))),
            Map.entry("disc_primary_axis", List.of(cardField(22, 68, 1462, 1100, 420, 28))),
            Map.entry("disc_secondary_axis", List.of(cardField(23, 68, 718, 1150, 430, 28))),
            Map.entry("disc_low_zone", List.of(cardField(25, 68, 1549, 980, 250, 28, "left", "top", 24))),
            Map.entry("disc_combination", List.of(cardField(26, 68, 389, 1100, 360, 28))),
            Map.entry("disc_archetype", List.of(cardField(28, 68, 1049, 1180, 420, 26))),
            Map.entry("disc_strengths", List.of(cardField(30, 68, 702, 1220, 520, 24))),
            Map.entry("disc_weaknesses", List.of(cardField(32, 68, 1299, 1220, 500, 24))),
            Map.entry("disc_motivation", List.of(cardField(33, 68, 158, 1220, 420, 24))),
            Map.entry("disc_stress_behavior", List.of(cardField(35, 68, 1549, 1250, 250, 24, "left", "top", 24))),
            Map.entry("disc_communication_style", List.of(cardField(36, 68, 809, 1300, 330, 24))),
            Map.entry("disc_work_environment", List.of(cardField(37, 68, 552, 1280, 350, 24))),
            Map.entry("disc_career_fields", List.of(cardField(38, 68, 703, 1220, 280, 24, "left", "top", 24))),
            Map.entry("disc_work_roles", List.of(cardField(39, 68, 1122, 1220, 430, 24)))
        )));

    PdfDocumentService service = new PdfDocumentService(settingsService, objectMapper);

    AppUser owner = new AppUser();
    owner.setFullName("Trần Thị B");
    owner.setEmail("tranthib@example.com");
    owner.setPhoneNumber("0988 999 888");
    owner.setDateOfBirth(LocalDate.of(1998, 2, 10));
    owner.setGender("Nữ");

    TestSession session = new TestSession();
    session.setMode(TestMode.PAID);
    session.setOwnerUser(owner);
    session.setTakerName("Trần Thị B");
    session.setCompletedAt(Instant.parse("2026-03-02T10:15:30Z"));

    ObjectNode resultJson = objectMapper.createObjectNode();
    ArrayNode topDimensions = objectMapper.createArrayNode().add("D").add("I");
    resultJson.set("topDimensions", topDimensions);
    ArrayNode dimensionScores = objectMapper.createArrayNode();
    dimensionScores.add(score("D", 82));
    dimensionScores.add(score("I", 74));
    dimensionScores.add(score("S", 49));
    dimensionScores.add(score("C", 58));
    resultJson.set("dimensionScores", dimensionScores);
    ObjectNode bigFiveScores = objectMapper.createObjectNode();
    bigFiveScores.put("openness", 4.2);
    bigFiveScores.put("conscientiousness", 4.4);
    bigFiveScores.put("extraversion", 3.8);
    bigFiveScores.put("agreeableness", 3.6);
    bigFiveScores.put("neuroticism", 2.3);
    resultJson.set("bigFiveScores", bigFiveScores);
    ObjectNode ikigaiScores = objectMapper.createObjectNode();
    ikigaiScores.put("passion", 4.5);
    ikigaiScores.put("strength", 4.1);
    ikigaiScores.put("value", 4.3);
    ikigaiScores.put("opportunity", 3.9);
    resultJson.set("ikigaiScores", ikigaiScores);
    ObjectNode coachingReport = objectMapper.createObjectNode();
    coachingReport.put("executiveSummary", "Bạn có xu hướng hành động nhanh, rõ mục tiêu và thích tạo đà cho tập thể.");
    coachingReport.put("profileCode", "DI");
    coachingReport.set("strengths", objectMapper.createArrayNode()
        .add("Quyết đoán trong hành động")
        .add("Truyền năng lượng cho nhóm"));
    coachingReport.set("blindSpots", objectMapper.createArrayNode()
        .add("Dễ nóng vội khi tiến độ chậm")
        .add("Có thể bỏ qua chi tiết nhỏ"));
    coachingReport.set("communicationPlaybook", objectMapper.createArrayNode()
        .add("Thích trao đổi ngắn gọn")
        .add("Muốn phản hồi nhanh và rõ"));
    resultJson.set("coachingReport", coachingReport);
    ArrayNode careerRecommendations = objectMapper.createArrayNode();
    careerRecommendations.add(career("Sales Manager", "Dẫn dắt tăng trưởng, mở rộng khách hàng và chốt mục tiêu doanh số."));
    careerRecommendations.add(career("Business Development", "Tìm kiếm cơ hội mới, phát triển quan hệ và mở rộng thị trường."));
    careerRecommendations.add(career("Project Manager", "Điều phối nguồn lực, tiến độ và chất lượng để ra kết quả đúng hạn."));
    resultJson.set("careerRecommendations", careerRecommendations);

    Result result = new Result();
    result.setResultJson(resultJson);
    result.setSummary("DISC profile: D/I");

    byte[] pdfBytes = service.buildReportPdf(session, result);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      assertEquals(45, document.getNumberOfPages());

      String text = new PDFTextStripper().getText(document);
      assertTrue(text.contains("Trần Thị B"));
      assertTrue(text.contains("0988 999 888"));
      assertTrue(text.contains("tranthib@example.com"));
      assertTrue(text.contains("D: 31%"));
      assertTrue(text.contains("I: 28%"));
      assertTrue(text.contains("Trục D"));
      assertTrue(text.contains("Trục I"));
      assertTrue(text.contains("DI - Chủ động dẫn dắt và tạo ảnh hưởng"));
      assertTrue(text.contains("Người dẫn dắt"));
      assertTrue(text.contains("Thường chủ động bắt tay vào việc"));
      assertTrue(text.contains("Có thể quyết nhanh hơn mức cần thiết"));
      assertTrue(text.contains("Mục tiêu rõ ràng và cảm giác chinh phục"));
      assertTrue(text.contains("Dễ tăng tốc và quyết nhanh hơn mức bình thường"));
      assertTrue(text.contains("Ưu tiên nói thẳng, nhanh và đi vào trọng tâm"));
      assertTrue(text.contains("Mục tiêu rõ ràng, quyền chủ động đủ lớn"));
      assertTrue(text.contains("Sales Manager"));
      assertTrue(text.contains("Người khởi xướng mục tiêu"));
      assertTrue(text.contains("DI"));
    }
  }

  @Test
  void previewNormalizesLegacyContactBlockPositions() throws IOException {
    PdfDocumentService service = new PdfDocumentService(mock(AdminSettingsService.class), objectMapper);
    Map<String, Object> legacyConfig = Map.of(
        "user_name", List.of(field(2, 250, 292, 220, 24, 15)),
        "phoneNumber", List.of(field(2, 250, 240, 205, 24, 15)),
        "email", List.of(field(2, 250, 188, 235, 26, 12)),
        "address", List.of(field(2, 250, 136, 235, 36, 12)));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("FREE", legacyConfig);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      PDFTextStripperByArea stripper = new PDFTextStripperByArea();
      stripper.addRegion("emailLine", new Rectangle(240, 612, 320, 30));
      stripper.addRegion("addressLine", new Rectangle(240, 642, 360, 32));
      stripper.extractRegions(document.getPage(1));

      assertTrue(stripper.getTextForRegion("emailLine").contains("nguyenvana@example.com"));
      assertTrue(stripper.getTextForRegion("addressLine").contains("123 Đường Mẫu"));
    }
  }

  @Test
  void previewNormalizesV22ContactBlockPositions() throws IOException {
    PdfDocumentService service = new PdfDocumentService(mock(AdminSettingsService.class), objectMapper);
    Map<String, Object> v22Config = Map.of(
        "fullName", List.of(field(2, 250, 292, 220, 24, 15)),
        "phoneNumber", List.of(field(2, 250, 260, 205, 24, 15)),
        "email", List.of(field(2, 250, 226, 235, 26, 12)),
        "address", List.of(field(2, 250, 192, 235, 36, 12)));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("FREE", v22Config);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      PDFTextStripperByArea stripper = new PDFTextStripperByArea();
      stripper.addRegion("emailLine", new Rectangle(240, 612, 320, 30));
      stripper.addRegion("addressLine", new Rectangle(240, 642, 360, 32));
      stripper.extractRegions(document.getPage(1));

      assertTrue(stripper.getTextForRegion("emailLine").contains("nguyenvana@example.com"));
      assertTrue(stripper.getTextForRegion("addressLine").contains("123 Đường Mẫu"));
    }
  }

  @Test
  void previewResolvesDiscPdfCustomVariables() throws IOException {
    AdminSettingsService settingsService = mock(AdminSettingsService.class);
    when(settingsService.get()).thenReturn(Map.of(
        "pdfCustomVariables", List.of(pdfCustomVariable(
            "DISC",
            "disc_chinh",
            "D",
            30,
            32,
            "I",
            27,
            29,
            List.of("Bạn đang ở cấu hình DISC D/I khá rõ nét.")))));

    PdfDocumentService service = new PdfDocumentService(settingsService, objectMapper);
    Map<String, Object> config = Map.of(
        "{disc_chinh}", List.of(field(1, 80, 700, 420, 44, 12)));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("PAID", config);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      String text = new PDFTextStripper().getText(document);
      assertTrue(text.contains("Bạn đang ở cấu hình DISC D/I khá rõ nét."));
    }
  }

  @Test
  void previewResolvesBigFivePdfCustomVariables() throws IOException {
    AdminSettingsService settingsService = mock(AdminSettingsService.class);
    when(settingsService.get()).thenReturn(Map.of(
        "pdfCustomVariables", List.of(pdfCustomVariable(
            "BIG5",
            "big5_noi_bat",
            "openness",
            4,
            5,
            "conscientiousness",
            4,
            5,
            List.of("Bạn nổi bật ở sự cởi mở và tính kỷ luật.")))));

    PdfDocumentService service = new PdfDocumentService(settingsService, objectMapper);
    Map<String, Object> config = Map.of(
        "{big5_noi_bat}", List.of(field(1, 80, 640, 420, 44, 12)));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("PAID", config);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      String text = new PDFTextStripper().getText(document);
      assertTrue(text.contains("Bạn nổi bật ở sự cởi mở và tính kỷ luật."));
    }
  }

  @Test
  void previewResolvesIkigaiPdfCustomVariables() throws IOException {
    AdminSettingsService settingsService = mock(AdminSettingsService.class);
    when(settingsService.get()).thenReturn(Map.of(
        "pdfCustomVariables", List.of(pdfCustomVariable(
            "IKIGAI",
            "ikigai_dinh_huong",
            "passion",
            4,
            5,
            "value",
            4,
            5,
            List.of("Bạn có động lực mạnh khi việc làm vừa ý nghĩa vừa đúng thế mạnh.")))));

    PdfDocumentService service = new PdfDocumentService(settingsService, objectMapper);
    Map<String, Object> config = Map.of(
        "{ikigai_dinh_huong}", List.of(field(1, 80, 580, 420, 52, 12)));

    byte[] pdfBytes = service.buildTemplatePreviewPdf("PAID", config);

    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
      String text = new PDFTextStripper().getText(document);
      assertTrue(text.contains("Bạn có động lực mạnh khi việc làm vừa ý nghĩa vừa đúng thế mạnh."));
    }
  }

  private Map<String, Object> templateConfig(
      String key,
      int page,
      int x,
      int y,
      int width,
      int fontSize) {
    return Map.of(key, List.of(field(page, x, y, width, fontSize)));
  }

  private Map<String, Object> field(int page, int x, int y, int width, int fontSize) {
    return field(page, x, y, width, 36, fontSize);
  }

  private Map<String, Object> field(int page, int x, int y, int width, int height, int fontSize) {
    return Map.of(
        "page", page,
        "x", x,
        "y", y,
        "width", width,
        "height", height,
        "fontSize", fontSize,
        "color", "#111111",
        "align", "left");
  }

  private Map<String, Object> cardField(int page, int x, int y, int width, int height, int fontSize) {
    return cardField(page, x, y, width, height, fontSize, "left", "top", 26);
  }

  private Map<String, Object> cardField(
      int page,
      int x,
      int y,
      int width,
      int height,
      int fontSize,
      String align,
      String verticalAlign,
      int padding) {
    Map<String, Object> field = new LinkedHashMap<>();
    field.put("page", page);
    field.put("x", x);
    field.put("y", y);
    field.put("width", width);
    field.put("height", height);
    field.put("fontSize", fontSize);
    field.put("color", "#33434c");
    field.put("align", align);
    field.put("appearance", "card");
    field.put("backgroundColor", "#d8efc1");
    field.put("borderColor", "#b7d39f");
    field.put("borderWidth", 1.5);
    field.put("radius", 28);
    field.put("padding", padding);
    field.put("verticalAlign", verticalAlign);
    return field;
  }

  private ObjectNode score(String dimension, int value) {
    ObjectNode scoreNode = objectMapper.createObjectNode();
    scoreNode.put("dimension", dimension);
    scoreNode.put("score", value);
    return scoreNode;
  }

  private ObjectNode career(String jobTitle, String summary) {
    ObjectNode careerNode = objectMapper.createObjectNode();
    careerNode.put("jobTitle", jobTitle);
    careerNode.put("summary", summary);
    return careerNode;
  }

  private Map<String, Object> pdfCustomVariable(
      String profileType,
      String token,
      String primaryMetric,
      Number primaryMin,
      Number primaryMax,
      String secondaryMetric,
      Number secondaryMin,
      Number secondaryMax,
      List<String> options) {
    Map<String, Object> variable = new LinkedHashMap<>();
    variable.put("profileType", profileType);
    variable.put("token", token);
    variable.put("primaryMetric", primaryMetric);
    variable.put("primaryMin", primaryMin);
    variable.put("primaryMax", primaryMax);
    variable.put("secondaryMetric", secondaryMetric);
    variable.put("secondaryMin", secondaryMin);
    variable.put("secondaryMax", secondaryMax);
    variable.put("options", options);
    return variable;
  }
}
