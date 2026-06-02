package com.example.app.services;

import com.example.app.dto.request.ImportQuestionsRequest;
import com.example.app.dto.request.UpdateCategoryRequest;
import com.example.app.dto.request.UpdateQuestionRequest;
import com.example.app.dto.response.AdminCategoryResponse;
import com.example.app.dto.response.AdminQuestionResponse;
import com.example.app.dto.response.AdminQuestionResponse.QuestionOptionResponse;
import com.example.app.dto.response.CategoryWeightValidationResponse;
import com.example.app.dto.response.ImportQuestionsResponse;
import com.example.app.dto.response.QuestionsCsvResponse;
import com.example.app.models.Category;
import com.example.app.models.Question;
import com.example.app.models.QuestionOption;
import com.example.app.repositories.CategoryRepository;
import com.example.app.repositories.QuestionOptionRepository;
import com.example.app.repositories.QuestionRepository;
import com.example.app.repositories.TestDefinitionRepository;
import com.example.app.utils.ApiException;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Pattern;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class AdminCatalogService {
  private static final List<String> XLSX_HEADERS = List.of(
      "id",
      "testCode",
      "categoryId",
      "content",
      "traitKey",
      "reverseScored",
      "weight",
      "orderIndex"
  );
  private static final Pattern TRAIT_KEY_PATTERN = Pattern.compile("^[A-Z0-9_]{1,50}$");
  private static final int MAX_CONTENT_LENGTH = 5000;
  private static final int MAX_IMPORT_ROWS = 5000;
  private static final BigDecimal MAX_WEIGHT = new BigDecimal("1000");

  private final TestDefinitionRepository testDefinitionRepository;
  private final CategoryRepository categoryRepository;
  private final QuestionRepository questionRepository;
  private final QuestionOptionRepository questionOptionRepository;

  public List<AdminCategoryResponse> listCategories(String testCode) {
    List<Category> categories;
    if (testCode == null || testCode.isBlank()) {
      categories = categoryRepository.findAll();
    } else {
      categories = categoryRepository.findByTestCodeOrderByNameAsc(normalizeTestCode(testCode));
    }

    return categories.stream()
        .map(category -> new AdminCategoryResponse(
            category.getId(),
            category.getTestCode(),
            category.getName(),
            category.getWeightPercent()
        ))
        .toList();
  }

  @Transactional
  public AdminCategoryResponse createCategory(UpdateCategoryRequest request) {
    String testCode = normalizeTestCode(request.testCode());
    ensureTestCodeExists(testCode);

    Category category = new Category();
    category.setTestCode(testCode);
    category.setName(request.name().trim());
    category.setWeightPercent(request.weightPercent());

    Category saved = categoryRepository.save(category);
    return new AdminCategoryResponse(saved.getId(), saved.getTestCode(), saved.getName(), saved.getWeightPercent());
  }

  @Transactional
  public AdminCategoryResponse updateCategory(UUID categoryId, UpdateCategoryRequest request) {
    Category category = categoryRepository.findById(categoryId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category not found"));

    String testCode = normalizeTestCode(request.testCode());
    ensureTestCodeExists(testCode);

    category.setTestCode(testCode);
    category.setName(request.name().trim());
    category.setWeightPercent(request.weightPercent());

    Category saved = categoryRepository.save(category);
    return new AdminCategoryResponse(saved.getId(), saved.getTestCode(), saved.getName(), saved.getWeightPercent());
  }

  @Transactional
  public void deleteCategory(UUID categoryId) {
    if (!categoryRepository.existsById(categoryId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "CATEGORY_NOT_FOUND", "Category not found");
    }
    categoryRepository.deleteById(categoryId);
  }

  public CategoryWeightValidationResponse validateWeight(String testCode) {
    String normalized = normalizeTestCode(testCode);
    List<Category> categories = categoryRepository.findByTestCodeOrderByNameAsc(normalized);
    int total = categories.stream().mapToInt(Category::getWeightPercent).sum();
    return new CategoryWeightValidationResponse(normalized, total, total == 100);
  }

  public List<AdminQuestionResponse> listQuestions(String testCode) {
    List<Question> questions;
    if (testCode == null || testCode.isBlank()) {
      questions = questionRepository.findAllWithOptions();
    } else {
      questions = questionRepository.findByTestCodeOrderByOrderIndexAscCreatedAtAsc(normalizeTestCode(testCode));
    }

    return questions.stream().map(this::toQuestionResponse).toList();
  }

  @Transactional
  public AdminQuestionResponse createQuestion(UpdateQuestionRequest request) {
    String testCode = normalizeTestCode(request.testCode());
    ensureTestCodeExists(testCode);

    Question question = new Question();
    applyQuestion(question, testCode, request);
    return toQuestionResponse(questionRepository.save(question));
  }

  @Transactional
  public AdminQuestionResponse updateQuestion(UUID questionId, UpdateQuestionRequest request) {
    Question question = questionRepository.findById(questionId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QUESTION_NOT_FOUND", "Question not found"));

    String testCode = normalizeTestCode(request.testCode());
    ensureTestCodeExists(testCode);

    applyQuestion(question, testCode, request);
    return toQuestionResponse(questionRepository.save(question));
  }

  @Transactional
  public void deleteQuestion(UUID questionId) {
    if (!questionRepository.existsById(questionId)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "QUESTION_NOT_FOUND", "Question not found");
    }
    questionOptionRepository.deleteByQuestionId(questionId);
    questionRepository.deleteById(questionId);
  }

  public byte[] exportQuestionsExcel(String testCode) {
    String normalizedTestCode = normalizeTestCode(testCode);
    ensureTestCodeExists(normalizedTestCode);

    List<Question> questions = questionRepository.findByTestCodeOrderByOrderIndexAscCreatedAtAsc(normalizedTestCode);

    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Questions");
      createHeaderRow(workbook, sheet);

      int rowIndex = 1;
      for (Question question : questions) {
        Row row = sheet.createRow(rowIndex++);
        row.createCell(0).setCellValue(question.getId().toString());
        row.createCell(1).setCellValue(question.getTestCode());
        row.createCell(2).setCellValue(question.getCategory() == null ? "" : question.getCategory().getId().toString());
        row.createCell(3).setCellValue(question.getContent());
        row.createCell(4).setCellValue(question.getTraitKey());
        row.createCell(5).setCellValue(question.isReverseScored());
        row.createCell(6).setCellValue(question.getWeight().doubleValue());
        row.createCell(7).setCellValue(question.getOrderIndex());
      }

      for (int i = 0; i < XLSX_HEADERS.size(); i++) {
        sheet.autoSizeColumn(i);
      }

      workbook.write(outputStream);
      return outputStream.toByteArray();
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EXPORT_XLSX_FAILED", "Failed to export xlsx file");
    }
  }

  /**
   * Generates a lightweight template for admins to download before importing.
   * Includes the required header row plus a single valid sample row (no IDs)
   * so users can see expected formats without needing existing questions.
   */
  public byte[] exportQuestionsTemplateExcel(String testCode) {
    String normalizedTestCode = normalizeTestCode(testCode);

    try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
      Sheet sheet = workbook.createSheet("Template");
      createHeaderRow(workbook, sheet);

      // Sample row that passes import validation; users can overwrite or remove.
      Row sample = sheet.createRow(1);
      sample.createCell(0).setCellValue(""); // id left blank for new question
      sample.createCell(1).setCellValue(normalizedTestCode);
      sample.createCell(2).setCellValue(""); // optional category UUID
      sample.createCell(3).setCellValue("Ví dụ: Nội dung câu hỏi?");
      sample.createCell(4).setCellValue("DISC_D");
      sample.createCell(5).setCellValue(false);
      sample.createCell(6).setCellValue(1);
      sample.createCell(7).setCellValue(1);

      for (int i = 0; i < XLSX_HEADERS.size(); i++) {
        sheet.autoSizeColumn(i);
      }

      workbook.write(outputStream);
      return outputStream.toByteArray();
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "EXPORT_TEMPLATE_FAILED", "Failed to generate template");
    }
  }

  @Transactional
  public ImportQuestionsResponse importQuestionsExcel(MultipartFile file) {
    validateExcelFile(file);

    List<String> validationErrors = new ArrayList<>();
    List<ExcelQuestionRow> rows = new ArrayList<>();
    int totalRows = 0;

    try (Workbook workbook = new XSSFWorkbook(file.getInputStream())) {
      if (workbook.getNumberOfSheets() == 0) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_EMPTY_WORKBOOK", "Excel workbook has no sheets");
      }

      Sheet sheet = workbook.getSheetAt(0);
      DataFormatter formatter = new DataFormatter();

      validateExcelHeader(sheet.getRow(0), formatter, validationErrors);

      if (sheet.getLastRowNum() > MAX_IMPORT_ROWS) {
        validationErrors.add("Too many rows. Maximum supported rows: " + MAX_IMPORT_ROWS);
      }

      Set<UUID> seenIds = new HashSet<>();
      Map<String, Boolean> testCodeValidCache = new HashMap<>();
      Map<UUID, Category> categoryCache = new HashMap<>();
      Map<UUID, Boolean> questionExistsCache = new HashMap<>();

      for (int i = 1; i <= sheet.getLastRowNum(); i++) {
        Row row = sheet.getRow(i);
        if (isBlankRow(row, formatter)) {
          continue;
        }

        totalRows++;
        ExcelQuestionRow parsed = parseExcelRow(
            row,
            i + 1,
            formatter,
            seenIds,
            testCodeValidCache,
            categoryCache,
            questionExistsCache,
            validationErrors
        );

        if (parsed != null) {
          rows.add(parsed);
        }
      }
    } catch (IOException ex) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_XLSX_FILE", "Cannot read xlsx file");
    }

    if (!validationErrors.isEmpty()) {
      throwImportValidation(validationErrors);
    }

    int created = 0;
    int updated = 0;

    for (ExcelQuestionRow row : rows) {
      Question question;
      if (row.id() != null) {
        question = questionRepository.findById(row.id())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "QUESTION_NOT_FOUND", "Question id not found"));
        updated++;
      } else {
        question = new Question();
        created++;
      }

      Category category = null;
      if (row.categoryId() != null) {
        category = categoryRepository.findById(row.categoryId())
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Category not found"));
      }

      question.setTestCode(row.testCode());
      question.setCategory(category);
      question.setContent(row.content());
      question.setTraitKey(row.traitKey());
      question.setReverseScored(row.reverseScored());
      question.setWeight(row.weight());
      question.setOrderIndex(row.orderIndex());

      questionRepository.save(question);
      ensureDefaultOptions(question);
    }

    return new ImportQuestionsResponse(created, updated, 0, totalRows);
  }

  public QuestionsCsvResponse exportQuestionsCsv(String testCode) {
    List<Question> questions = questionRepository.findByTestCodeOrderByOrderIndexAscCreatedAtAsc(normalizeTestCode(testCode));
    StringBuilder csv = new StringBuilder("testCode,categoryId,content,traitKey,reverseScored,weight,orderIndex\n");

    for (Question question : questions) {
      String content = escapeCsv(question.getContent());
      String categoryId = question.getCategory() == null ? "" : question.getCategory().getId().toString();
      csv.append(question.getTestCode()).append(',')
          .append(categoryId).append(',')
          .append(content).append(',')
          .append(question.getTraitKey()).append(',')
          .append(question.isReverseScored()).append(',')
          .append(question.getWeight()).append(',')
          .append(question.getOrderIndex())
          .append('\n');
    }

    return new QuestionsCsvResponse(csv.toString());
  }

  @Transactional
  public ImportQuestionsResponse importQuestionsCsv(ImportQuestionsRequest request) {
    String csv = request.csv();
    String[] lines = csv.split("\\r?\\n");
    int created = 0;
    int skipped = 0;
    int totalRows = 0;

    for (int i = 0; i < lines.length; i++) {
      String line = lines[i].trim();
      if (line.isEmpty()) {
        continue;
      }
      if (i == 0 && line.toLowerCase(Locale.ROOT).startsWith("testcode")) {
        continue;
      }

      totalRows++;
      String[] parts = line.split(",", 7);
      if (parts.length < 7) {
        skipped++;
        continue;
      }

      try {
        String testCode = normalizeTestCode(parts[0]);
        ensureTestCodeExists(testCode);

        UUID categoryId = parseUuidOrNull(parts[1]);
        String content = parts[2].replace("\"", "").trim();
        String traitKey = parts[3].trim().toUpperCase(Locale.ROOT);
        boolean reverseScored = Boolean.parseBoolean(parts[4].trim());
        BigDecimal weight = new BigDecimal(parts[5].trim());
        int orderIndex = Integer.parseInt(parts[6].trim());

        Question question = new Question();
        question.setTestCode(testCode);
        question.setCategory(categoryId == null ? null : categoryRepository.findById(categoryId)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Category not found")));
        question.setContent(content);
        question.setTraitKey(traitKey);
        question.setReverseScored(reverseScored);
        question.setWeight(weight);
        question.setOrderIndex(orderIndex);
        questionRepository.save(question);
        ensureDefaultOptions(question);
        created++;
      } catch (Exception ex) {
        skipped++;
      }
    }

    return new ImportQuestionsResponse(created, 0, skipped, totalRows);
  }

  private void createHeaderRow(Workbook workbook, Sheet sheet) {
    Font headerFont = workbook.createFont();
    headerFont.setBold(true);

    CellStyle headerStyle = workbook.createCellStyle();
    headerStyle.setFont(headerFont);

    Row header = sheet.createRow(0);
    for (int i = 0; i < XLSX_HEADERS.size(); i++) {
      Cell cell = header.createCell(i);
      cell.setCellValue(XLSX_HEADERS.get(i));
      cell.setCellStyle(headerStyle);
    }
  }

  private void validateExcelHeader(Row headerRow, DataFormatter formatter, List<String> errors) {
    if (headerRow == null) {
      errors.add("Missing header row");
      return;
    }

    for (int i = 0; i < XLSX_HEADERS.size(); i++) {
      String expected = normalizeHeader(XLSX_HEADERS.get(i));
      String actual = normalizeHeader(getCellValue(headerRow, i, formatter));
      if (!expected.equals(actual)) {
        errors.add("Invalid header at column " + (i + 1) + ": expected '" + XLSX_HEADERS.get(i) + "'");
      }
    }
  }

  private ExcelQuestionRow parseExcelRow(
      Row row,
      int rowNumber,
      DataFormatter formatter,
      Set<UUID> seenIds,
      Map<String, Boolean> testCodeValidCache,
      Map<UUID, Category> categoryCache,
      Map<UUID, Boolean> questionExistsCache,
      List<String> errors) {
    List<String> rowErrors = new ArrayList<>();

    UUID id = null;
    String idRaw = getCellValue(row, 0, formatter);
    if (!idRaw.isBlank()) {
      try {
        id = UUID.fromString(idRaw);
        if (!seenIds.add(id)) {
          rowErrors.add("duplicate question id in file: " + id);
        }

        boolean exists = questionExistsCache.computeIfAbsent(id, questionRepository::existsById);
        if (!exists) {
          rowErrors.add("question id not found: " + id);
        }
      } catch (IllegalArgumentException ex) {
        rowErrors.add("invalid id format");
      }
    }

    String testCode = null;
    String testCodeRaw = getCellValue(row, 1, formatter);
    if (testCodeRaw.isBlank()) {
      rowErrors.add("testCode is required");
    } else {
      testCode = normalizeTestCode(testCodeRaw);
      boolean validTest = testCodeValidCache.computeIfAbsent(
          testCode,
          code -> testDefinitionRepository.findByCode(code).isPresent()
      );
      if (!validTest) {
        rowErrors.add("testCode not found: " + testCode);
      }
    }

    UUID categoryId = null;
    String categoryRaw = getCellValue(row, 2, formatter);
    if (!categoryRaw.isBlank()) {
      try {
        categoryId = UUID.fromString(categoryRaw);
        Category category = categoryCache.computeIfAbsent(
            categoryId,
            value -> categoryRepository.findById(value).orElse(null)
        );
        if (category == null) {
          rowErrors.add("category not found: " + categoryId);
        } else if (testCode != null && !category.getTestCode().equalsIgnoreCase(testCode)) {
          rowErrors.add("category does not belong to testCode");
        }
      } catch (IllegalArgumentException ex) {
        rowErrors.add("invalid categoryId format");
      }
    }

    String content = getCellValue(row, 3, formatter);
    if (content.isBlank()) {
      rowErrors.add("content is required");
    } else if (content.length() > MAX_CONTENT_LENGTH) {
      rowErrors.add("content length exceeds " + MAX_CONTENT_LENGTH + " characters");
    }

    String traitKey = getCellValue(row, 4, formatter).toUpperCase(Locale.ROOT);
    if (traitKey.isBlank()) {
      rowErrors.add("traitKey is required");
    } else if (!TRAIT_KEY_PATTERN.matcher(traitKey).matches()) {
      rowErrors.add("traitKey must match [A-Z0-9_] and max length 50");
    }

    String reverseRaw = getCellValue(row, 5, formatter);
    Boolean reverseScored = parseBoolean(reverseRaw);
    if (reverseScored == null) {
      rowErrors.add("reverseScored must be TRUE/FALSE or 1/0");
    }

    String weightRaw = getCellValue(row, 6, formatter);
    BigDecimal weight = parseBigDecimal(weightRaw);
    if (weight == null) {
      rowErrors.add("weight must be a valid decimal number");
    } else if (weight.compareTo(BigDecimal.ZERO) <= 0 || weight.compareTo(MAX_WEIGHT) > 0) {
      rowErrors.add("weight must be > 0 and <= " + MAX_WEIGHT);
    }

    String orderIndexRaw = getCellValue(row, 7, formatter);
    Integer orderIndex = parseInteger(orderIndexRaw);
    if (orderIndex == null) {
      rowErrors.add("orderIndex must be an integer");
    } else if (orderIndex < 0 || orderIndex > 1_000_000) {
      rowErrors.add("orderIndex must be between 0 and 1000000");
    }

    if (!rowErrors.isEmpty()) {
      for (String rowError : rowErrors) {
        errors.add("Row " + rowNumber + ": " + rowError);
      }
      return null;
    }

    return new ExcelQuestionRow(
        id,
        testCode,
        categoryId,
        content,
        traitKey,
        reverseScored,
        weight,
        orderIndex
    );
  }

  private void validateExcelFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_FILE_EMPTY", "Excel file is empty");
    }

    String name = file.getOriginalFilename();
    if (name == null || !name.toLowerCase(Locale.ROOT).endsWith(".xlsx")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "IMPORT_FILE_TYPE_INVALID", "Only .xlsx file is supported");
    }
  }

  private boolean isBlankRow(Row row, DataFormatter formatter) {
    if (row == null) {
      return true;
    }

    for (int i = 0; i < XLSX_HEADERS.size(); i++) {
      if (!getCellValue(row, i, formatter).isBlank()) {
        return false;
      }
    }
    return true;
  }

  private String getCellValue(Row row, int index, DataFormatter formatter) {
    if (row == null) {
      return "";
    }

    Cell cell = row.getCell(index);
    if (cell == null) {
      return "";
    }

    return formatter.formatCellValue(cell).trim();
  }

  private String normalizeHeader(String value) {
    if (value == null) {
      return "";
    }
    return value.replace("_", "").replace(" ", "").trim().toLowerCase(Locale.ROOT);
  }

  private Boolean parseBoolean(String raw) {
    if (raw == null) {
      return null;
    }

    String value = raw.trim().toLowerCase(Locale.ROOT);
    return switch (value) {
      case "true", "1", "yes", "y" -> true;
      case "false", "0", "no", "n" -> false;
      default -> null;
    };
  }

  private BigDecimal parseBigDecimal(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }

    try {
      return new BigDecimal(raw.trim());
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private Integer parseInteger(String raw) {
    if (raw == null || raw.isBlank()) {
      return null;
    }

    try {
      return Integer.parseInt(raw.trim());
    } catch (NumberFormatException ex) {
      return null;
    }
  }

  private void throwImportValidation(List<String> errors) {
    int show = Math.min(errors.size(), 20);
    String details = String.join("; ", errors.subList(0, show));
    String suffix = errors.size() > show ? "; ... (" + (errors.size() - show) + " more)" : "";

    throw new ApiException(
        HttpStatus.BAD_REQUEST,
        "IMPORT_VALIDATION_FAILED",
        "Excel validation failed: " + details + suffix
    );
  }

  private void applyQuestion(Question question, String testCode, UpdateQuestionRequest request) {
    Category category = null;
    if (request.categoryId() != null) {
      category = categoryRepository.findById(request.categoryId())
          .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_NOT_FOUND", "Category not found"));
      if (!category.getTestCode().equalsIgnoreCase(testCode)) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "CATEGORY_TEST_MISMATCH", "Category and test code mismatch");
      }
    }

    question.setTestCode(testCode);
    question.setCategory(category);
    question.setContent(request.content().trim());
    question.setTraitKey(request.traitKey().trim().toUpperCase(Locale.ROOT));
    question.setReverseScored(request.reverseScored());
    question.setWeight(request.weight());
    question.setOrderIndex(request.orderIndex());

    // Replace options
    question.getOptions().clear();
    List<UpdateQuestionRequest.QuestionOptionRequest> optionRequests = request.options();
    if (optionRequests == null || optionRequests.isEmpty()) {
      defaultLikertOptions().forEach(opt -> addOption(question, opt.label(), opt.value(), null, null, opt.orderIndex()));
    } else {
      optionRequests.stream()
          .sorted(Comparator.comparing(UpdateQuestionRequest.QuestionOptionRequest::orderIndex))
          .forEach(opt -> addOption(
              question,
              opt.label().trim(),
              opt.value(),
              normalizeDiscDimension(opt.discDimension(), testCode),
              normalizeTraitOverride(opt.traitOverride()),
              opt.orderIndex()
          ));
    }
  }

  private AdminQuestionResponse toQuestionResponse(Question question) {
    List<QuestionOptionResponse> optionResponses = question.getOptions().stream()
        .sorted(Comparator.comparingInt(QuestionOption::getOrderIndex))
        .map(opt -> new QuestionOptionResponse(
            opt.getId(),
            opt.getLabel(),
            opt.getValue(),
            opt.getDiscDimension(),
            opt.getTraitOverride(),
            opt.getOrderIndex()))
        .toList();

    return new AdminQuestionResponse(
        question.getId(),
        question.getTestCode(),
        question.getCategory() == null ? null : question.getCategory().getId(),
        question.getContent(),
        question.getTraitKey(),
        question.isReverseScored(),
        question.getWeight(),
        question.getOrderIndex(),
        optionResponses
    );
  }

  private void ensureTestCodeExists(String testCode) {
    if (testDefinitionRepository.findByCode(testCode).isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "TEST_NOT_FOUND", "Test definition not found");
    }
  }

  private String normalizeTestCode(String testCode) {
    String normalized = testCode.trim().toUpperCase(Locale.ROOT);
    return "DISC".equals(normalized) ? "DISC_FREE" : normalized;
  }

  private UUID parseUuidOrNull(String value) {
    if (value == null || value.trim().isEmpty()) {
      return null;
    }
    return UUID.fromString(value.trim());
  }

  private String escapeCsv(String value) {
    if (value == null) {
      return "";
    }

    if (value.contains(",") || value.contains("\n") || value.contains("\"")) {
      return "\"" + value.replace("\"", "\"\"") + "\"";
    }
    return value;
  }

  private record DefaultOption(String label, int value, int orderIndex) {
  }

  private List<DefaultOption> defaultLikertOptions() {
    return List.of(
        new DefaultOption("Hoàn toàn không đồng ý", 1, 1),
        new DefaultOption("Không đồng ý", 2, 2),
        new DefaultOption("Phân vân", 3, 3),
        new DefaultOption("Đồng ý", 4, 4),
        new DefaultOption("Hoàn toàn đồng ý", 5, 5)
    );
  }

  private void addOption(Question question, String label, int value, String discDimension, String traitOverride, int orderIndex) {
    QuestionOption option = new QuestionOption();
    option.setQuestion(question);
    option.setLabel(label);
    option.setValue(value);
    option.setDiscDimension(discDimension);
    option.setTraitOverride(traitOverride);
    option.setOrderIndex(orderIndex);
    question.getOptions().add(option);
  }

  private void ensureDefaultOptions(Question question) {
    if (question.getOptions() == null || question.getOptions().isEmpty()) {
      defaultLikertOptions().forEach(opt -> addOption(question, opt.label(), opt.value(), null, null, opt.orderIndex()));
      questionRepository.save(question);
    }
  }

  private String normalizeDiscDimension(String raw, String testCode) {
    if (raw == null || raw.isBlank()) return null;
    String up = raw.trim().toUpperCase(Locale.ROOT);
    if (!up.matches("[DISC]")) return null;
    if (!testCode.startsWith("DISC")) return null;
    return up;
  }

  private String normalizeTraitOverride(String raw) {
    if (raw == null || raw.isBlank()) return null;
    String up = raw.trim().toUpperCase(Locale.ROOT);
    if (!TRAIT_KEY_PATTERN.matcher(up).matches()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_TRAIT_OVERRIDE", "Trait override is invalid");
    }
    return up;
  }

  private record ExcelQuestionRow(
      UUID id,
      String testCode,
      UUID categoryId,
      String content,
      String traitKey,
      boolean reverseScored,
      BigDecimal weight,
      int orderIndex
  ) {
  }
}
