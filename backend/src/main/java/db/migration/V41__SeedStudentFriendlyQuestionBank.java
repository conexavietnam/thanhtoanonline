package db.migration;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V41__SeedStudentFriendlyQuestionBank extends BaseJavaMigration {
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
  private static final List<String> TARGET_TEST_CODES = List.of("DISC_FREE", "DISC_PAID", "BIG_FIVE", "IKIGAI");
  private static final List<OptionSeed> STUDENT_LIKERT_OPTIONS = List.of(
      new OptionSeed("Rất không giống em", 1, null, null, 1),
      new OptionSeed("Không giống em lắm", 2, null, null, 2),
      new OptionSeed("Khó nói", 3, null, null, 3),
      new OptionSeed("Khá giống em", 4, null, null, 4),
      new OptionSeed("Rất giống em", 5, null, null, 5));

  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    // Quốc Trí: thay question bank cũ bằng bộ câu hỏi học sinh dễ trả lời hơn nhưng vẫn giữ lịch sử answer cũ.
    deleteUnusedQuestions(connection);
    pushReferencedQuestionsToLegacyOrder(connection);
    deleteExistingCategories(connection);

    Map<String, UUID> categoryIds = insertCategories(connection);
    insertQuestions(connection, categoryIds);
    updateQuestionDistribution(connection);
  }

  private void deleteUnusedQuestions(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        DELETE FROM questions q
        WHERE q.test_code = ANY (?)
          AND NOT EXISTS (
            SELECT 1
            FROM answers a
            WHERE a.question_id = q.id
          )
        """)) {
      statement.setArray(1, connection.createArrayOf("varchar", TARGET_TEST_CODES.toArray()));
      statement.executeUpdate();
    }
  }

  private void pushReferencedQuestionsToLegacyOrder(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        UPDATE questions
        SET order_index = CASE
          WHEN order_index < 1000 THEN order_index + 1000
          ELSE order_index
        END
        WHERE test_code = ANY (?)
        """)) {
      statement.setArray(1, connection.createArrayOf("varchar", TARGET_TEST_CODES.toArray()));
      statement.executeUpdate();
    }
  }

  private void deleteExistingCategories(Connection connection) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        DELETE FROM categories
        WHERE test_code = ANY (?)
        """)) {
      statement.setArray(1, connection.createArrayOf("varchar", TARGET_TEST_CODES.toArray()));
      statement.executeUpdate();
    }
  }

  private Map<String, UUID> insertCategories(Connection connection) throws SQLException {
    Map<String, UUID> categoryIds = new LinkedHashMap<>();
    for (CategorySeed category : categories()) {
      UUID categoryId = insertCategory(connection, category);
      categoryIds.put(category.key(), categoryId);
    }
    return categoryIds;
  }

  private UUID insertCategory(Connection connection, CategorySeed category) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        INSERT INTO categories (test_code, name, weight_percent)
        VALUES (?, ?, ?)
        RETURNING id
        """)) {
      statement.setString(1, category.testCode());
      statement.setString(2, category.name());
      statement.setInt(3, category.weightPercent());
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return UUID.fromString(resultSet.getString("id"));
        }
      }
    }
    throw new SQLException("Unable to insert category for " + category.testCode() + " / " + category.name());
  }

  private void insertQuestions(Connection connection, Map<String, UUID> categoryIds) throws SQLException {
    for (QuestionSeed question : questions()) {
      UUID categoryId = categoryIds.get(question.categoryKey());
      if (categoryId == null) {
        throw new SQLException("Missing category id for key " + question.categoryKey());
      }
      UUID questionId = insertQuestion(connection, question, categoryId);
      insertOptions(connection, questionId, question.options());
    }
  }

  private UUID insertQuestion(Connection connection, QuestionSeed question, UUID categoryId) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        INSERT INTO questions (test_code, category_id, content, trait_key, reverse_scored, weight, order_index)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        RETURNING id
        """)) {
      statement.setString(1, question.testCode());
      statement.setObject(2, categoryId);
      statement.setString(3, question.content());
      statement.setString(4, question.traitKey());
      statement.setBoolean(5, question.reverseScored());
      statement.setBigDecimal(6, question.weight());
      statement.setInt(7, question.orderIndex());
      try (ResultSet resultSet = statement.executeQuery()) {
        if (resultSet.next()) {
          return UUID.fromString(resultSet.getString("id"));
        }
      }
    }
    throw new SQLException("Unable to insert question " + question.testCode() + " #" + question.orderIndex());
  }

  private void insertOptions(Connection connection, UUID questionId, List<OptionSeed> options) throws SQLException {
    try (PreparedStatement statement = connection.prepareStatement("""
        INSERT INTO question_options (question_id, label, value, disc_dimension, trait_override, order_index)
        VALUES (?, ?, ?, ?, ?, ?)
        """)) {
      for (OptionSeed option : options) {
        statement.setObject(1, questionId);
        statement.setString(2, option.label());
        statement.setInt(3, option.value());
        statement.setString(4, option.discDimension());
        statement.setString(5, option.traitOverride());
        statement.setInt(6, option.orderIndex());
        statement.addBatch();
      }
      statement.executeBatch();
    }
  }

  private void updateQuestionDistribution(Connection connection) throws Exception {
    Map<String, Object> patch = new LinkedHashMap<>();
    patch.put("questionDistributionFree", Map.of("disc", 12, "bigFive", 10, "ikigai", 8));
    patch.put("questionDistributionPaid", Map.of("disc", 12, "bigFive", 10, "ikigai", 8));
    patch.put("maxQuestionsPerTestFree", 30);
    patch.put("maxQuestionsPerTest", 30);

    try (PreparedStatement statement = connection.prepareStatement("""
        UPDATE app_settings
        SET data = COALESCE(data, '{}'::jsonb) || ?::jsonb
        WHERE id = 1
        """)) {
      statement.setString(1, OBJECT_MAPPER.writeValueAsString(patch));
      statement.executeUpdate();
    }
  }

  private List<CategorySeed> categories() {
    return List.of(
        new CategorySeed("DISC_FREE", "disc_free_study", "Cách bắt đầu việc mới", 25),
        new CategorySeed("DISC_FREE", "disc_free_communication", "Cách giao tiếp và kết nối", 25),
        new CategorySeed("DISC_FREE", "disc_free_teamwork", "Cách làm việc nhóm", 25),
        new CategorySeed("DISC_FREE", "disc_free_pressure", "Cách phản ứng khi áp lực", 25),
        new CategorySeed("DISC_PAID", "disc_paid_study", "Cách bắt đầu việc mới", 25),
        new CategorySeed("DISC_PAID", "disc_paid_communication", "Cách giao tiếp và kết nối", 25),
        new CategorySeed("DISC_PAID", "disc_paid_teamwork", "Cách làm việc nhóm", 25),
        new CategorySeed("DISC_PAID", "disc_paid_pressure", "Cách phản ứng khi áp lực", 25),
        new CategorySeed("BIG_FIVE", "big_five_openness", "Cởi mở", 20),
        new CategorySeed("BIG_FIVE", "big_five_conscientiousness", "Kỷ luật", 20),
        new CategorySeed("BIG_FIVE", "big_five_extraversion", "Hướng ngoại", 20),
        new CategorySeed("BIG_FIVE", "big_five_agreeableness", "Hợp tác", 20),
        new CategorySeed("BIG_FIVE", "big_five_neuroticism", "Cảm xúc", 20),
        new CategorySeed("IKIGAI", "ikigai_passion", "Điều em thích", 25),
        new CategorySeed("IKIGAI", "ikigai_strength", "Điều em làm tốt", 25),
        new CategorySeed("IKIGAI", "ikigai_value", "Giá trị em muốn tạo ra", 25),
        new CategorySeed("IKIGAI", "ikigai_opportunity", "Cơ hội tương lai", 25));
  }

  private List<QuestionSeed> questions() {
    return List.of(
        discQuestion("DISC_FREE", 1, "disc_free_study", "Khi giáo viên giao một nhiệm vụ mới, em thường bắt đầu theo cách nào?",
            discOptions(
                "Muốn làm nhanh để sớm có kết quả", "D",
                "Rủ bạn trao đổi cho có hứng", "I",
                "Làm từng bước quen thuộc để thấy yên tâm", "S",
                "Đọc kỹ yêu cầu để tránh sai", "C")),
        discQuestion("DISC_FREE", 2, "disc_free_study", "Khi phải chọn giữa nhiều cách làm bài, em thường nghiêng về...",
            discOptions(
                "Cách đạt kết quả nhanh nhất", "D",
                "Cách dễ trao đổi với bạn bè", "I",
                "Cách ổn định và ít căng thẳng nhất", "S",
                "Cách rõ ràng và có lý do chắc chắn", "C")),
        discQuestion("DISC_FREE", 3, "disc_free_study", "Khi có cơ hội mới như câu lạc bộ, cuộc thi hoặc dự án, em thường...",
            discOptions(
                "Muốn thử ngay xem mình tiến nhanh đến đâu", "D",
                "Thấy hào hứng vì được gặp thêm nhiều người", "I",
                "Cân nhắc xem có hợp lịch sinh hoạt của mình không", "S",
                "Tìm hiểu kỹ thông tin rồi mới quyết định", "C")),
        discQuestion("DISC_FREE", 4, "disc_free_communication", "Trong lớp hoặc trong nhóm bạn, em thường...",
            discOptions(
                "Nói thẳng điều mình nghĩ khi cần", "D",
                "Dễ bắt chuyện và tạo không khí vui", "I",
                "Lắng nghe trước rồi mới nói", "S",
                "Chỉ lên tiếng khi đã nghĩ khá kỹ", "C")),
        discQuestion("DISC_FREE", 5, "disc_free_communication", "Khi góp ý cho một người bạn, em thường...",
            discOptions(
                "Nói rõ vấn đề để sửa nhanh", "D",
                "Bắt đầu bằng cách động viên trước", "I",
                "Chọn lời nhẹ nhàng để bạn không buồn", "S",
                "Đưa ví dụ cụ thể để bạn hiểu hơn", "C")),
        discQuestion("DISC_FREE", 6, "disc_free_communication", "Khi thuyết trình hoặc trình bày ý tưởng, em muốn...",
            discOptions(
                "Nhấn vào mục tiêu và kết quả chính", "D",
                "Kể sao cho sinh động và cuốn hút", "I",
                "Để mọi người đều thấy thoải mái khi nghe", "S",
                "Trình bày có cấu trúc rõ ràng", "C")),
        discQuestion("DISC_FREE", 7, "disc_free_teamwork", "Khi làm bài tập nhóm, em thường nhận phần nào trước?",
            discOptions(
                "Phần khó hoặc phần quyết định kết quả", "D",
                "Phần cần giao tiếp hoặc kết nối mọi người", "I",
                "Phần hỗ trợ để cả nhóm làm đều nhịp", "S",
                "Phần cần kiểm tra, sắp xếp hoặc tổng hợp", "C")),
        discQuestion("DISC_FREE", 8, "disc_free_teamwork", "Nếu một bạn trong nhóm làm chậm hơn dự kiến, em thường...",
            discOptions(
                "Nhắc để nhóm quay lại tiến độ nhanh hơn", "D",
                "Động viên để bạn có thêm tinh thần", "I",
                "Hỗ trợ bạn làm từng bước", "S",
                "Tìm xem bạn đang vướng ở chỗ nào", "C")),
        discQuestion("DISC_FREE", 9, "disc_free_teamwork", "Khi nhóm đã làm xong tốt một việc, em thường...",
            discOptions(
                "Nghĩ ngay đến mục tiêu tiếp theo", "D",
                "Chia sẻ niềm vui với cả nhóm", "I",
                "Cảm ơn mọi người vì đã phối hợp ổn", "S",
                "Kiểm tra lại để chắc không còn lỗi", "C")),
        discQuestion("DISC_FREE", 10, "disc_free_pressure", "Khi sắp đến hạn nộp bài mà còn nhiều việc, em thường...",
            discOptions(
                "Chốt phần quan trọng nhất trước", "D",
                "Hỏi thêm người khác để phối hợp nhanh hơn", "I",
                "Bình tĩnh làm lần lượt từng phần", "S",
                "Lập lại danh sách việc cần làm cho rõ", "C")),
        discQuestion("DISC_FREE", 11, "disc_free_pressure", "Khi lịch học hoặc kế hoạch thay đổi đột ngột, em thường...",
            discOptions(
                "Đổi cách làm ngay để theo kịp", "D",
                "Tìm người trao đổi để đỡ căng hơn", "I",
                "Cần chút thời gian để quen lại nhịp", "S",
                "Muốn biết rõ lý do và cách xử lý", "C")),
        discQuestion("DISC_FREE", 12, "disc_free_pressure", "Khi bị nhắc lỗi hoặc bị chê, phản ứng đầu tiên của em thường là...",
            discOptions(
                "Muốn sửa ngay để không lặp lại", "D",
                "Muốn nói chuyện cho hiểu nhau hơn", "I",
                "Giữ im lặng một lúc rồi mới xử lý", "S",
                "Xem kỹ mình sai ở chỗ nào", "C")),

        discQuestion("DISC_PAID", 1, "disc_paid_study", "Khi giáo viên giao một nhiệm vụ mới, em thường bắt đầu theo cách nào?",
            discOptions(
                "Muốn làm nhanh để sớm có kết quả", "D",
                "Rủ bạn trao đổi cho có hứng", "I",
                "Làm từng bước quen thuộc để thấy yên tâm", "S",
                "Đọc kỹ yêu cầu để tránh sai", "C")),
        discQuestion("DISC_PAID", 2, "disc_paid_study", "Khi phải chọn giữa nhiều cách làm bài, em thường nghiêng về...",
            discOptions(
                "Cách đạt kết quả nhanh nhất", "D",
                "Cách dễ trao đổi với bạn bè", "I",
                "Cách ổn định và ít căng thẳng nhất", "S",
                "Cách rõ ràng và có lý do chắc chắn", "C")),
        discQuestion("DISC_PAID", 3, "disc_paid_study", "Khi có cơ hội mới như câu lạc bộ, cuộc thi hoặc dự án, em thường...",
            discOptions(
                "Muốn thử ngay xem mình tiến nhanh đến đâu", "D",
                "Thấy hào hứng vì được gặp thêm nhiều người", "I",
                "Cân nhắc xem có hợp lịch sinh hoạt của mình không", "S",
                "Tìm hiểu kỹ thông tin rồi mới quyết định", "C")),
        discQuestion("DISC_PAID", 4, "disc_paid_communication", "Trong lớp hoặc trong nhóm bạn, em thường...",
            discOptions(
                "Nói thẳng điều mình nghĩ khi cần", "D",
                "Dễ bắt chuyện và tạo không khí vui", "I",
                "Lắng nghe trước rồi mới nói", "S",
                "Chỉ lên tiếng khi đã nghĩ khá kỹ", "C")),
        discQuestion("DISC_PAID", 5, "disc_paid_communication", "Khi góp ý cho một người bạn, em thường...",
            discOptions(
                "Nói rõ vấn đề để sửa nhanh", "D",
                "Bắt đầu bằng cách động viên trước", "I",
                "Chọn lời nhẹ nhàng để bạn không buồn", "S",
                "Đưa ví dụ cụ thể để bạn hiểu hơn", "C")),
        discQuestion("DISC_PAID", 6, "disc_paid_communication", "Khi thuyết trình hoặc trình bày ý tưởng, em muốn...",
            discOptions(
                "Nhấn vào mục tiêu và kết quả chính", "D",
                "Kể sao cho sinh động và cuốn hút", "I",
                "Để mọi người đều thấy thoải mái khi nghe", "S",
                "Trình bày có cấu trúc rõ ràng", "C")),
        discQuestion("DISC_PAID", 7, "disc_paid_teamwork", "Khi làm bài tập nhóm, em thường nhận phần nào trước?",
            discOptions(
                "Phần khó hoặc phần quyết định kết quả", "D",
                "Phần cần giao tiếp hoặc kết nối mọi người", "I",
                "Phần hỗ trợ để cả nhóm làm đều nhịp", "S",
                "Phần cần kiểm tra, sắp xếp hoặc tổng hợp", "C")),
        discQuestion("DISC_PAID", 8, "disc_paid_teamwork", "Nếu một bạn trong nhóm làm chậm hơn dự kiến, em thường...",
            discOptions(
                "Nhắc để nhóm quay lại tiến độ nhanh hơn", "D",
                "Động viên để bạn có thêm tinh thần", "I",
                "Hỗ trợ bạn làm từng bước", "S",
                "Tìm xem bạn đang vướng ở chỗ nào", "C")),
        discQuestion("DISC_PAID", 9, "disc_paid_teamwork", "Khi nhóm đã làm xong tốt một việc, em thường...",
            discOptions(
                "Nghĩ ngay đến mục tiêu tiếp theo", "D",
                "Chia sẻ niềm vui với cả nhóm", "I",
                "Cảm ơn mọi người vì đã phối hợp ổn", "S",
                "Kiểm tra lại để chắc không còn lỗi", "C")),
        discQuestion("DISC_PAID", 10, "disc_paid_pressure", "Khi sắp đến hạn nộp bài mà còn nhiều việc, em thường...",
            discOptions(
                "Chốt phần quan trọng nhất trước", "D",
                "Hỏi thêm người khác để phối hợp nhanh hơn", "I",
                "Bình tĩnh làm lần lượt từng phần", "S",
                "Lập lại danh sách việc cần làm cho rõ", "C")),
        discQuestion("DISC_PAID", 11, "disc_paid_pressure", "Khi lịch học hoặc kế hoạch thay đổi đột ngột, em thường...",
            discOptions(
                "Đổi cách làm ngay để theo kịp", "D",
                "Tìm người trao đổi để đỡ căng hơn", "I",
                "Cần chút thời gian để quen lại nhịp", "S",
                "Muốn biết rõ lý do và cách xử lý", "C")),
        discQuestion("DISC_PAID", 12, "disc_paid_pressure", "Khi bị nhắc lỗi hoặc bị chê, phản ứng đầu tiên của em thường là...",
            discOptions(
                "Muốn sửa ngay để không lặp lại", "D",
                "Muốn nói chuyện cho hiểu nhau hơn", "I",
                "Giữ im lặng một lúc rồi mới xử lý", "S",
                "Xem kỹ mình sai ở chỗ nào", "C")),

        likertQuestion("BIG_FIVE", 1, "big_five_openness", "Em thích thử cách học mới hoặc ý tưởng mới thay vì lúc nào cũng làm giống hệt cũ.", "BIG5_O", false),
        likertQuestion("BIG_FIVE", 2, "big_five_openness", "Nếu một cách làm mới còn lạ, em thường ngại thử ngay.", "BIG5_O", true),
        likertQuestion("BIG_FIVE", 3, "big_five_conscientiousness", "Em thường chia việc thành từng bước để dễ hoàn thành.", "BIG5_C", false),
        likertQuestion("BIG_FIVE", 4, "big_five_conscientiousness", "Em hay để gần sát hạn mới bắt đầu việc quan trọng.", "BIG5_C", true),
        likertQuestion("BIG_FIVE", 5, "big_five_extraversion", "Em thường chủ động bắt chuyện hoặc tham gia hoạt động cùng người khác.", "BIG5_E", false),
        likertQuestion("BIG_FIVE", 6, "big_five_extraversion", "Sau khi nói chuyện với nhiều người, em thường muốn ở yên một mình thật lâu.", "BIG5_E", true),
        likertQuestion("BIG_FIVE", 7, "big_five_agreeableness", "Khi không cùng ý với bạn, em vẫn cố nói chuyện tử tế.", "BIG5_A", false),
        likertQuestion("BIG_FIVE", 8, "big_five_agreeableness", "Khi ai đó làm không đúng ý, em dễ bực và nói gắt.", "BIG5_A", true),
        likertQuestion("BIG_FIVE", 9, "big_five_neuroticism", "Em dễ lo lắng nhiều khi chuyện còn chưa rõ ràng.", "BIG5_N", false),
        likertQuestion("BIG_FIVE", 10, "big_five_neuroticism", "Khi áp lực tăng lên, em vẫn giữ được bình tĩnh khá tốt.", "BIG5_N", true),

        likertQuestion("IKIGAI", 1, "ikigai_passion", "Có những việc em sẵn sàng làm lâu mà không cần ai nhắc.", "IKIGAI_LOVE", false),
        likertQuestion("IKIGAI", 2, "ikigai_passion", "Khi học hoặc tham gia hoạt động mình thích, em thấy rất có năng lượng.", "IKIGAI_LOVE", false),
        likertQuestion("IKIGAI", 3, "ikigai_strength", "Em có vài điểm mạnh mà thầy cô, bạn bè hoặc gia đình thường công nhận.", "IKIGAI_SKILL", false),
        likertQuestion("IKIGAI", 4, "ikigai_strength", "Khi làm việc mình giỏi, em thường thấy tự tin và tiến bộ nhanh.", "IKIGAI_SKILL", false),
        likertQuestion("IKIGAI", 5, "ikigai_value", "Em muốn việc mình làm sau này giúp ích cho người khác chứ không chỉ cho riêng mình.", "IKIGAI_NEED", false),
        likertQuestion("IKIGAI", 6, "ikigai_value", "Em hứng thú hơn với những hoạt động tạo ra ích lợi thật cho lớp, trường hoặc cộng đồng.", "IKIGAI_NEED", false),
        likertQuestion("IKIGAI", 7, "ikigai_opportunity", "Em đã bắt đầu hình dung sở thích hoặc điểm mạnh nào có thể trở thành nghề phù hợp sau này.", "IKIGAI_PAID", false),
        likertQuestion("IKIGAI", 8, "ikigai_opportunity", "Em tin rằng điều mình thích và làm tốt có thể mở ra cơ hội học tập hoặc công việc trong tương lai.", "IKIGAI_PAID", false));
  }

  private QuestionSeed discQuestion(
      String testCode,
      int orderIndex,
      String categoryKey,
      String content,
      List<OptionSeed> options) {
    return new QuestionSeed(testCode, categoryKey, orderIndex, content, "DISC_D", false, BigDecimal.ONE, options);
  }

  private QuestionSeed likertQuestion(
      String testCode,
      int orderIndex,
      String categoryKey,
      String content,
      String traitKey,
      boolean reverseScored) {
    return new QuestionSeed(testCode, categoryKey, orderIndex, content, traitKey, reverseScored, BigDecimal.ONE, STUDENT_LIKERT_OPTIONS);
  }

  private List<OptionSeed> discOptions(
      String option1Label,
      String option1Dimension,
      String option2Label,
      String option2Dimension,
      String option3Label,
      String option3Dimension,
      String option4Label,
      String option4Dimension) {
    return List.of(
        new OptionSeed(option1Label, 1, option1Dimension, null, 1),
        new OptionSeed(option2Label, 1, option2Dimension, null, 2),
        new OptionSeed(option3Label, 1, option3Dimension, null, 3),
        new OptionSeed(option4Label, 1, option4Dimension, null, 4));
  }

  private record CategorySeed(String testCode, String key, String name, int weightPercent) {
  }

  private record QuestionSeed(
      String testCode,
      String categoryKey,
      int orderIndex,
      String content,
      String traitKey,
      boolean reverseScored,
      BigDecimal weight,
      List<OptionSeed> options) {
  }

  private record OptionSeed(
      String label,
      int value,
      String discDimension,
      String traitOverride,
      int orderIndex) {
  }
}
