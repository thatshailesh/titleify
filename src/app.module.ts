import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TitleGenerationModule } from './modules/title-generation/title-generation.module';
import { validate } from './config/validation';
import { ClsModule } from 'nestjs-cls'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,
      isGlobal: true
    }),
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        generateId: true,
      }
    }),
    TitleGenerationModule
  ],
})
export class AppModule {}
