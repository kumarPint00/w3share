import { PartialType } from '@nestjs/swagger';
import { CreateGiftpackDto } from './create-giftpack.dto';

export class UpdateGiftpackDto extends PartialType(CreateGiftpackDto) {}

