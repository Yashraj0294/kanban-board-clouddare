import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { LoggerModule } from 'nestjs-pino';
import { AuthModule } from '../auth/auth.module';
import { BoardsModule } from '../boards/boards.module';
import { CardsModule } from '../cards/cards.module';
import { ColumnsModule } from '../columns/columns.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env['NODE_ENV'] !== 'production'
            ? { target: 'pino-pretty', options: { singleLine: true } }
            : undefined,
        level: process.env['LOG_LEVEL'] || 'info',
        autoLogging: true,
        quietReqLogger: true,
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_URI'),
      }),
    }),
    UsersModule,
    AuthModule,
    BoardsModule,
    ColumnsModule,
    CardsModule,
  ],
})
export class AppModule {}

