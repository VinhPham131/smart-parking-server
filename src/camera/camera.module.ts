import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { CameraService } from './camera.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 30_000,
      maxRedirects: 0,
    }),
  ],
  providers: [CameraService],
  exports: [CameraService],
})
export class CameraModule {}
