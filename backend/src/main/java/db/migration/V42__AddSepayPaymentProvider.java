package db.migration;

import java.sql.Connection;
import java.sql.Statement;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

public class V42__AddSepayPaymentProvider extends BaseJavaMigration {
  @Override
  public void migrate(Context context) throws Exception {
    Connection connection = context.getConnection();
    try (Statement stmt = connection.createStatement()) {
      stmt.execute("ALTER TYPE payment_provider ADD VALUE IF NOT EXISTS 'SEPAY'");
    }
  }
}
