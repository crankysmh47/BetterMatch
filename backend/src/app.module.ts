import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlignmentModule } from './alignment/alignment.module';
import { HistoryModule } from './history/history.module';
import { AlignmentHistory } from './history/entities/alignment-history.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASSWORD', 'postgres'),
        database: config.get('DB_NAME', 'bettermatch'),
        entities: [AlignmentHistory],
        synchronize: true,   // auto-migrates in dev; disable in production
        logging: config.get('DB_LOGGING', 'false') === 'true',
      }),
    }),

    AlignmentModule,
    HistoryModule,
  ],
})
export class AppModule {}
