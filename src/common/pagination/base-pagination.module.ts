import { Global } from "@nestjs/common";
import { Module } from '@nestjs/common';
import { BaseRepository } from "./base.repository";

@Global()
@Module({
    providers: [BaseRepository],
    exports: [BaseRepository,
    ],
})
export class BasePaginationModule { }