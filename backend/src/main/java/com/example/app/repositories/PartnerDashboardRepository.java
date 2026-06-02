package com.example.app.repositories;

import com.example.app.dto.response.PartnerDashboardSummaryResponse;
import java.util.UUID;
import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class PartnerDashboardRepository {
  private final NamedParameterJdbcTemplate jdbcTemplate;

  public PartnerDashboardRepository(NamedParameterJdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  public PartnerDashboardSummaryResponse summaryByUserId(UUID userId) {
    String sql = """
        SELECT
          u.pdf_credits AS pdf_credits,
          COALESCE((
            SELECT COUNT(*)
            FROM test_sessions ts
            WHERE ts.owner_user_id = u.id
          ), 0) AS total_tests,
          COALESCE((
            SELECT COUNT(*)
            FROM pdf_exports pe
            JOIN test_sessions ts ON ts.id = pe.session_id
            WHERE ts.owner_user_id = u.id
          ), 0) AS total_pdf_exports,
          COALESCE((
            SELECT SUM(o.amount_vnd)
            FROM orders o
            WHERE o.user_id = u.id
              AND o.status = 'COMPLETED'::order_status
          ), 0) AS total_revenue_vnd,
          COALESCE((
            SELECT SUM(ts.cost_vnd)
            FROM test_sessions ts
            WHERE ts.owner_user_id = u.id
          ), 0) AS total_cost_vnd
        FROM users u
        WHERE u.id = :userId
        """;

    MapSqlParameterSource params = new MapSqlParameterSource("userId", userId);

    return jdbcTemplate.queryForObject(sql, params, (rs, rowNum) ->
        new PartnerDashboardSummaryResponse(
            rs.getInt("pdf_credits"),
            rs.getLong("total_tests"),
            rs.getLong("total_pdf_exports"),
            rs.getLong("total_revenue_vnd"),
            rs.getLong("total_cost_vnd")
        )
    );
  }
}
