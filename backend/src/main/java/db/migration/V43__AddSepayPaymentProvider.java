package db.migration;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V43__AddSepayPaymentProvider extends BaseJavaMigration {
  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    try (Statement stmt = connection.createStatement()) {
      try (ResultSet rs = stmt.executeQuery(
          "SELECT 1 FROM pg_enum e "
              + "JOIN pg_type t ON t.oid = e.enumtypid "
              + "WHERE t.typname = 'payment_provider' AND e.enumlabel = 'SEPAY'")) {
        if (rs.next()) {
          return;
        }
      }
      stmt.execute("ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'SEPAY'");
    }
  }
}
