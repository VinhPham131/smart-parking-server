import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddTrigramSearchIndexes1747469000000 implements MigrationInterface {
  name = 'AddTrigramSearchIndexes1747469000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pg_trgm`);

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_vehicles_license_plate_trgm" ON "vehicles" USING gin ("license_plate" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_name_trgm" ON "users" USING gin ("name" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_email_trgm" ON "users" USING gin ("email" gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_users_phone_trgm" ON "users" USING gin ("phone" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_reservations_reservation_code_trgm" ON "reservations" USING gin ("reservation_code" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_rfid_rfid_code_trgm" ON "rfid" USING gin ("rfid_code" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_payments_history_description_trgm" ON "payments_history" USING gin ("description" gin_trgm_ops)`,
    );

    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_parking_areas_name_trgm" ON "parking_areas" USING gin ("name" gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const indexes = [
      'IDX_parking_areas_name_trgm',
      'IDX_payments_history_description_trgm',
      'IDX_rfid_rfid_code_trgm',
      'IDX_reservations_reservation_code_trgm',
      'IDX_users_phone_trgm',
      'IDX_users_email_trgm',
      'IDX_users_name_trgm',
      'IDX_vehicles_license_plate_trgm',
    ];

    for (const name of indexes) {
      await queryRunner.query(`DROP INDEX IF EXISTS "${name}"`);
    }

    await queryRunner.query(`DROP EXTENSION IF EXISTS pg_trgm`);
  }
}
